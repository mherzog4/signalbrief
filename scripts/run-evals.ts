import { evaluateBriefQuality } from "../src/lib/evals/brief-quality";
import { getDemoScenarios } from "../src/lib/demo/scenarios";

const reports = getDemoScenarios(new Date("2026-08-04T12:00:00.000Z"))
  .map((scenario) => evaluateBriefQuality(scenario.id, scenario.brief, scenario.evidence));

console.table(reports.map((report) => ({
  scenario: report.scenarioId,
  score: report.score,
  grounding: report.metrics.factualGrounding,
  numeric: report.metrics.numericGrounding,
  sources: report.metrics.sourceCoverage,
  result: report.passed ? "PASS" : "FAIL",
})));

for (const report of reports) {
  if (report.findings.length) console.log(`${report.scenarioId}: ${report.findings.join(" ")}`);
}

if (reports.some((report) => !report.passed)) process.exitCode = 1;
