import https from "https";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

// Without this, Node opens a brand new TLS connection for every single
// HTTPS call (one per Drive/Docs API request), which is most of where the
// multi-second submit latency comes from. Reusing connections across calls
// (and across requests, on a warm server) cuts that down significantly.
// `keepAlive` is settable at runtime on the Agent instance, but current
// @types/node only exposes it as a constructor option, not an instance
// property — hence the cast.
(https.globalAgent as https.Agent & { keepAlive: boolean }).keepAlive = true;
https.globalAgent.maxSockets = 50;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

// Reused across requests on the same warm server instance so the access
// token (fetched on first use) doesn't get re-requested from Google on
// every single submission — that round trip was adding ~300-500ms.
let cachedClient: OAuth2Client | null = null;

export function getGoogleAuthClient(): OAuth2Client {
  if (cachedClient) return cachedClient;

  const clientId = getRequiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = getRequiredEnv("GOOGLE_CLIENT_SECRET");
  const refreshToken = getRequiredEnv("GOOGLE_REFRESH_TOKEN");

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  cachedClient = oauth2Client;
  return oauth2Client;
}
