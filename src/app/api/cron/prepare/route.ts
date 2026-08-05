import { bearerMatches } from "@/lib/auth";
import { listUpcomingMeetings } from "@/lib/connectors/calendar";
import { getConfig, getIntegrationStatus } from "@/lib/config";
import { processMeeting } from "@/lib/pipeline/process-meeting";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = getConfig();
  if (!bearerMatches(request, config.CRON_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The interactive demo intentionally falls back to a synthetic meeting, but
  // an unattended cron must never turn that fixture into recurring AI spend.
  if (config.DEMO_MODE === "true" && !getIntegrationStatus(config).calendar) {
    return Response.json({
      ok: true,
      scanned: 0,
      results: [],
      skipped: "demo_mode_without_calendar",
    });
  }

  try {
    const meetings = await listUpcomingMeetings();
    const results = [];
    for (const meeting of meetings) {
      results.push(await processMeeting(meeting));
    }
    return Response.json({ ok: true, scanned: meetings.length, results });
  } catch (error) {
    console.error("Signalbrief cron failed", error);
    return Response.json({ ok: false, error: "Brief preparation failed" }, { status: 500 });
  }
}
