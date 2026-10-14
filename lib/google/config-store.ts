import { drive_v3, google } from "googleapis";
import { unstable_cache, revalidateTag } from "next/cache";
import { z } from "zod";
import { getGoogleAuthClient } from "@/lib/google/auth";
import { AppConfig } from "@/lib/types";
import { FORM_V1_INTRO, FORM_V1_TITLE, formV1Questions } from "@/lib/questions/v1";
import { FORM_V2_INTRO, FORM_V2_TITLE, formV2Questions } from "@/lib/questions/v2";

// Same Shared Drive that already holds the v1/v2 response folders.
const SHARED_DRIVE_ID = "0AMQWmFbnA9KxUk9PVA";
const CONFIG_FILENAME = "launchpad-form-config.json";

export const FORM_CONFIG_CACHE_TAG = "form-config";
// Safety-net TTL in case an explicit revalidateTag() call is ever skipped.
// Admin saves call revalidateTag() directly so changes normally go live
// immediately, well before this window elapses.
const CACHE_REVALIDATE_SECONDS = 300;

const questionOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const questionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["short_text", "long_text", "email", "phone", "single_choice", "multiple_choice"]),
  title: z.string().min(1),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(questionOptionSchema).optional(),
});

const introSchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedTime: z.string().optional(),
  cta: z.string().optional(),
});

const formConfigSchema = z.object({
  title: z.string().min(1),
  intro: introSchema,
  questions: z.array(questionSchema).min(1),
});

export const appConfigSchema = z.object({
  v1: formConfigSchema,
  v2: formConfigSchema,
});

function getSeedConfig(): AppConfig {
  return {
    v1: { title: FORM_V1_TITLE, intro: FORM_V1_INTRO, questions: formV1Questions },
    v2: { title: FORM_V2_TITLE, intro: FORM_V2_INTRO, questions: formV2Questions },
  };
}

function getDriveClient(): drive_v3.Drive {
  const auth = getGoogleAuthClient();
  return google.drive({ version: "v3", auth });
}

async function findConfigFileId(drive: drive_v3.Drive): Promise<string | null> {
  const res = await drive.files.list({
    corpora: "drive",
    driveId: SHARED_DRIVE_ID,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    spaces: "drive",
    q: `name = '${CONFIG_FILENAME}' and trashed = false`,
    fields: "files(id, name, createdTime)",
    orderBy: "createdTime",
  });
  const files = res.data.files ?? [];
  if (files.length === 0) return null;

  if (files.length > 1) {
    // Self-heal a create/create race (e.g. two concurrent cold starts on
    // Vercel both finding no config file and both creating one): keep the
    // oldest file as the single source of truth and trash the rest.
    const [keep, ...extras] = files;
    await Promise.allSettled(
      extras.map((f) =>
        f.id
          ? drive.files.update({
              fileId: f.id,
              requestBody: { trashed: true },
              supportsAllDrives: true,
            })
          : Promise.resolve()
      )
    );
    return keep.id ?? null;
  }

  return files[0].id ?? null;
}

async function createConfigFile(drive: drive_v3.Drive, config: AppConfig): Promise<string> {
  const res = await drive.files.create({
    requestBody: {
      name: CONFIG_FILENAME,
      parents: [SHARED_DRIVE_ID],
      mimeType: "application/json",
    },
    media: {
      mimeType: "application/json",
      body: JSON.stringify(config, null, 2),
    },
    fields: "id",
    supportsAllDrives: true,
  });
  if (!res.data.id) {
    throw new Error("Could not create the form config file in Google Drive");
  }
  return res.data.id;
}

async function readConfigFile(drive: drive_v3.Drive, fileId: string): Promise<AppConfig> {
  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "text" }
  );
  const raw = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
  const parsed = JSON.parse(raw);
  const validated = appConfigSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Stored form config is invalid: ${validated.error.message}`);
  }
  return validated.data;
}

async function fetchOrSeedAppConfig(): Promise<AppConfig> {
  const drive = getDriveClient();

  const fileId = await findConfigFileId(drive);
  if (!fileId) {
    // First run: the Drive file doesn't exist yet. Seed it with today's
    // real, live content from lib/questions/v1.ts and v2.ts so the admin
    // starts from what's actually live, not an empty form.
    const seed = getSeedConfig();
    await createConfigFile(drive, seed);
    return seed;
  }

  return readConfigFile(drive, fileId);
}

const getCachedAppConfig = unstable_cache(fetchOrSeedAppConfig, ["launchpad-app-config"], {
  tags: [FORM_CONFIG_CACHE_TAG],
  revalidate: CACHE_REVALIDATE_SECONDS,
});

/**
 * Cached read used by the public /v1 and /v2 pages (and the admin panel).
 * Only hits the Drive API on a cache miss (first load, after the 5 minute
 * safety-net TTL, or right after an admin save invalidates the tag).
 */
export async function getAppConfig(): Promise<AppConfig> {
  return getCachedAppConfig();
}

/**
 * Writes the full config back to the same Drive file and immediately
 * invalidates the cache so the public pages reflect the change on their
 * very next request.
 */
export async function saveAppConfig(config: AppConfig): Promise<void> {
  const validated = appConfigSchema.parse(config);
  const drive = getDriveClient();

  const fileId = await findConfigFileId(drive);
  if (!fileId) {
    await createConfigFile(drive, validated);
  } else {
    await drive.files.update({
      fileId,
      media: {
        mimeType: "application/json",
        body: JSON.stringify(validated, null, 2),
      },
      supportsAllDrives: true,
    });
  }

  revalidateTag(FORM_CONFIG_CACHE_TAG);
}
