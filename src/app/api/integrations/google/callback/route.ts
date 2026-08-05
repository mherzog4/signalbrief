import { getConfig } from "@/lib/config";
import { exchangeGoogleAuthorizationCode, verifyGoogleOAuthState } from "@/lib/google-oauth";
import { storeGoogleRefreshToken } from "@/lib/store/integration-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dashboardRedirect(request: Request, outcome: "connected" | "error") {
  const destination = new URL("/", request.url);
  destination.searchParams.set("calendar", outcome);
  return Response.redirect(destination, 303);
}

export async function GET(request: Request) {
  const config = getConfig();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.has("error") || !code || !state || !config.ADMIN_API_KEY) {
    return dashboardRedirect(request, "error");
  }

  try {
    const payload = verifyGoogleOAuthState(state, config.ADMIN_API_KEY);
    const expectedRedirectUri = new URL("/api/integrations/google/callback", request.url).toString();
    if (payload.redirectUri !== expectedRedirectUri) throw new Error("OAuth redirect URI mismatch");

    const token = await exchangeGoogleAuthorizationCode(code, payload.redirectUri);
    if (!token.refresh_token) throw new Error("Google did not return a refresh token");
    await storeGoogleRefreshToken(token.refresh_token);
    return dashboardRedirect(request, "connected");
  } catch {
    return dashboardRedirect(request, "error");
  }
}
