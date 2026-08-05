import { getConfig, getIntegrationStatus } from "@/lib/config";
import { isGoogleCalendarConnected } from "@/lib/connectors/calendar";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getConfig();
  const integrations = getIntegrationStatus(config);
  integrations.calendar = await isGoogleCalendarConnected();
  return Response.json({
    ok: true,
    service: "signalbrief",
    mode: config.DEMO_MODE === "true" ? "demo" : "live",
    integrations,
    checkedAt: new Date().toISOString(),
  });
}
