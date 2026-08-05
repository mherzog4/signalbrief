import type { Evidence, Meeting, MeetingBrief } from "@/lib/domain";

export type DemoScenario = {
  id: string;
  label: string;
  stage: string;
  summary: string;
  meeting: Meeting;
  evidence: Evidence[];
  brief: MeetingBrief;
};

export type DemoScenarioPreview = Pick<DemoScenario, "id" | "label" | "stage" | "summary" | "meeting" | "brief">;

const fromNow = (now: Date, minutes: number) => new Date(now.getTime() + minutes * 60_000).toISOString();

function meridianScenario(now: Date): DemoScenario {
  const startsAt = fromNow(now, 24);
  const meeting: Meeting = {
    id: "demo-meridian-applied-ai",
    title: "Meridian AI — Production scale review",
    startsAt,
    endsAt: fromNow(now, 54),
    ownerName: "Maya Chen",
    ownerSlackId: "UDEMO123",
    attendees: [
      { name: "Maya Chen", email: "maya@signalbrief.dev", title: "Account Executive", external: false },
      { name: "Taylor Morgan", email: "taylor@meridian.example", title: "VP Applied AI", external: true },
      { name: "Jordan Kim", email: "jordan@meridian.example", title: "AI Platform Lead", external: true },
    ],
    account: { name: "Meridian AI", domain: "meridian.example" },
  };
  const evidence: Evidence[] = [
    { source: "crm", title: "Synthetic CRM — platform expansion", detail: "Meridian runs three production AI workflows and forecasts model usage will triple this quarter. The team is evaluating a unified routing layer before adding more providers.", confidence: "high" },
    { source: "gong", title: "Synthetic Gong discovery — July 29", detail: "Taylor wants task-level model choice without maintaining provider-specific clients. Jordan flagged fallback behavior, latency visibility, and cost attribution as the technical decision criteria.", observedAt: "2026-07-29T15:00:00.000Z", confidence: "high" },
    { source: "web", title: "Multimodal workspace launch", detail: "Meridian announced a multimodal research workspace that combines text, document, and image workflows for enterprise teams.", url: "https://example.com/meridian-multimodal", confidence: "medium" },
    { source: "web", title: "Applied AI hiring", detail: "Meridian is hiring platform engineers focused on evaluation infrastructure, inference reliability, and model performance.", url: "https://example.com/meridian-careers", confidence: "medium" },
    { source: "web", title: "Developer platform update", detail: "Recent release notes added separate integrations for multiple model providers, suggesting growing orchestration and maintenance overhead.", url: "https://example.com/meridian-developer-update", confidence: "medium" },
  ];
  const brief: MeetingBrief = {
    accountName: "Meridian AI",
    meetingTitle: meeting.title,
    meetingTime: startsAt,
    whyNow: "Meridian’s model usage is projected to triple as its multimodal workspace expands, making this the moment to replace provider-by-provider integrations with a reliable routing layer.",
    accountSnapshot: ["Runs three production AI workflows across text, documents, and images", "Adding providers faster than its platform team can standardize integrations", "Hiring specifically for evaluation infrastructure and inference reliability"],
    relationshipContext: ["Taylor Morgan owns the business case for task-level model choice", "Jordan Kim is validating fallbacks, latency visibility, and cost attribution", "The team wants to choose the best model without maintaining separate clients"],
    recommendedPlays: ["Map each workflow to a routing policy for quality, latency, and price", "Demonstrate provider fallback without changing Meridian’s application code", "Propose a usage dashboard that attributes model cost by workflow"],
    discoveryQuestions: ["Which workflow suffers most when a provider slows down or changes behavior?", "How does Meridian decide when a new model is ready for production traffic?", "What cost and latency data must be visible to product owners?"],
    watchOuts: ["The platform team may prefer to keep routing in-house", "Avoid leading with model breadth before validating operational pain"],
    sources: [
      { label: "Multimodal launch", url: "https://example.com/meridian-multimodal" },
      { label: "Applied AI careers", url: "https://example.com/meridian-careers" },
      { label: "Developer platform update", url: "https://example.com/meridian-developer-update" },
      { label: "Synthetic CRM platform expansion" },
      { label: "Synthetic Gong discovery" },
    ],
    confidence: "high",
    generatedAt: now.toISOString(),
  };
  return { id: "meridian-applied-ai", label: "Meridian AI", stage: "Applied AI", summary: "Consolidate a fast-growing AI product onto OpenRouter routing and observability.", meeting, evidence, brief };
}

function northstarScenario(now: Date): DemoScenario {
  const startsAt = fromNow(now, 98);
  const meeting: Meeting = {
    id: "demo-northstar-validation",
    title: "Northstar — OpenRouter technical validation",
    startsAt,
    endsAt: fromNow(now, 143),
    ownerName: "Maya Chen",
    ownerSlackId: "UDEMO123",
    attendees: [
      { name: "Maya Chen", email: "maya@signalbrief.dev", title: "Account Executive", external: false },
      { name: "Jordan Lee", email: "jordan@northstar.example", title: "VP Engineering", external: true },
      { name: "Morgan Okafor", email: "morgan@northstar.example", title: "Security Architect", external: true },
    ],
    account: { name: "Northstar Systems", domain: "northstar.example" },
  };
  const evidence: Evidence[] = [
    { source: "crm", title: "Synthetic CRM — $240k annual model spend", detail: "Technical validation stage. Northstar is evaluating OpenRouter against an internal gateway before its Q4 AI rollout. Jordan Lee is the technical champion; CIO Elena Park is the economic buyer.", confidence: "high" },
    { source: "crm", title: "Synthetic CRM — mutual validation plan", detail: "Target decision Aug 28. Open items are provider fallback, BYOK, structured-output support, usage attribution, and data-policy review. Procurement has not joined yet.", confidence: "high" },
    { source: "gong", title: "Synthetic Gong architecture call — July 24", detail: "Jordan said Northstar maintains four provider integrations and cannot compare latency or cost consistently. Morgan requires auditable provider selection and no silent parameter dropping.", observedAt: "2026-07-24T15:30:00.000Z", confidence: "high" },
    { source: "gong", title: "Synthetic Gong executive discovery — July 11", detail: "Elena tied the evaluation to a Q4 launch of six internal AI copilots and wants fewer provider outages to reach application teams.", observedAt: "2026-07-11T18:00:00.000Z", confidence: "high" },
    { source: "web", title: "Northstar expands internal AI platform", detail: "Northstar announced an internal AI platform program intended to standardize model access across engineering and operations teams.", url: "https://example.com/northstar-ai-platform", confidence: "medium" },
  ];
  const brief: MeetingBrief = {
    accountName: "Northstar Systems",
    meetingTitle: meeting.title,
    meetingTime: startsAt,
    whyNow: "Northstar must choose its model gateway before a Q4 rollout of six AI copilots, putting OpenRouter’s fallback, BYOK, and observability controls on the critical path to $240k in annual model spend.",
    accountSnapshot: ["Maintains four provider integrations behind an internal gateway", "Launching six internal AI copilots across engineering and operations", "$240k in annual model spend is in scope for the evaluation"],
    relationshipContext: ["Jordan Lee is the technical champion; Elena Park is the economic buyer", "Morgan needs auditable routing and guaranteed parameter support", "The decision is between OpenRouter and continuing the internal gateway"],
    recommendedPlays: ["Run one copilot workload through failover and show the routing decision", "Demonstrate BYOK plus usage attribution without changing application code", "Agree on latency, error-rate, and cost thresholds for the validation"],
    discoveryQuestions: ["Which provider failure mode creates the most operational pain today?", "What routing evidence must Morgan retain for the data-policy review?", "What would justify replacing the internal gateway instead of extending it?"],
    watchOuts: ["The internal gateway is the real competitor", "Procurement has not joined the Aug 28 decision plan"],
    sources: [
      { label: "Northstar AI platform announcement", url: "https://example.com/northstar-ai-platform" },
      { label: "Synthetic CRM model-spend evaluation" },
      { label: "Synthetic CRM validation plan" },
      { label: "Synthetic Gong architecture call" },
      { label: "Synthetic Gong executive discovery" },
    ],
    confidence: "high",
    generatedAt: now.toISOString(),
  };
  return { id: "northstar-validation", label: "Northstar", stage: "Technical validation", summary: "Displace an internal gateway with a measurable OpenRouter validation.", meeting, evidence, brief };
}

function lumenScenario(now: Date): DemoScenario {
  const startsAt = fromNow(now, 212);
  const meeting: Meeting = {
    id: "demo-lumen-first-call",
    title: "Lumen Labs — OpenRouter discovery",
    startsAt,
    endsAt: fromNow(now, 242),
    ownerName: "Maya Chen",
    ownerSlackId: "UDEMO123",
    attendees: [
      { name: "Maya Chen", email: "maya@signalbrief.dev", title: "Account Executive", external: false },
      { name: "Sam Okafor", email: "sam@lumen.example", title: "VP Engineering", external: true },
    ],
    account: { name: "Lumen Labs", domain: "lumen.example" },
  };
  const evidence: Evidence[] = [
    { source: "crm", title: "Synthetic CRM — high-intent developer account", detail: "Sam Okafor viewed model pricing and provider-routing content twice, then replied to a developer-platform sequence. No opportunity or prior meeting exists yet.", confidence: "high" },
    { source: "web", title: "$38m Series B", detail: "Lumen raised a $38m Series B to launch an AI-native analytics product and expand its engineering organization.", url: "https://example.com/lumen-series-b", confidence: "high" },
    { source: "web", title: "Inference hiring surge", detail: "Lumen plans to grow from 180 to 260 employees and has nine open roles across applied AI, ML platform, and infrastructure.", url: "https://example.com/lumen-careers", confidence: "medium" },
    { source: "web", title: "New VP Engineering", detail: "Sam Okafor joined six weeks ago with a mandate to move Lumen’s AI analytics product from private beta to general availability.", url: "https://example.com/lumen-vp-engineering", confidence: "medium" },
  ];
  const brief: MeetingBrief = {
    accountName: "Lumen Labs",
    meetingTitle: meeting.title,
    meetingTime: startsAt,
    whyNow: "Lumen is moving an AI-native analytics product toward general availability while hiring its first inference platform team—the ideal window to avoid hard-wiring product velocity to one model provider.",
    accountSnapshot: ["Raised a $38m Series B to launch an AI-native analytics product", "Growing from 180 to 260 employees", "Hiring nine applied-AI, ML-platform, and infrastructure roles"],
    relationshipContext: ["First live conversation with the account", "Sam Okafor viewed model pricing and routing content twice", "Sam joined six weeks ago to take the product from private beta to GA"],
    recommendedPlays: ["Lead with faster model experimentation through one compatible API", "Use Lumen’s launch workload to compare quality, latency, and price", "Earn a technical follow-up around fallbacks before traffic scales"],
    discoveryQuestions: ["Which model-dependent workflow is hardest to tune before general availability?", "How is the team comparing model quality against latency and cost today?", "What happens to the product experience when the primary provider is degraded?"],
    watchOuts: ["No validated budget or buying process", "Do not over-index on model breadth before understanding the launch workload"],
    sources: [
      { label: "Synthetic CRM developer engagement" },
      { label: "Series B announcement", url: "https://example.com/lumen-series-b" },
      { label: "Inference careers", url: "https://example.com/lumen-careers" },
      { label: "Engineering leadership announcement", url: "https://example.com/lumen-vp-engineering" },
    ],
    confidence: "medium",
    generatedAt: now.toISOString(),
  };
  return { id: "lumen-first-call", label: "Lumen Labs", stage: "First meeting", summary: "Earn a technical second meeting around model flexibility before GA.", meeting, evidence, brief };
}

export function getDemoScenarios(now = new Date()): DemoScenario[] {
  return [meridianScenario(now), northstarScenario(now), lumenScenario(now)];
}

export function getDemoScenario(id: string, now = new Date()) {
  return getDemoScenarios(now).find((scenario) => scenario.id === id);
}

export function getDemoScenarioPreviews(now = new Date()): DemoScenarioPreview[] {
  return getDemoScenarios(now).map(({ id, label, stage, summary, meeting, brief }) => ({ id, label, stage, summary, meeting, brief }));
}
