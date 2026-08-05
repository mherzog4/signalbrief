import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { getConfig } from "@/lib/config";
import { fetchJson } from "@/lib/http";

const googleCalendarReadonlyScope = "https://www.googleapis.com/auth/calendar.events.readonly";
const stateLifetimeMs = 10 * 60_000;

type GoogleOAuthState = {
  expiresAt: number;
  nonce: string;
  redirectUri: string;
};

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createGoogleOAuthState(redirectUri: string, secret: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({
    expiresAt: now + stateLifetimeMs,
    nonce: randomBytes(18).toString("base64url"),
    redirectUri,
  } satisfies GoogleOAuthState)).toString("base64url");

  return `${payload}.${signature(payload, secret)}`;
}

export function verifyGoogleOAuthState(state: string, secret: string, now = Date.now()): GoogleOAuthState {
  const [payload, suppliedSignature] = state.split(".");
  if (!payload || !suppliedSignature) throw new Error("Invalid OAuth state");

  const expectedSignature = signature(payload, secret);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    suppliedBuffer.length !== expectedBuffer.length
    || !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid OAuth state signature");
  }

  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as GoogleOAuthState;
  if (!parsed.redirectUri || !parsed.nonce || !parsed.expiresAt || parsed.expiresAt < now) {
    throw new Error("Expired OAuth state");
  }
  return parsed;
}

export function getGoogleAuthorizationUrl(redirectUri: string, state: string) {
  const config = getConfig();
  if (!config.GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID is not configured");

  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.searchParams.set("client_id", config.GOOGLE_CLIENT_ID);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", googleCalendarReadonlyScope);
  authorizationUrl.searchParams.set("access_type", "offline");
  authorizationUrl.searchParams.set("prompt", "consent");
  authorizationUrl.searchParams.set("include_granted_scopes", "true");
  authorizationUrl.searchParams.set("state", state);
  return authorizationUrl.toString();
}

export async function exchangeGoogleAuthorizationCode(code: string, redirectUri: string) {
  const config = getConfig();
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials are not configured");
  }

  return fetchJson<{ access_token: string; expires_in?: number; refresh_token?: string }>(
    "google-oauth",
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.GOOGLE_CLIENT_ID,
        client_secret: config.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }).toString(),
    },
  );
}

export function isGoogleOAuthConfigured() {
  const config = getConfig();
  return Boolean(
    config.ADMIN_API_KEY
    && config.GOOGLE_CLIENT_ID
    && config.GOOGLE_CLIENT_SECRET
    && config.UPSTASH_REDIS_REST_URL
    && config.UPSTASH_REDIS_REST_TOKEN,
  );
}

export const googleOAuthScope = googleCalendarReadonlyScope;
