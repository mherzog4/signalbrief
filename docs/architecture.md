# Architecture

Signalbrief is a modular monolith optimized for one revenue workspace per deployment. That is the smallest secure unit for a BYOK OSS product: environment variables form the credential boundary, Vercel provides the compute boundary, and no central Signalbrief service sees customer data.

## Runtime flow

1. Vercel Cron calls the protected prepare endpoint every ten minutes.
2. The Google Calendar adapter selects near-term external meetings and resolves an account domain.
3. The pipeline acquires a delivery lock for the calendar event and start time.
4. Gong, CRM, and public research connectors execute concurrently and normalize results into evidence.
5. The compiler creates a Zod-validated brief with the selected model provider. A deterministic compiler is available when AI is unconfigured.
6. Slack delivery selects an organizer DM when mapped, otherwise a configured channel or webhook.
7. The delivery lock is retained for seven days. Failed runs release their lock for retry.

## Boundaries

### Calendar adapter

Calendar ingestion owns meeting selection and account resolution. Downstream connectors do not parse calendar-provider payloads. A future Microsoft Graph adapter should return the same `Meeting` type.

### Research connector

Every source implements `ResearchConnector` and returns `ConnectorResult`. A connector must catch provider-specific errors, limit returned evidence, and assign confidence without mutating another source’s result.

### Compiler

The compiler accepts only `Meeting` and normalized `Evidence`. Its output must pass `meetingBriefSchema`. This keeps provider changes from leaking into Slack presentation.

### Delivery

Slack formatting is deterministic Block Kit output. Delivery receives the calendar owner mapping but does not need access to research provider credentials.

### Store

The delivery store is deliberately tiny: acquire, complete, and release. Redis is not used as an application database. This contract can be backed by Postgres, DynamoDB, or another atomic store.

## Threat model highlights

- Public pages cannot invoke provider-backed generation because the API is protected with a separate admin bearer token.
- Cron requests require Vercel’s bearer secret.
- Retrieved web pages and CRM text may contain prompt injection, so they are serialized inside a marked evidence payload and explicitly treated as untrusted.
- Provider data is processed in memory and not persisted by Signalbrief.
- A Slack destination is selected only from server configuration, never from generated output.

## Scaling path

The next architectural boundary appears when one deployment serves multiple companies. At that point add workspace authentication, a relational database, encrypted credential records, OAuth refresh token rotation, per-workspace queues, audit logs, retention controls, and row-level tenant isolation. Those concerns should remain out of the single-workspace OSS path.
