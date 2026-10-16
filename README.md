# LaunchPad Intake Form

Two Typeform-style intake forms (`/v1` and `/v2`) built with Next.js 14 (App Router). When a client submits a form, the app automatically:

1. Creates a folder for them in Google Drive.
2. Creates a copy of the "Campaign Doc" template inside that folder, filled in with their answers.
3. Creates empty "Raw Photos", "Raw Videos", and "Brand Logos & Assets" subfolders for them to upload to.
4. Fires an internal notification inside GoHighLevel (GHL) so the team knows a new intake came in.

There is also a password-protected `/admin` panel where the form's questions, titles, and intro text can be edited live, without touching code.

This document explains how all of it works and where everything lives.

---

## 1. How the form itself works

- `/v1` and `/v2` are two separate forms (different sets of questions), each rendered by the same UI (`components/TypeformRunner.tsx`). They show one question at a time, like Typeform.
- The content of each form (title, intro screen, every question, their options) is **not hardcoded** — it's loaded at runtime from a config file stored in Google Drive (see [Section 4 — Admin panel](#4-admin-panel-editing-the-forms-questions)). `lib/questions/v1.ts` and `lib/questions/v2.ts` only serve as the **starting/default content** the very first time the app runs, before that Drive file exists.
- Email and phone questions are validated in the browser before the person can move to the next question (`lib/validation.ts`).
- After the person finishes, they land on a screen offering to book their onboarding call right there (embedded GHL calendar widget, `components/BookingCalendar.tsx`), or to skip it if they already booked.

## 2. What happens when someone submits a form

All of this happens in `app/api/submit/[form]/route.ts`, triggered the moment someone finishes a form:

1. **A folder is created in Google Drive** for this response, named:
   ```
   {Company Name} - {Full Name} - {submission date}
   ```
   using the answers from the questions with the internal IDs `company_name` and `name`. ⚠️ Those two question IDs are "load-bearing" — if they're renamed in the admin panel, folder naming breaks (the admin panel warns about this).

   - Form `/v1` responses go into the Drive folder set in `GOOGLE_DRIVE_PARENT_FOLDER_ID_V1`.
   - Form `/v2` responses go into the Drive folder set in `GOOGLE_DRIVE_PARENT_FOLDER_ID_V2`.
   - Both of those parent folders live inside the same Shared Drive, named **"LAUNCHPAD"**.

2. **Three empty subfolders are created** inside that new folder: "Raw Photos", "Raw Videos", "Brand Logos & Assets" — matching exactly what the campaign doc tells the client to upload and where.

3. **A Google Doc is created** inside that folder (see [Section 3](#3-how-the-generated-google-doc-works) below).

4. **GHL gets notified** (see [Section 5](#5-gohighlevel-ghl-integration) below).

Steps 2, 3, and 4 all run at the same time (in parallel) to keep the submission fast.

## 3. How the generated Google Doc works

Every client's doc is a **full copy of a master template** called the "Campaign Doc" (a real Google Doc Noah maintains), not a blank document. This means every new client automatically gets the exact same tabs, checklists, and instructions Noah has already written — only one tab gets replaced with that client's actual answers.

- **Master template**: [Campaign Doc](https://docs.google.com/document/d/1wf2_HsKYoHdvJpEn6jTn6Oh6riNyxRx5bedOWjkZzss/edit) (its ID is hardcoded as `CAMPAIGN_DOC_TEMPLATE_ID` in `lib/google/docs.ts`).
- When a client submits a form, the app makes a full Drive-level copy of that template directly into the client's new folder, and renames the copy to:
  ```
  Campaign Doc - {Company Name}
  ```
- The template currently has these tabs, copied as-is into every client's doc:
  - Action: Send us photos
  - Action: Send us videos
  - HOW TO FILM ADS
  - **Onboarding** ← this is the only tab that gets touched
  - Tech Setup
- The app finds the **"Onboarding"** tab (by name, case-insensitive) in the freshly copied doc, wipes out its placeholder content, and writes in the client's actual answers — one question per heading, with their answer right below it in a highlighted callout box. Everything else in the doc (the other 4 tabs) stays byte-for-byte identical to the template.

**To change anything that appears in every client's doc** (the checklist wording, the filming instructions, the tech setup steps, branding, etc.), edit the **master template directly** in Google Docs — there is nothing to change in code for that, since every new doc is just a live copy of it. The only part of the doc that code controls is the Onboarding tab's Q&A layout and colors (in `lib/google/docs.ts`), which gets rebuilt from scratch on every submission.

> Note: there used to be a first tab called "Clients START HERE" and some internal scratch notes (dates/reminders highlighted in yellow) at the end of the "Tech Setup" tab. Both were removed directly from the master template (the Google Docs API has no way to delete a tab or do this automatically per-submission, so it has to live in the template itself) — so neither appears in any new doc created from now on.

## 4. Admin panel (editing the form's questions)

The `/admin` panel lets a non-technical person change what the public `/v1` and `/v2` forms show — titles, intro text, every question's wording/type/options, required/optional, and the order of questions — without touching any code, and see the change go live immediately.

- **No real database is used.** The entire configuration (both forms' titles, intros, and full question lists) is stored as a single JSON file named `launchpad-form-config.json`, saved directly in the same Google Drive Shared Drive ("LAUNCHPAD") that holds all the client folders. Think of that one file as the form's "database."
- The very first time the app ever runs, that file doesn't exist yet — the app automatically creates it, seeded with whatever is currently in `lib/questions/v1.ts` / `v2.ts`. After that, the Drive file is the only source of truth; the code files are no longer read by the live forms.
- Saving in the admin panel immediately overwrites that Drive file and instantly invalidates the server's cache, so the public forms show the new content on the very next page load — no waiting, no redeploy.
- As a safety net, the forms also re-check that file every 5 minutes on their own, in case a cache invalidation is ever missed for any reason.
- **Login**: a single shared password, set via the `ADMIN_PASSWORD` environment variable (no user accounts, no database of users). Logging in sets a secure cookie that's valid for 7 days. If `ADMIN_PASSWORD` is ever unset, the admin panel locks itself out entirely rather than risk being left open.
- The panel warns before letting someone rename a question's internal ID if that ID is one of the "load-bearing" ones (`name`, `company_name`) that the folder-naming logic in Section 2 depends on.

## 5. GoHighLevel (GHL) integration

Every time someone submits a form, GHL fires an **internal notification** to let the team know — without ever creating a new contact. This all happens in `lib/ghl.ts`.

How it works, step by step:
1. There's one fixed, reused GHL contact (an internal placeholder, not a real client) that every submission "stamps" with that submission's details — nothing about this feature ever creates or modifies a real client's contact record.
2. That contact has 3 custom fields: **Intake - Client Name**, **Intake - Company Name**, **Intake - Drive Link**. Each new submission overwrites those 3 fields with the latest submission's name, company, and the link to the Drive folder that was just created.
3. The app then re-fires a GHL workflow named **"Google Intake Submission -> Int. Noti"**, which is already configured on Noah's GHL account to send an internal notification. That workflow's message uses merge tags to pull in the 3 fields above, so the notification always shows the latest submission's details.
4. If GHL is ever down or errors out, the submission still succeeds for the client — the GHL call is "best-effort": failures are only logged on the server, they never show an error to the person filling out the form.

**Important**: there is no "test mode" for this — every form submission, including manual tests, fires a real notification inside Noah's live GHL account.

## 6. Environment variables

All of these live in `.env.local` locally (never committed — it's gitignored) and must also be added to the project's settings in Vercel for production:

| Variable | What it's for |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth credentials for the Google account that owns Drive/Docs access. From the Google Cloud Console project's downloaded credentials JSON. |
| `GOOGLE_REFRESH_TOKEN` | Generated once (see Section 7) — lets the server act as that Google account indefinitely, without anyone logging in again. |
| `GOOGLE_DRIVE_PARENT_FOLDER_ID_V1` | The Drive folder where every `/v1` response's folder gets created. |
| `GOOGLE_DRIVE_PARENT_FOLDER_ID_V2` | Same, for `/v2`. |
| `ADMIN_PASSWORD` | The one shared password for `/admin`. Also doubles as the secret key the admin session cookie is signed with. |
| `GHL_PRIVATE_TOKEN` | Private Integration Token from GHL (Settings → Private Integrations), used to update the notification contact and re-fire the intake workflow. |

## 7. Local setup

```bash
npm install
```

**Google OAuth (one-time setup):**
1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), on the project tied to the existing Client ID (see `GOOGLE CLOUD/client_secret_*.json`), make sure the **Google Drive API** and **Google Docs API** are enabled.
2. On that Client ID (type "Web application"), add this as an **Authorized redirect URI**:
   ```
   http://localhost:3333/oauth2callback
   ```
3. Copy `.env.local.example` to `.env.local` and fill in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
4. Generate the refresh token (only needs to be done once, ever — it doesn't expire until access is manually revoked):
   ```powershell
   $env:GOOGLE_CLIENT_ID="your-client-id"; $env:GOOGLE_CLIENT_SECRET="your-client-secret"; npm run get-refresh-token
   ```
   This opens a browser window to sign in with the Google account that should own all the Drive files. Paste the printed `GOOGLE_REFRESH_TOKEN` into `.env.local`.
5. Fill in the rest of the variables from Section 6 (parent folder IDs, admin password, GHL token).

   > The OAuth token needs the full `drive` and `documents` scopes (not the more restrictive `drive.file`) — otherwise it can only see files it created itself, not the Shared Drive folders set up through the Drive UI.
   >
   > Every Drive/Docs API call that touches the "LAUNCHPAD" Shared Drive must include `supportsAllDrives: true` (and `includeItemsFromAllDrives` + `corpora: 'drive'` for listing calls) — otherwise it silently fails with a "File not found" error even with correct permissions.

**Run it:**
```bash
npm run dev
```
- http://localhost:3000/v1
- http://localhost:3000/v2
- http://localhost:3000/admin

## 8. Deploying to Vercel

```bash
vercel
```

In the Vercel project dashboard (Settings → Environment Variables), add all 7 variables from Section 6, exactly as they are in `.env.local`. The same `GOOGLE_REFRESH_TOKEN` works in production — there's nothing to regenerate.
