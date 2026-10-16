import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGoogleAuthClient } from "@/lib/google/auth";
import { createAssetSubfolders, createRespondentFolder } from "@/lib/google/drive";
import { createResponseDoc } from "@/lib/google/docs";
import { notifyIntakeSubmission } from "@/lib/ghl";

export const runtime = "nodejs";

const payloadSchema = z.object({
  formSlug: z.enum(["v1", "v2"]),
  formTitle: z.string().min(1),
  respondentLabel: z.string().min(1),
  answers: z.record(z.union([z.string(), z.array(z.string())])),
  questions: z.array(
    z.object({
      id: z.string(),
      type: z.enum([
        "short_text",
        "long_text",
        "email",
        "phone",
        "single_choice",
        "multiple_choice",
      ]),
      title: z.string(),
      description: z.string().optional(),
      placeholder: z.string().optional(),
      required: z.boolean().optional(),
      options: z
        .array(z.object({ value: z.string(), label: z.string() }))
        .optional(),
    })
  ),
});

export async function POST(req: NextRequest, { params }: { params: { form: string } }) {
  if (params.form !== "v1" && params.form !== "v2") {
    return NextResponse.json({ error: "Invalid form" }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const { formTitle, respondentLabel, answers, questions } = parsed.data;

  const parentFolderId =
    params.form === "v1"
      ? process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID_V1
      : process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID_V2;

  if (!parentFolderId) {
    console.error(
      `Missing environment variable GOOGLE_DRIVE_PARENT_FOLDER_ID_${params.form.toUpperCase()}`
    );
    return NextResponse.json(
      { error: "We couldn't save your form. Please try again later." },
      { status: 500 }
    );
  }

  const companyName = (answers["company_name"] as string | undefined)?.trim() || "Unknown company";
  const fullName = (answers["name"] as string | undefined)?.trim() || "Unknown name";
  const createdDate = new Date().toISOString().slice(0, 10);
  const folderName = `${companyName} - ${fullName} - ${createdDate}`;

  try {
    const auth = getGoogleAuthClient();
    const { folderId, folderLink } = await createRespondentFolder(auth, folderName, parentFolderId);
    const [{ documentLink }] = await Promise.all([
      createResponseDoc(auth, folderId, companyName, formTitle, respondentLabel, questions, answers),
      createAssetSubfolders(auth, folderId),
      // Best-effort: an internal GHL notification is a nice-to-have, not a
      // reason to fail a submission the client already successfully saved —
      // caught here so it can never reject this Promise.all. Still awaited
      // (rather than fired-and-forgotten) so the serverless function stays
      // alive long enough for the request to actually go out.
      notifyIntakeSubmission({
        clientName: fullName,
        companyName,
        driveLink: folderLink ?? `https://drive.google.com/drive/folders/${folderId}`,
      }).catch((err) => {
        console.error("Error notifying GHL of form submission:", err);
      }),
    ]);

    return NextResponse.json({ ok: true, documentLink });
  } catch (error) {
    console.error("Error processing form submission:", error);
    return NextResponse.json(
      { error: "We couldn't save your form. Please try again later." },
      { status: 500 }
    );
  }
}
