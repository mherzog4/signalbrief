import "server-only";

import { getConfig, getIntegrationStatus } from "@/lib/config";
import { createMockConnectors } from "@/lib/connectors/mock";
import { getDemoScenario } from "@/lib/demo/scenarios";
import { compileMeetingBrief } from "@/lib/pipeline/compile-brief";

export async function runDemoScenario(id: string) {
  const startedAt = performance.now();
  const scenario = getDemoScenario(id);
  if (!scenario) return undefined;

  const config = getConfig();
  const liveAi = config.DEMO_USE_LIVE_AI === "true" && getIntegrationStatus(config).ai;
  const fixtureGenerator = async () => ({
    ...scenario.brief,
    generatedAt: new Date().toISOString(),
  });
  const compiled = await compileMeetingBrief(
    scenario.meeting,
    createMockConnectors(scenario.evidence),
    liveAi ? undefined : fixtureGenerator,
  );

  return {
    scenario: {
      id: scenario.id,
      label: scenario.label,
      stage: scenario.stage,
      summary: scenario.summary,
      meeting: scenario.meeting,
    },
    ...compiled,
    trace: {
      runId: crypto.randomUUID(),
      mode: liveAi ? "live" as const : "fixture" as const,
      provider: liveAi ? config.AI_PROVIDER : "synthetic" as const,
      model: liveAi ? config.AI_MODEL : "curated-interview-fixture",
      totalDurationMs: Math.round(performance.now() - startedAt),
      generatedAt: new Date().toISOString(),
    },
  };
}
