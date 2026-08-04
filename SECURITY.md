# Security policy

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability. Until the project has a dedicated security mailbox, use GitHub’s private vulnerability reporting feature on the repository.

Include affected versions, reproduction steps, impact, and any suggested mitigation. Maintainers should acknowledge reports within three business days.

## Deployment responsibility

Signalbrief is self-hosted software that processes potentially sensitive calendar, conversation, and CRM data. Operators are responsible for access reviews, provider scopes, secret rotation, data-processing agreements, model-provider retention settings, and compliance with recording and privacy laws.

Use read-only provider credentials, enable durable delivery locks, keep `DRY_RUN=true` during validation, and never expose `CRON_SECRET`, `ADMIN_API_KEY`, or provider keys to client-side environment variables.

The public synthetic demo includes a best-effort in-memory rate limiter suitable for limiting accidental or low-volume abuse. Because serverless instances do not share memory, operators who enable live model spend must enforce a durable distributed limit or a platform-level firewall rule, plus provider budget alerts. Keep `DEMO_USE_LIVE_AI=false` on unrestricted public deployments.
