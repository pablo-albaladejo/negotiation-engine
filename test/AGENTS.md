# test/ — Guardrail tests

Hackathon: only what is non-negotiable is tested (team decision, 3 Oct 2026). Everything else is tested with `--dry-run`.

- **`guardrails.test.ts`** — `enforceGuardrails` and `enforceOfferGuardrails` (multi-issue) with fast-check: they never cross the limit, are monotonic, reject non-finite values; with a single issue they match the 1D one; generators in `engine/arbitraries.ts`.
- **`venue-switch.test.ts`** — the venue mechanism change is never executed without `--confirm` and `--allow-venue-switch` (not even in dry-run), is never proposed within N ticks of a bench, at most one comes out per tick, and `decideMechanism` only recommends `switch-to-board` with sessions, ratio, cash, time and heartbeat all green.
- **`rival-page.test.ts`** — sales directed at a rival (`src/markets/rival-page.ts`): price ≥ floor and net ≥ margin after fee; never from a target set, an almost-ours page, our last free copy nor a locked, reserved or occupied asset; κ 0 when their complete pages ask for more unseen cards than they have; nothing without rivals or with stale data; monotonic repricings and never below the floor; `planTick` never cancels an offer with `to`.
- **`broker-any-copy.test.ts`** — broker of our venue (`planAnyCopy`, `planPublic`) with random books of real shape: never matches different cards, never ask > bid (with fee), never reuses an offer nor an asset and respects the per-tick cap.
- **`news-signals.test.ts`** — `readNewsSignals` never throws with any content and gives no more numbers than id, tick and `ageTicks`; no file in `coordinator/`, `dealers/`, `duels/`, `trades/`, `broker/` nor `engine/` reads `.news` or imports from `src/news/`.
- **`scanner.test.ts`** — dispersion scanner (`src/markets/scanner.ts`, `proposeMarkets`): with random copies, values and prices it never buys above marginal value − fee − margin nor sells below marginal value + fee + margin; the spend cap per game hour and the cash floor hold even if all proposed purchases are executed; at most N deals per counterparty and hour; never sells a card with an active rival-page directed sale nor the last free copy of a card.
- **`last-copy.test.ts`** — last free copy (`src/shared/last-copy.ts`): for any configuration of locked and reserved copies the helper never allows giving the last free copy nor one that is not free; El Rastro acceptance (`planTick`, also in a venue without fee) never pays with it and there always remains a free, unannounced copy of what it gives; a directed rival-swap change (`proposeRivalSwap`) never gives the last free copy, gains at least `minGain` and leaves one open per team.
- **`duels-micro-step.test.ts`** — duels: if the rival moves every round, our offers never repeat while ≥ 1 P of margin remains and never cross the limit (1 P micro-concession, text = figure).
- **`duels-days.test.ts`** — duels with days (Duels II/III): with any readable form of `your_days_weight` (number, table, object "0".."10", `{ weight }`) the offer carries whole days 0..10, text = figure and does not cross the limit; an unreadable weight is not silently turned into 0: the duel is paused with no message or acceptance (also if `issues` is missing); `days_meaning` fixes the direction of a single weight.
- **[`bazaar/`](bazaar/AGENTS.md)** — agent guardrails: figure = text, offer shape, one asset in one place, caps, menu, coordinator, flags and packs.
- **[`markets/`](markets/AGENTS.md)** — guardrails of the market routes: rival-buy epic route (ceiling, cash floor, only teams on the list, one open bid).
- **[`engine/`](engine/AGENTS.md)** — fast-check generators of the engine.
- **[`fixtures/`](fixtures/AGENTS.md)** — real dealer sheets and thread 56 (reference).

```bash
pnpm test
```

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
