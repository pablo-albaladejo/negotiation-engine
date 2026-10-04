# src/shared/ — What is common

What every route uses: the API's HTTP client, Zod schemas, keys, «one asset in one place only», traces and the figure.

## Files

- **`env.ts`** — `loadBazaarEnv`: `BAZAAR_URL` and `BAZAAR_KEY` from the environment or from `.env` (process.loadEnvFile). The key is never printed.
- **`client.ts`** — `BazaarClient`: X-Team-Key header, `TokenBucket` (4 req/s, burst 2; the server allows 5; with priority: the client's prioritized method gives another client with the same key and the same bucket whose requests go ahead of the normal ones without raising the total, used by the duels route), retry (up to 3) of rate_limited and too_many_failures (and of network failures only on GET), wait_for_tick (sleeps until the next tick only with waitOnTick, off by default and that nobody turns on: the loop skips to the next tick), a POST is never repeated after a network failure. Typed errors `BazaarError` with `code`, `status` and `extra`. Cache of private values in the client itself (`/api/me/value`): a value lasts an hour and `noteHand` forgets the whole set in which some quantity changed (the page bonus depends on the rest of the set); `seedValues` seeds what comes from `/api/me` and, only on the first tick, the on-disk cache (`results/bazaar-live/values.json`, saved together with the hand: without it, it is not used). Everyone sharing a client (agents, coordinator, viewer) asks only for what is missing.
- **`schemas.ts`** — Tolerant Zod (extra fields allowed). `/api/dealers` answers with personas: `DealersSchema` accepts both names.
- **`asset-locks.ts`** — **critical guardrail**: one asset, one place. `busyAssets` (open threads + `/api/me/offers`) and `sellBlocked`, used by the dealer agent; `assetsInThreads`/`assetsInOffers` are used by `trades`. The dealer agent does not open a sale thread for an asset already in another thread or open offer (if it cannot read them, it offers none); `../trades/agent.ts` does not list or pay with an asset that is in a thread with a dealer. `isKeepsake` (Pablo's rule, 3 Oct: **hidden cards are NOT sold**): every hidden card (`hidden: true` in the catalogue; `rememberHiddenCards` records them on every read of `/api/catalog` from `client.ts`, with LAT-13 seeded), whatever its value, and also a single-print-run card (`print_run` 1) or an epic/legendary without positive private value never leaves on its own; `heldAssets` (trades) marks it `locked`, so neither El Rastro nor rival-page, rival-swap, the scanner or the team desk offer it (3 Oct: the gift of the LAT-13 egg, «La Chulapa Dorada», with your_value 0, was offered to banco on the next tick).
- **`last-copy.ts`** — **last-copy guardrail**: `freeCounts` (free copies = in hand − locked − reserved), `takesLastFreeCopy` and `isLastFreeCopy`: no sale or payment can leave 0 free copies of a card. Used by El Rastro's acceptance (`../trades/trades.ts`), the scanner (`../markets/markets.ts`) and rival-page.
- **`trace.ts`** — `FileTrace`: JSONL in `results/bazaar-live/<date>/decisions.jsonl` and `thread-<id>.jsonl` (tick, prices, reserve used, action, rule, result).
- **`offer-venue.ts`** — `OFFER_VENUE` = `"v21"`: the only venue where we post offers (bids, listings and targeted ones). Pablo's decision of 4 October: v21 is Team 9's market, our allies, with 0% commission and board mechanism. Accepting other people's offers (scanner, markets) stays in each offer's venue.
- **`score.ts`** — the figure we maximise: `ScoreTracker.record` reads from `/api/me` only the public fields of the figure (closed list; the server's private rarity/luck fields are never read) and writes a snapshot per tick to `results/bazaar-live/<date>/score.jsonl` (`FileScoreTrace`), with `delta` per field and `cause` (thread, dealer, action, price) from the trace of the same tick. `formatScoreSummary`/`formatScoreBreakdown` give the CLI line and the breakdown of `bazaar:status`.
- **`llm.ts`** — `claudeOnce`: one call to `claude -p --model haiku` with the prompt via stdin and a 60 s cap; null if it fails, never throws. Used by the news summary (`../news/`) and hint labelling (`../hints/labels.ts`); its output is never a figure.

## Rules

- Nothing here decides a figure; the key never appears in a trace or a log.

## Links

- ↑ [`src/`](../AGENTS.md)
