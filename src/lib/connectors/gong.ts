import { getConfig } from "@/lib/config";
import type { ConnectorResult, Meeting, ResearchConnector } from "@/lib/domain";
import { fetchJson } from "@/lib/http";

type GongCall = {
  metaData?: { id?: string; title?: string; started?: string; url?: string };
  parties?: Array<{ emailAddress?: string; name?: string }>;
  content?: { topics?: Array<{ name?: string; duration?: number }>; trackers?: Array<{ name?: string; count?: number }> };
};

export class GongConnector implements ResearchConnector {
  readonly name = "gong" as const;

  isConfigured() {
    const config = getConfig();
    return Boolean(config.GONG_ACCESS_KEY && config.GONG_ACCESS_SECRET);
  }

  async research(meeting: Meeting): Promise<ConnectorResult> {
    if (!this.isConfigured()) return { connector: this.name, evidence: [], status: "skipped", message: "Gong keys not configured" };
    const config = getConfig();
    const to = new Date(meeting.startsAt);
    const from = new Date(to.getTime() - 180 * 24 * 60 * 60_000);
    const credentials = Buffer.from(`${config.GONG_ACCESS_KEY}:${config.GONG_ACCESS_SECRET}`).toString("base64");

    try {
      const data = await fetchJson<{ calls?: GongCall[] }>(
        "gong",
        `${config.GONG_API_BASE_URL}/v2/calls/extensive`,
        {
          method: "POST",
          headers: { authorization: `Basic ${credentials}`, "content-type": "application/json" },
          body: JSON.stringify({
            filter: { fromDateTime: from.toISOString(), toDateTime: to.toISOString() },
            contentSelector: {
              context: "Basic",
              exposedFields: { parties: true, content: { topics: true, trackers: true } },
            },
          }),
        },
      );

      const matchingCalls = (data.calls ?? [])
        .filter((call) => call.parties?.some((party) => party.emailAddress?.toLowerCase().endsWith(`@${meeting.account.domain}`)))
        .slice(0, 5);

      return {
        connector: this.name,
        status: "ok",
        evidence: matchingCalls.map((call) => {
          const topics = call.content?.topics?.map((topic) => topic.name).filter(Boolean).slice(0, 5).join(", ");
          const trackers = call.content?.trackers?.map((tracker) => tracker.name).filter(Boolean).slice(0, 5).join(", ");
          return {
            source: "gong" as const,
            title: call.metaData?.title ?? "Prior customer conversation",
            detail: [topics && `Topics: ${topics}`, trackers && `Signals: ${trackers}`].filter(Boolean).join(". ") || "Prior recorded conversation with this account.",
            url: call.metaData?.url,
            observedAt: call.metaData?.started ? new Date(call.metaData.started).toISOString() : undefined,
            confidence: "high" as const,
          };
        }),
      };
    } catch (error) {
      return { connector: this.name, evidence: [], status: "error", message: error instanceof Error ? error.message : "Gong request failed" };
    }
  }
}
