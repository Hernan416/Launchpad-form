/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const { URL } = require("url");
const { google } = require("googleapis");
const open = require("open");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3333/oauth2callback";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/documents",
];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Define GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET como variables de entorno antes de correr este script.\n" +
      'Ejemplo (PowerShell): $env:GOOGLE_CLIENT_ID="..."; $env:GOOGLE_CLIENT_SECRET="..."; npm run get-refresh-token'
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith("/oauth2callback")) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Falta el parámetro code en la respuesta de Google.");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>Listo ✅</h1><p>Ya puedes cerrar esta ventana y volver a la terminal.</p>");

    console.log("\nTokens recibidos correctamente.\n");
    console.log("GOOGLE_REFRESH_TOKEN=" + tokens.refresh_token);
    console.log("\nCopia este valor a tu archivo .env.local\n");
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Error al intercambiar el código por tokens.");
    console.error(err);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(3333, () => {
  console.log("Abriendo el navegador para autorizar acceso a Google Drive y Docs...");
  console.log("Si no se abre automáticamente, visita esta URL:\n");
  console.log(authUrl + "\n");
  open(authUrl);
});
