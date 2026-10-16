import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

// Matches the folder names the campaign doc's action tabs tell clients to
// drop their assets into.
const ASSET_SUBFOLDER_NAMES = ["Raw Photos", "Raw Videos", "Brand Logos & Assets"];

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

export async function createAssetSubfolders(auth: OAuth2Client, parentFolderId: string) {
  const drive = google.drive({ version: "v3", auth });

  await Promise.all(
    ASSET_SUBFOLDER_NAMES.map((name) =>
      drive.files.create({
        requestBody: {
          name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentFolderId],
        },
        fields: "id",
        supportsAllDrives: true,
      })
    )
  );
}
