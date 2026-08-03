import "server-only";

import { GongConnector } from "@/lib/connectors/gong";
import { HubSpotConnector } from "@/lib/connectors/hubspot";
import { TavilyConnector } from "@/lib/connectors/tavily";
import { demoEvidence } from "@/lib/demo/data";
import type { ConnectorResult, Evidence, Meeting, ResearchConnector } from "@/lib/domain";
import { generateBrief } from "@/lib/providers/brief-generator";

type BriefGenerator = typeof generateBrief;

const defaultConnectors = (): ResearchConnector[] => [
  new GongConnector(),
  new HubSpotConnector(),
  new TavilyConnector(),
];

export async function compileMeetingBrief(
  meeting: Meeting,
  connectors: ResearchConnector[] = defaultConnectors(),
  briefGenerator: BriefGenerator = generateBrief,
) {
  const connectorResults = await Promise.all(
    connectors.map(async (connector): Promise<ConnectorResult> => {
      const startedAt = performance.now();
      try {
        const result = await connector.research(meeting);
        return { ...result, durationMs: Math.round(performance.now() - startedAt) };
      } catch (error) {
        return {
          connector: connector.name,
          evidence: [],
          status: "error",
          message: error instanceof Error ? error.message : "Connector failed",
          durationMs: Math.round(performance.now() - startedAt),
        };
      }
    }),
  );

  const collected = connectorResults.flatMap((result) => result.evidence);
  const evidence: Evidence[] = meeting.id.startsWith("demo-") && collected.length === 0
    ? demoEvidence
    : collected;
  const generationStartedAt = performance.now();
  const brief = await briefGenerator(meeting, evidence);

  return {
    brief,
    evidence,
    connectorResults,
    generationDurationMs: Math.round(performance.now() - generationStartedAt),
  };
}
