# LaunchPad Intake Form

Two Typeform-style forms (`/v1` and `/v2`) that save each response as a folder + Google Doc inside Google Drive.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure Google OAuth

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), on the same project as the Client ID you already have (`GOOGLE CLOUD/client_secret_*.json`), enable the **Google Drive API** and **Google Docs API**.
2. On that Client ID (type "Web application"), add as an **Authorized redirect URI**:
   ```
   http://localhost:3333/oauth2callback
   ```
3. Copy `.env.local.example` to `.env.local` and fill in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with the values from the downloaded JSON.
4. Generate the `refresh_token` (one time only):

   PowerShell:
   ```powershell
   $env:GOOGLE_CLIENT_ID="your-client-id"; $env:GOOGLE_CLIENT_SECRET="your-client-secret"; npm run get-refresh-token
   ```

   This opens the browser to sign in with the Google account that will have access to Drive. Copy the `GOOGLE_REFRESH_TOKEN` printed in the terminal into your `.env.local`.

5. Create (or reuse) a folder in Google Drive, share it if needed with the account used in the previous step, and copy its ID (the value after `/folders/` in the URL) into `GOOGLE_DRIVE_PARENT_FOLDER_ID`.

## 3. Run locally

```bash
npm run dev
```

- http://localhost:3000/v1
- http://localhost:3000/v2

## 4. Replace the real questions

Edit `lib/questions/v1.ts` and `lib/questions/v2.ts`. Each question supports: `short_text`, `long_text`, `email`, `phone`, `single_choice`, `multiple_choice`.

> The question with `id: "name"` (or `"company"` if it doesn't exist) is used as the respondent's name to label the folder created in Drive.

## 5. Deploy to Vercel

```bash
vercel
```

In the Vercel project dashboard, add the same 4 environment variables from `.env.local` (Settings → Environment Variables).

You don't need to regenerate the `refresh_token` for production: the same value keeps working until access is revoked from the Google account.
