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

function openRouterScenario(now: Date): DemoScenario {
  const startsAt = fromNow(now, 24);
  const meeting: Meeting = {
    id: "demo-openrouter-applied-ai",
    title: "OpenRouter — Applied AI workflow review",
    startsAt,
    endsAt: fromNow(now, 54),
    ownerName: "Maya Chen",
    ownerSlackId: "UDEMO123",
    attendees: [
      { name: "Maya Chen", email: "maya@signalbrief.dev", title: "Account Executive", external: false },
      { name: "Taylor Morgan", email: "taylor@openrouter.ai", title: "Applied AI Lead", external: true },
      { name: "Jordan Kim", email: "jordan@openrouter.ai", title: "Developer Platform", external: true },
    ],
    account: { name: "OpenRouter", domain: "openrouter.ai" },
  };
  const evidence: Evidence[] = [
    { source: "crm", title: "Synthetic CRM — applied AI evaluation", detail: "Evaluation stage. The team wants a production-shaped workflow that demonstrates model portability, BYOK, structured outputs, observability, and clear failure handling—not a generic chat wrapper.", confidence: "high" },
    { source: "gong", title: "Synthetic Gong discovery — interview scenario", detail: "The strongest proof point is a concise workflow that uses OpenRouter as the model control plane, shows exact provider and model traces, and is honest about mocked upstream data.", observedAt: "2026-08-01T15:00:00.000Z", confidence: "high" },
    { source: "web", title: "Provider routing documentation", detail: "OpenRouter supports provider selection across models with routing controls for price, throughput, and latency, plus fallbacks when a provider is unavailable.", url: "https://openrouter.ai/docs/guides/routing/provider-selection", confidence: "high" },
    { source: "web", title: "Structured outputs documentation", detail: "OpenRouter supports strict JSON Schema structured outputs for compatible models, allowing applications to validate model responses before using them downstream.", url: "https://openrouter.ai/docs/structured-outputs", confidence: "high" },
    { source: "web", title: "OpenRouter quickstart", detail: "OpenRouter exposes an OpenAI-compatible API for accessing hundreds of models through a unified endpoint while keeping application attribution and keys server-side.", url: "https://openrouter.ai/docs/quickstart", confidence: "high" },
  ];
  const brief: MeetingBrief = {
    accountName: "OpenRouter",
    meetingTitle: meeting.title,
    meetingTime: startsAt,
    whyNow: "OpenRouter’s value is clearest inside a real workflow: this demo turns its routing, BYOK, and structured-output capabilities into an auditable pre-call brief that lands in Slack.",
    accountSnapshot: ["Unified API and SDK access to hundreds of AI models", "Routes providers by price, throughput, latency, and availability", "Supports BYOK and strict structured outputs for production control"],
    relationshipContext: ["Applied AI evaluation—not a generic model-wrapper exercise", "The team wants transparent traces, bounded data, and honest mocks", "A working Slack handoff is the proof that orchestration reaches a user"],
    recommendedPlays: ["Lead with OpenRouter as the control plane behind the workflow", "Show the provider, model, latency, schema, and recovery path in the trace", "Close on which customer workflow OpenRouter would want to productionize next"],
    discoveryQuestions: ["Which applied-AI workflows best demonstrate OpenRouter beyond API compatibility?", "What reliability and observability signals matter most before a workflow is customer-ready?", "Where would provider routing create the clearest user-visible advantage?"],
    watchOuts: ["Do not present synthetic Gong or CRM records as real OpenRouter data", "Avoid pitching a generic LLM wrapper—center routing, control, and reliability"],
    sources: [
      { label: "Provider routing docs", url: "https://openrouter.ai/docs/guides/routing/provider-selection" },
      { label: "Structured outputs docs", url: "https://openrouter.ai/docs/structured-outputs" },
      { label: "OpenRouter quickstart", url: "https://openrouter.ai/docs/quickstart" },
      { label: "Synthetic CRM evaluation record" },
      { label: "Synthetic Gong discovery record" },
    ],
    confidence: "high",
    generatedAt: now.toISOString(),
  };
  return { id: "openrouter-applied-ai", label: "OpenRouter", stage: "Applied AI", summary: "Position a production workflow around OpenRouter routing, control, and reliability.", meeting, evidence, brief };
}

function northstarScenario(now: Date): DemoScenario {
  const startsAt = fromNow(now, 98);
  const meeting: Meeting = {
    id: "demo-northstar-validation",
    title: "Northstar — Technical validation",
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
    { source: "crm", title: "$240k new-logo opportunity", detail: "Technical validation stage. Security review is due Aug 14. Economic buyer: Elena Park, CIO. Jordan Lee is the technical champion.", confidence: "high" },
    { source: "crm", title: "Mutual action plan", detail: "Target decision Aug 28. Open items: SSO, SCIM, US data residency, and security questionnaire. Procurement has not joined yet.", confidence: "high" },
    { source: "gong", title: "Architecture discovery — July 24", detail: "Jordan said 42% of inbound requests still require manual routing. Morgan asked for SAML SSO, SCIM provisioning, audit-log export, and US data residency.", observedAt: "2026-07-24T15:30:00.000Z", confidence: "high" },
    { source: "gong", title: "Executive discovery — July 11", detail: "CIO Elena Park tied the project to a Q4 platform-consolidation target and wants measurable reduction in engineering interrupts.", observedAt: "2026-07-11T18:00:00.000Z", confidence: "high" },
    { source: "web", title: "Northstar acquires Cedar Analytics", detail: "The acquisition adds a second engineering organization and increases pressure to standardize internal request routing.", url: "https://example.com/northstar-cedar", confidence: "medium" },
  ];
  const brief: MeetingBrief = {
    accountName: "Northstar Systems",
    meetingTitle: meeting.title,
    meetingTime: startsAt,
    whyNow: "Northstar’s security review is due in eleven days, while an acquisition and Q4 consolidation target make this validation the critical path to a $240k decision.",
    accountSnapshot: ["$240k new-logo opportunity in technical validation", "Cedar Analytics acquisition created a second engineering organization", "Q4 platform consolidation is the CIO’s executive initiative"],
    relationshipContext: ["Jordan Lee is the technical champion; Elena Park is the economic buyer", "42% of inbound requests still require manual routing", "Security requires SAML, SCIM, audit export, and US data residency"],
    recommendedPlays: ["Open with a crisp close plan for the four security requirements", "Quantify how consolidation reduces engineering interrupts", "Secure procurement attendance before the Aug 14 review deadline"],
    discoveryQuestions: ["Which security control is most likely to delay approval?", "What baseline will Elena use to measure fewer engineering interrupts?", "Who owns the final data-residency sign-off?"],
    watchOuts: ["Procurement has not joined the process", "Security review is on the opportunity’s critical path"],
    sources: [{ label: "HubSpot opportunity" }, { label: "Gong architecture discovery" }, { label: "Acquisition announcement", url: "https://example.com/northstar-cedar" }],
    confidence: "high",
    generatedAt: now.toISOString(),
  };
  return { id: "northstar-validation", label: "Northstar", stage: "Technical validation", summary: "Unblock a security review on the critical path to $240k.", meeting, evidence, brief };
}

function lumenScenario(now: Date): DemoScenario {
  const startsAt = fromNow(now, 212);
  const meeting: Meeting = {
    id: "demo-lumen-first-call",
    title: "Lumen Labs — First conversation",
    startsAt,
    endsAt: fromNow(now, 242),
    ownerName: "Maya Chen",
    ownerSlackId: "UDEMO123",
    attendees: [
      { name: "Maya Chen", email: "maya@signalbrief.dev", title: "Account Executive", external: false },
      { name: "Sam Okafor", email: "sam@lumen.example", title: "VP Sales", external: true },
    ],
    account: { name: "Lumen Labs", domain: "lumen.example" },
  };
  const evidence: Evidence[] = [
    { source: "crm", title: "High-intent inbound account", detail: "Sam Okafor viewed enterprise pricing twice and replied to an outbound sequence. No opportunity or prior meeting exists yet.", confidence: "high" },
    { source: "web", title: "$38m Series B", detail: "Lumen raised a $38m Series B to expand its commercial team and enter the enterprise market.", url: "https://example.com/lumen-series-b", confidence: "high" },
    { source: "web", title: "Sales hiring surge", detail: "Lumen plans to grow from 180 to 260 employees and has nine open sales and revenue-operations roles.", url: "https://example.com/lumen-careers", confidence: "medium" },
    { source: "web", title: "New VP Sales", detail: "Sam Okafor joined six weeks ago with a mandate to build the first repeatable enterprise sales motion.", url: "https://example.com/lumen-vp-sales", confidence: "medium" },
  ];
  const brief: MeetingBrief = {
    accountName: "Lumen Labs",
    meetingTitle: meeting.title,
    meetingTime: startsAt,
    whyNow: "A new VP Sales, fresh Series B capital, and nine open GTM roles suggest Lumen is designing its enterprise motion right now—before process and tooling harden.",
    accountSnapshot: ["Raised a $38m Series B to expand commercially", "Growing from 180 to 260 employees", "Nine open sales and revenue-operations roles"],
    relationshipContext: ["First live conversation with the account", "Sam Okafor viewed enterprise pricing twice", "Sam joined six weeks ago to build a repeatable enterprise motion"],
    recommendedPlays: ["Lead with a point of view on designing the motion before headcount scales", "Discover the operating gaps behind Sam’s pricing-page activity", "Earn a second meeting around one measurable workflow"],
    discoveryQuestions: ["What has to become repeatable before the next cohort of sellers starts?", "Where are deals currently losing momentum or executive visibility?", "What would make a new platform worth adopting this early?"],
    watchOuts: ["No validated budget or buying process", "Avoid over-indexing on funding as proof of urgency"],
    sources: [{ label: "HubSpot engagement" }, { label: "Series B announcement", url: "https://example.com/lumen-series-b" }, { label: "Leadership announcement", url: "https://example.com/lumen-vp-sales" }],
    confidence: "medium",
    generatedAt: now.toISOString(),
  };
  return { id: "lumen-first-call", label: "Lumen Labs", stage: "First meeting", summary: "Turn public growth signals into a sharp first-call hypothesis.", meeting, evidence, brief };
}

export function getDemoScenarios(now = new Date()): DemoScenario[] {
  return [openRouterScenario(now), northstarScenario(now), lumenScenario(now)];
}

export function getDemoScenario(id: string, now = new Date()) {
  return getDemoScenarios(now).find((scenario) => scenario.id === id);
}

export function getDemoScenarioPreviews(now = new Date()): DemoScenarioPreview[] {
  return getDemoScenarios(now).map(({ id, label, stage, summary, meeting, brief }) => ({ id, label, stage, summary, meeting, brief }));
}
