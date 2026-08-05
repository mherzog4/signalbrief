import { bearerMatches } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import {
  createGoogleOAuthState,
  getGoogleAuthorizationUrl,
  isGoogleOAuthConfigured,
} from "@/lib/google-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(request: Request) {
  const config = getConfig();
  const headers = { "cache-control": "no-store" };
  if (!bearerMatches(request, config.ADMIN_API_KEY)) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  if (!isGoogleOAuthConfigured() || !config.ADMIN_API_KEY) {
    return Response.json(
      { error: "Google OAuth and Upstash must be configured before connecting a calendar" },
      { status: 409, headers },
    );
  }

  const redirectUri = new URL("/api/integrations/google/callback", request.url).toString();
  const state = createGoogleOAuthState(redirectUri, config.ADMIN_API_KEY);
  return Response.json({ authorizationUrl: getGoogleAuthorizationUrl(redirectUri, state) }, { headers });
}
