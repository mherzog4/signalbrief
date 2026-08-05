# Signalbrief interview demo

Signalbrief is an applied-AI system for the moment immediately before a sales call. It converts fragmented account context into a brief an account executive can scan in under 90 seconds.

Hosted demo: [signalbrief-alpha.vercel.app](https://signalbrief-alpha.vercel.app)

## Five-minute walkthrough

1. Start at the upcoming-meetings view. Explain that calendar events are the scheduling primitive: a cron scan selects external meetings inside a configurable prep window.
2. Open **Run the brief pipeline** and choose one of three synthetic situations:
   - Meridian AI: consolidate a fast-growing AI product onto OpenRouter routing and observability.
   - Northstar: unblock a technical/security review on a $240k opportunity.
   - Lumen Labs: prepare a first-call hypothesis from sparse CRM and public signals.
3. Select **Generate brief**. When controlled Slack delivery is enabled, this becomes **Generate + send to Slack**. The API fans out to three `ResearchConnector` implementations concurrently. For the demo they are deterministic mock adapters; production adapters call Gong, HubSpot, and a web-research provider.
4. Read the Slack brief from top to bottom: why now, account snapshot, relationship context, recommended plays, and sourced evidence.
5. Inspect the execution trace. It shows per-connector latency and evidence count, model mode, generation time, total duration, normalized evidence, and a unique run ID.
6. Switch scenarios to demonstrate how the same contract behaves with dense late-stage evidence versus sparse first-call evidence.

## What is mocked

The demo does not claim to access a real Gong, CRM, or calendar tenant. Upstream payloads are synthetic and clearly labeled in the product.

Each mock implements the production `ResearchConnector` interface and returns the same normalized `Evidence` records as a live source. This keeps mocking at the network boundary rather than mocking the orchestration or UI outcome.

Curated brief fixtures are the default compiler for the public deployment. This gives the interview demo deterministic quality, zero model spend, and no dependency on an upstream provider during the conversation.

## What is production code

- Server-side route execution on Vercel
- Concurrent connector orchestration and partial-failure isolation
- Connector and generation latency measurement
- Evidence normalization and confidence labeling
- Shared Zod contracts for model, fixture, fallback, and Slack output
- Prompt-injection boundary for retrieved evidence
- OpenRouter, OpenAI, and Anthropic provider selection
- Slack Block Kit rendering
- Protected live generation and cron routes
- Optional Redis delivery idempotency
- Request IDs, structured operational events, and a graceful UI error boundary
- Best-effort public rate limiting with explicit headers
- Scheduled production smoke tests and a real Chromium CI journey
- Executable grounding, numeric-claim, source-coverage, concision, and actionability evaluations

## OpenRouter story

OpenRouter is a first-class AI provider through `@openrouter/ai-sdk-provider`, not merely a hard-coded OpenAI-compatible URL. Operator-owned keys, OpenRouter model identifiers, and application attribution remain server-side.

With `DEMO_USE_LIVE_AI=true`, a bounded synthetic scenario is compiled live using `AI_MODEL`. With the flag off, the trace says **Curated fixture** rather than implying that a model call occurred.

This design demonstrates three production concerns:

1. Provider portability: the compiler depends on the AI SDK language-model contract, not one model vendor.
2. Output reliability: every model response must satisfy the same `MeetingBrief` Zod schema.
3. Cost safety: the public surface cannot incur AI spend or post to Slack unless the deployer explicitly enables each capability. Slack delivery has its own one-message-per-minute client limit.

## Likely technical questions

### Why not let an agent browse freely?

The system normalizes bounded source results before generation. This improves auditability, makes citations possible, limits prompt-injection exposure, and keeps latency/cost predictable. Agentic retrieval can be added inside a connector without changing downstream contracts.

### How are partial failures handled?

Connectors run independently and return `ok`, `skipped`, or `error`. One unavailable source does not discard usable evidence from the others. Brief confidence should fall when evidence becomes sparse.

### How do you prevent hallucinations?

The prompt restricts generation to supplied evidence, retrieved content is delimited as untrusted data, output is schema-validated, linked sources are preserved, and a deterministic fallback is available. A production version should add claim-to-source entailment checks.

The repository also includes an executable evaluation harness. It scores factual overlap, requires every numeric claim to appear in normalized evidence, measures source coverage and concision, and includes a negative test that injects a plausible `$999m` hallucination.

### How would this scale?

The next step is one durable job per meeting, backed by Redis or a workflow engine. That gives per-meeting retries, concurrency limits, replay, and dead-letter handling instead of holding an entire calendar batch inside one cron invocation.

### Why single-workspace BYOK?

It is the smallest credible OSS trust boundary. Credentials remain in the adopter’s deployment. A hosted multi-tenant edition would require OAuth installations, encrypted credential storage, tenant-isolated persistence, audit logs, and administration.

## Production gaps

The interview demo intentionally does not hide the remaining work for a real customer deployment: renewable calendar OAuth, real provider credentials, Gong transcript retrieval, Slack OAuth, mandatory durable deduplication, durable jobs, tenant isolation, and provider-specific integration tests.
