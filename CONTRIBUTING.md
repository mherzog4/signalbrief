# Contributing

Thanks for helping make pre-call preparation better.

1. Fork the repository and create a focused branch.
2. Install dependencies with `npm install`.
3. Keep provider payloads inside their adapter; normalize all research to `Evidence`.
4. Add tests for success, missing configuration, and upstream failure.
5. Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run eval`, `npm run test:e2e`, and `npm run build`.
6. Open a pull request describing the seller problem, data accessed, required scopes, and failure behavior.

Never commit live customer data or API keys. New integrations must request the narrowest read-only scopes possible and document their retention behavior.
