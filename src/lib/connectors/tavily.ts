import { getConfig } from "@/lib/config";
import type { ConnectorResult, Meeting, ResearchConnector } from "@/lib/domain";
import { fetchJson } from "@/lib/http";

type TavilyResult = { title?: string; url?: string; content?: string; score?: number };

export class TavilyConnector implements ResearchConnector {
  readonly name = "web" as const;

  isConfigured() {
    return Boolean(getConfig().TAVILY_API_KEY);
  }

  async research(meeting: Meeting): Promise<ConnectorResult> {
    const apiKey = getConfig().TAVILY_API_KEY;
    if (!apiKey) return { connector: this.name, evidence: [], status: "skipped", message: "Tavily key not configured" };

    try {
      const data = await fetchJson<{ results?: TavilyResult[] }>("tavily", "https://api.tavily.com/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query: `${meeting.account.name} ${meeting.account.domain} latest news leadership hiring strategy funding`,
          search_depth: "advanced",
          topic: "news",
          days: 90,
          max_results: 6,
          include_answer: false,
        }),
      });

      return {
        connector: this.name,
        status: "ok",
        evidence: (data.results ?? []).flatMap((result) => {
          if (!result.title || !result.content) return [];
          return [{
            source: "web" as const,
            title: result.title,
            detail: result.content.slice(0, 800),
            url: result.url,
            confidence: (result.score ?? 0) > 0.8 ? "high" as const : "medium" as const,
          }];
        }),
      };
    } catch (error) {
      return { connector: this.name, evidence: [], status: "error", message: error instanceof Error ? error.message : "Web research failed" };
    }
  }
}
