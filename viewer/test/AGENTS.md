# viewer/test/ — Viewer guardrails

Guardrail tests only (`pnpm viewer:test`).

- **`bazaar-model-guard.test.ts`** — `/api/bazaar/model` never reaches a game POST (read-only client, routes in dry-run, no execute) and private data does not leave 127.0.0.1 (bind, foreign Host 403, POST 405).
- **`market-test-optimum.test.ts`** — the Market Test's a posteriori optimum (`../server/bazaar/market-test/optimum.ts`): the Hungarian algorithm versus brute force and the best common tick, pairs with surplus 0 and, on a tie, ours.

## Links

- ↑ [`viewer/`](../AGENTS.md)
- → Server: [`server/`](../server/AGENTS.md)
