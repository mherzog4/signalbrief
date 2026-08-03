import { getConfig, getIntegrationStatus } from "@/lib/config";

export const dynamic = "force-dynamic";

export function GET() {
  const config = getConfig();
  return Response.json({
    ok: true,
    service: "signalbrief",
    mode: config.DEMO_MODE === "true" ? "demo" : "live",
    integrations: getIntegrationStatus(config),
    checkedAt: new Date().toISOString(),
  });
}
