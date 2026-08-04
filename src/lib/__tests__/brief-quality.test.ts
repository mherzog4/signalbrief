import { describe, expect, it } from "vitest";

import { evaluateBriefQuality } from "@/lib/evals/brief-quality";
import { getDemoScenarios } from "@/lib/demo/scenarios";

describe("brief quality evaluations", () => {
  it("keeps every curated scenario above the interview-demo threshold", () => {
    for (const scenario of getDemoScenarios(new Date("2026-08-04T12:00:00.000Z"))) {
      const report = evaluateBriefQuality(scenario.id, scenario.brief, scenario.evidence);
      expect(report, JSON.stringify(report, null, 2)).toMatchObject({ passed: true });
      expect(report.score).toBeGreaterThanOrEqual(80);
      expect(report.metrics.numericGrounding).toBe(1);
    }
  });

  it("fails a plausible-looking unsupported revenue claim", () => {
    const scenario = getDemoScenarios(new Date("2026-08-04T12:00:00.000Z"))[0];
    const hallucinated = {
      ...scenario.brief,
      whyNow: `${scenario.brief.whyNow} The account also approved a $999m transformation budget.`,
    };
    const report = evaluateBriefQuality("hallucination-check", hallucinated, scenario.evidence);
    expect(report.passed).toBe(false);
    expect(report.metrics.numericGrounding).toBeLessThan(1);
    expect(report.findings).toContain("At least one number in the brief is absent from normalized evidence.");
  });
});
