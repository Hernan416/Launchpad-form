import crypto from "crypto";
import { cookies } from "next/headers";

// Simple, self-contained admin auth: no database, no session store. The
// session cookie's value is an HMAC of a fixed string keyed by the admin
// password, so the cookie is self-verifying — we just recompute the same
// HMAC server-side and compare. If ADMIN_PASSWORD is unset, every check
// below fails closed (never silently allows access).

export const ADMIN_COOKIE_NAME = "lp_admin_session";
export const ADMIN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const SESSION_PAYLOAD = "admin";

function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  return password && password.length > 0 ? password : null;
}

function sha256(input: string): Buffer {
  return crypto.createHash("sha256").update(input).digest();
}

function computeSessionToken(password: string): string {
  return crypto.createHmac("sha256", password).update(SESSION_PAYLOAD).digest("hex");
}

/**
 * Constant-time password check. Hashes both sides to fixed-length (32 byte)
 * digests first so `timingSafeEqual` never throws on a length mismatch,
 * regardless of what the caller submitted.
 */
export function verifyAdminPassword(submitted: string): boolean {
  const password = getAdminPassword();
  if (!password) return false;
  return crypto.timingSafeEqual(sha256(submitted), sha256(password));
}

/**
 * Returns the value to store in the session cookie, or null if admin
 * access isn't configured (ADMIN_PASSWORD missing) — callers must treat
 * null as "cannot log in".
 */
export function createSessionCookieValue(): string | null {
  const password = getAdminPassword();
  if (!password) return null;
  return computeSessionToken(password);
}

function isValidSessionCookieValue(value: string | undefined | null): boolean {
  const password = getAdminPassword();
  if (!password || !value) return false;

  const expected = computeSessionToken(password);
  let expectedBuf: Buffer;
  let actualBuf: Buffer;
  try {
    expectedBuf = Buffer.from(expected, "hex");
    actualBuf = Buffer.from(value, "hex");
  } catch {
    return false;
  }
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

/** Server-side check used by the /admin page and the admin API routes. */
export function isAdminAuthenticated(): boolean {
  if (!getAdminPassword()) return false; // fail closed if not configured
  const value = cookies().get(ADMIN_COOKIE_NAME)?.value;
  return isValidSessionCookieValue(value);
}

export function isAdminConfigured(): boolean {
  return getAdminPassword() !== null;
}
