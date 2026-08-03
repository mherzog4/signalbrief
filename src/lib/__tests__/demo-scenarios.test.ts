import { describe, expect, it } from "vitest";

import { meetingBriefSchema, meetingSchema } from "@/lib/domain";
import { getDemoScenarios } from "@/lib/demo/scenarios";
import { runDemoScenario } from "@/lib/demo/run-scenario";

describe("interview demo scenarios", () => {
  it("keeps every synthetic scenario inside the production contracts", () => {
    const scenarios = getDemoScenarios(new Date("2026-08-03T14:00:00.000Z"));

    expect(scenarios).toHaveLength(3);
    expect(new Set(scenarios.map((scenario) => scenario.id)).size).toBe(3);
    for (const scenario of scenarios) {
      expect(meetingSchema.safeParse(scenario.meeting).success).toBe(true);
      expect(meetingBriefSchema.safeParse(scenario.brief).success).toBe(true);
      expect(scenario.evidence.length).toBeGreaterThanOrEqual(4);
      expect(scenario.meeting.id).toMatch(/^demo-/);
    }
  });

  it("runs the real compiler orchestration against mock adapters", async () => {
    const result = await runDemoScenario("northstar-validation");

    expect(result?.trace.mode).toBe("fixture");
    expect(result?.trace.provider).toBe("synthetic");
    expect(result?.connectorResults.map((item) => item.connector)).toEqual(["gong", "crm", "web"]);
    expect(result?.connectorResults.every((item) => item.status === "ok")).toBe(true);
    expect(result?.connectorResults.every((item) => (item.durationMs ?? 0) > 0)).toBe(true);
    expect(result?.brief.accountName).toBe("Northstar Systems");
    expect(result?.evidence).toHaveLength(5);
  });
});
