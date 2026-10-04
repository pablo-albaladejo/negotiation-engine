# viewer/src/screens/now/ — «Now» tab

What is happening right now, on one screen (the first Bazaar tab):

0. **Radio Rastro** (just under the header): summary of the news (llm/rules badge and age) and the latest ~6 (source, tick, headline, body and mentions), from `/api/bazaar/news` every 15 s. Display only: some are true, some are rumors and some are Madrid-only.
1. **Tick header**: game time, tick, round and weight, countdown to the next tick (or gates closed and when they open), age of the model and of the API data, and the DRY-RUN mark (nothing is sent). «rebuilding…» if the server is building another model: the latest one is shown without waiting.
2. **Tick plan**: SELECTED intents from the coordinator in arbitration order, with action, which conversation or offer it targets, the figure decided by code and the goal (`goal.why` → global goal). Quotas against `clock.limits`; the DROPPED ones, collapsed with their reason.
3. **Live conversations**: dealers, duels, El Rastro and venues; rounds used and estimated, last price of each side, turn, our next figure, their expected next price («her next ≈», per-persona fit, dealers only), deadline in ticks and status (our move, waiting for them, accept pending, cooloff). Finished ones, on a collapsed line. Each row opens the conversation drawer.
4. **Our published offers**: venue, price, age, fee and whether they cross anything; status of our venue.
5. **What changed since the previous tick**: in-memory snapshot on the client (survives a tab change, not a reload).

- **`NowView.tsx`** — the screen.
- **`RadioRastro.tsx`** — the «Radio Rastro» panel and its reading of `/api/bazaar/news`; shown in the «News» tab ([`news/`](../news/AGENTS.md)).
- **`nowModel.ts`** — pure functions (`tickHeader`, `planRows`, `quotas`, `liveConversations`, `offerLines`, `snapshotOf`, `diffSnapshots`).

Data: the board (`/api/bazaar/board`, every tick) and the `now` field of `/api/bazaar/model` (GET only). No private values or limits; all plain text.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
- → Server: [`viewer/server/bazaar/`](../../../server/bazaar/AGENTS.md) (the model's `now` core)
