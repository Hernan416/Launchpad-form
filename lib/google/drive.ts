import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export async function createRespondentFolder(auth: OAuth2Client, respondentLabel: string) {
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
  if (!parentFolderId) {
    throw new Error("Missing environment variable GOOGLE_DRIVE_PARENT_FOLDER_ID");
  }

  const drive = google.drive({ version: "v3", auth });

  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
  const folderName = `${respondentLabel} — ${timestamp}`;

  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id, webViewLink",
  });

  if (!folder.data.id) {
    throw new Error("Could not create the folder in Google Drive");
  }

  return { folderId: folder.data.id, folderLink: folder.data.webViewLink ?? null };
}
