# scripts/ — Utilities

- **`bazaar-api-scan.mjs`** — Read-only scan of the Bazaar API (`pnpm bazaar:scan`, with `.env` and the broker key (`BAZAAR_BROKER_KEY`) loaded): GET to every endpoint, saves the responses in `results/bazaar-live/<date>/api-scan-HHMM.json`. `/api/cards/{id}` takes the asset's numeric id, not the ref (`SAL-09` gives 422).
- **`bazaar-dump.mjs`** — `pnpm bazaar:dump`: read-only dump to reconstruct the day in `results/bazaar-live/<date>/dump-HHMM/`: snapshot of all endpoints, our finished threads and duels, history of all assets, cards and packs (`/api/cards/{id}` from 1 up to 40 consecutive nonexistent ids), feed, `timeline.jsonl` ordered by tick and a summary in summary.md. The feed gives at most 500 events and does not paginate; in the history of other teams' cards the owner shows up as `a team`. About 600 requests, about 2–3 minutes.
- **`bazaar-stream-record.mjs`** — `pnpm bazaar:record [--scope team,public] [--quiet]`: records every event of the SSE stream in `results/bazaar-live/<date>/stream-<scope>.jsonl` (`{recv, scope, event, id?, data}`). Reconnects with growing backoff and `Last-Event-ID`; on 429/503 (6 streams per key) it reads `/api/feed` and saves whatever was not seen in `feed-poll.jsonl`. Leave it running all day: it is the only thing that preserves the full history of the feed.
- **`bazaar-convo-feed.mjs`** — `pnpm bazaar:feed`: prints live each new message from our threads (dealers and teams). Read-only, the key is never printed.
- **`check-agents-links.mjs`**, **`check-identifiers.mjs`** and **`check-agents-tree.mjs`** — `pnpm docs:check`: links in the AGENTS.md files, cited identifiers that exist in the code, and the folder tree (at most 10 versioned files per folder, an AGENTS.md in each, linked from the parent and linking to the parent; exempt are the root for the cap, `results/`, `design-system/.design-sync/` and the `assets/` of `docs/bazaar/bundles/` and `docs/bazaar/bundles/pretty/`).
- **`check-english.mjs`** — also in `pnpm docs:check`: code comments (versioned ts, tsx, mjs, js and css files) must be in English. Heuristic: accents or two or more Spanish stop words. It skips whatever is marked `game text` (on the line or the previous one); it does not look at strings.

## Subfolders

- [`ops/`](ops/AGENTS.md) — `pnpm bazaar:doctor`, `pnpm bazaar:up` and `pnpm bazaar:down`: check, start and stop the day.

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
- → [`ops/`](ops/AGENTS.md)
