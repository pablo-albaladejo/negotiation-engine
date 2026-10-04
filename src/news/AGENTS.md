# src/news/ — Bazaar news (Radio Rastro)

Watches the Bazaar's news (Radio Rastro, the Boletín del Bazar and El Tablón) and leaves a summary for the «Radio Rastro» panel of the viewer's Now tab. It also feeds `GameState.news` as a **hint** (approved narrow exception, like egg hints): which dealer, set or card is being talked about and in which direction.

**NEVER A FIGURE.** Nothing in this folder is imported from `coordinator/`, `dealers/`, `duels/`, `trades/`, `broker/` or `engine/`, none of those folders reads `GameState.news` (checked by `test/news-signals.test.ts`), and it never produces a figure or a decision. Some news items are true, others are rumours that do not come to pass and others are just Madrid colour: nothing says which is which.

## Files

- **`main.ts`** — `pnpm bazaar:news [--once] [--poll-ms 30000] [--no-llm] [--no-file-log]` (`--poll-ms` minimum 30000). Each lap reads what is new in the recorder's `stream-public.jsonl` (news.posted events) and, at most every 30 s, `GET /api/news` (GET only, client from [`shared/`](../shared/AGENTS.md)). It appends what is new (without repeating ids) to `results/bazaar-live/<local date>/news.jsonl` and rewrites news-summary.json atomically (tmp + rename). Log in `results/logs/<date>/news.log` (with `--no-file-log`, stdout only: used by `bazaar:up`, which already saves it there). It never leaves the loop on an error: it records it and carries on.
- **`news.ts`** — pure functions: schema of `/api/news`, `itemFromStreamLine`, `tagMentions` (names of sets, cards, dealers and venues; tags only), `rulesSummary`, `summaryPrompt` and `buildSummaryFile`.
- **`signals.ts`** — `readNewsSignals(dir, nowTick)`: reads news-summary.json and returns `NewsSignals` (`available`, `updatedAt`, `summary`, `items`); never throws (missing or broken file: empty). Each `NewsSignal` carries id, tick, `ageTicks`, source, headline, body, mentions by kind (sets, cards, dealers by persona id, venues), `direction` by keywords in English and Spanish (demand, supply, event, unknown) and `unverified: true`. No price field. `formatNewsSignals`: the «news» line of play's output.

The summary is requested from `claudeOnce` (from [`shared/`](../shared/AGENTS.md)) only when new news arrives; if it fails, takes more than 60 s or runs with `--no-llm`, the rules-based summary is used.

## Links

- ↑ [`src/`](../AGENTS.md)
- → Viewer: [`viewer/server/bazaar/`](../../viewer/server/bazaar/AGENTS.md) (`GET /api/bazaar/news` and `news` in `/api/bazaar/model`)
- → [`state/`](../state/AGENTS.md) (`GameState.news`)
