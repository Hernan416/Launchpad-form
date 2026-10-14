import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export async function createRespondentFolder(
  auth: OAuth2Client,
  folderName: string,
  parentFolderId: string
) {
  const drive = google.drive({ version: "v3", auth });

  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });

  if (!folder.data.id) {
    throw new Error("Could not create the folder in Google Drive");
  }

  return { folderId: folder.data.id, folderLink: folder.data.webViewLink ?? null };
}
