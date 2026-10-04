# viewer/server/ — Viewer Node server

A node:http server (`http.ts`) that serves `/api/bazaar/*` and delegates the rest to Vite. 127.0.0.1 only, GET/HEAD only, Host checked (DNS rebinding); any other `/api` route returns 404.

## Files

- **`api.ts`** — `ApiResponse` type (`{ data, errors }`). **`read.ts`** / **`paths.ts`** — JSONL reading validated with Zod and paths resolved inside their root.
- **`main.ts`** — Entry point: starts the server at http://127.0.0.1:5199 (port configurable with `VIEWER_PORT`, address fixed to `127.0.0.1`; `VIEWER_BAZAAR_DIR` for the Bazaar `score.jsonl` directory).
- **[`bazaar/`](bazaar/AGENTS.md)** — the `/api/bazaar/*` endpoints: score, live, threads, duels, board (`/api/bazaar/board`) and model (`/api/bazaar/model`).

## How to work

```bash
pnpm --dir viewer start
```

## Links

- ↑ [`viewer/`](../AGENTS.md)
- → [`bazaar/`](bazaar/AGENTS.md) — Bazaar endpoints
- → Data: `results/bazaar-live/` (traces from `src/`)
