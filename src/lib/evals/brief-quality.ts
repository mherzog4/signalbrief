import { meetingBriefSchema, type Evidence, type MeetingBrief } from "@/lib/domain";

const stopWords = new Set([
  "about", "after", "again", "against", "also", "and", "are", "before", "being", "between", "but", "can", "for", "from", "has", "have", "into", "its", "most", "not", "over", "that", "the", "their", "then", "these", "this", "through", "under", "was", "were", "while", "will", "with", "your",
]);

const sourceAliases: Record<Evidence["source"], string[]> = {
  calendar: ["calendar", "meeting"],
  gong: ["gong", "call", "conversation"],
  crm: ["crm", "hubspot", "deal", "opportunity", "engagement"],
  web: ["announcement", "acquisition", "careers", "funding", "leadership", "news", "series", "web"],
};

export type BriefEvalReport = {
  scenarioId: string;
  passed: boolean;
  score: number;
  metrics: {
    schemaCompliance: number;
    factualGrounding: number;
    numericGrounding: number;
    sourceCoverage: number;
    concision: number;
    actionability: number;
  };
  findings: string[];
};

function tokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9$%]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function extractNumbers(value: string) {
  return value.toLowerCase().match(/\$?\d+(?:\.\d+)?(?:%|[mkb])?/g) ?? [];
}

function sourceIsCited(source: Evidence["source"], brief: MeetingBrief) {
  return brief.sources.some((citation) => {
    const label = citation.label.toLowerCase();
    return sourceAliases[source].some((alias) => label.includes(alias)) || (source === "web" && Boolean(citation.url));
  });
}

function rounded(value: number) {
  return Math.round(value * 100) / 100;
}

export function evaluateBriefQuality(
  scenarioId: string,
  brief: MeetingBrief,
  evidence: Evidence[],
): BriefEvalReport {
  const findings: string[] = [];
  const schemaCompliance = meetingBriefSchema.safeParse(brief).success ? 1 : 0;
  if (!schemaCompliance) findings.push("Brief does not satisfy the structured output schema.");

  const factualClaims = [brief.whyNow, ...brief.accountSnapshot, ...brief.relationshipContext];
  const evidenceText = evidence.map((item) => `${item.title} ${item.detail}`).join(" ").toLowerCase();
  const evidenceTokens = new Set(tokens(evidenceText));
  const groundingByClaim = factualClaims.map((claim) => {
    const claimTokens = tokens(claim);
    if (claimTokens.length === 0) return 1;
    return claimTokens.filter((token) => evidenceTokens.has(token)).length / claimTokens.length;
  });
  const factualGrounding = groundingByClaim.length
    ? groundingByClaim.reduce((sum, value) => sum + value, 0) / groundingByClaim.length
    : 0;
  if (factualGrounding < 0.55) findings.push("Factual sections have weak lexical support in normalized evidence.");

  const claimNumbers = extractNumbers(factualClaims.join(" "));
  const numericGrounding = claimNumbers.length
    ? claimNumbers.filter((number) => evidenceText.includes(number)).length / claimNumbers.length
    : 1;
  if (numericGrounding < 1) findings.push("At least one number in the brief is absent from normalized evidence.");

  const evidenceSources = [...new Set(evidence.map((item) => item.source))];
  const sourceCoverage = evidenceSources.length
    ? evidenceSources.filter((source) => sourceIsCited(source, brief)).length / evidenceSources.length
    : 0;
  if (sourceCoverage < 0.75) findings.push("The citation list does not represent enough evidence sources.");

  const whyNowWords = brief.whyNow.trim().split(/\s+/).length;
  const averageBulletWords = [...brief.accountSnapshot, ...brief.relationshipContext, ...brief.recommendedPlays]
    .reduce((sum, item, _index, items) => sum + item.trim().split(/\s+/).length / items.length, 0);
  const concision = whyNowWords <= 50 && averageBulletWords <= 24 ? 1 : 0.5;
  if (concision < 1) findings.push("The brief exceeds the intended scan-time budget.");

  const uniquePlays = new Set(brief.recommendedPlays.map((item) => item.toLowerCase())).size;
  const uniqueQuestions = new Set(brief.discoveryQuestions.map((item) => item.toLowerCase())).size;
  const actionability = uniquePlays >= 2 && uniqueQuestions >= 2 ? 1 : 0;
  if (!actionability) findings.push("Recommended plays or discovery questions are not sufficiently distinct.");

  const score = Math.round(
    schemaCompliance * 20
      + factualGrounding * 30
      + numericGrounding * 15
      + sourceCoverage * 15
      + concision * 10
      + actionability * 10,
  );
  const passed = score >= 80 && schemaCompliance === 1 && numericGrounding === 1;

  return {
    scenarioId,
    passed,
    score,
    metrics: {
      schemaCompliance,
      factualGrounding: rounded(factualGrounding),
      numericGrounding: rounded(numericGrounding),
      sourceCoverage: rounded(sourceCoverage),
      concision,
      actionability,
    },
    findings,
  };
}
