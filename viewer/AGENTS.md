# viewer/ — Bazaar viewer

Independent package (React + Node server) with a single tab, `#bazaar`: a cockpit: score and rank (with the distance to the team ahead and to the leader), upcoming calendar appointments, what is open now (duels with limit and bids, threads, our offers, warning if we sell our only copy), album with the missing cards and their value, deals that moved the score (the game's real Δ), status of our agents, collapsed history (duels apart, no verdict) and collapsed market (leaderboard with negotiation, market, level, album with ★ = completed pages and deals per team; feed, El Rastro and our venue). Missing cards use the official rarity colors; the duel rival is another team under an alias. Each conversation opens in a side panel (closed with Escape) with the negotiation curve: our offers, the rival's, our limit per tick, our value (or the duel limit), the final outcome and, if the limit dropped during the purchase, a note with the likely reason; X axis in real ticks and Y axis in round numbers; hovering shows a box with the values of that tick. Who is who: us always "Team 2 (us)", the other teams by name, and each party with its type (dealer, duel rival, public offer, team); in the books, where the Bazaar anonymizes the author, ours are recognized by offer id. 127.0.0.1 only.

**"Now" tab** (the first): what is happening right now: tick header (time, tick, round and weight, countdown, age of the model and of the API, DRY-RUN), tick plan (SELECTED intents in arbitration order with figure and target, quotas, collapsed DROPPED), live conversations with their state, our published offers and our venue, and what changed since the previous tick. See [`src/screens/now/`](src/screens/now/AGENTS.md).

**"Model" view** (tab next to the cockpit): OUR internal model, not a mirror of the API, served by `/api/bazaar/model`. "Venue" card with `venue.mechanismDecision` (auto or board?, from `decideMechanism` in [`src/venue/`](../src/venue/AGENTS.md); read-only). Time summary on top ("h 2.65 · R1 ×0.5 · closed until Sat 09:00"); environment → state → decision (reads that failed, `GameState`, tick budget from `clock.limits` with the ASSUMPTION of the duel accept); 0–24 h timeline (rounds and weights, closings, events with our planned action and its lead time, recent triggers); coordinator (each intent per route with SELECTED/DROPPED and reason, and the `ACCEPT_PRIORITY` table); goals (score per component, weights, levers, SAL-09, cash floor and caps); personas (state, type, traits, unlock progress, others' eggs) and the hints corpus with filters; "News signals" (`GameState.news`: news as a hint, unverified and never a figure); model conversations (duels, dealers and El Rastro offers); markets, venues, prices per card, packs; eggs and flags. The drawer of each conversation adds STATE and STRATEGY and the planned path as a dashed line over the curve; with dealers, also their planned path (dashed with lo–hi band), their estimated limit (line with band), the planned walk-away round and a note "fitted from n observations · mirror · next ≈ X P"; next to the offers table, the "Dealer fit" strip (parameters of that persona with interval and n, the band's measured limit and `welcome` if it is the first conversation with that dealer: it only measures the limit). The "Strategy" card and the curve always use the persona's model as of TODAY (`personas[].model` or, if missing, `estimates`), also in old or closed conversations; "State" compares our round with its estimated walk-away (walk_after_rounds ± patience_jitter). The side is always stated from both points of view ("we sell · she buys"). "Dealer estimates" panel per persona: parameters with interval, n and their convergence (sparkline), limits per band with *fewSamples*. Dealer side only: never our values or reserves. Fields that `src/state/` does not carry yet are drawn only if present.

## Structure

- **[`server/`](server/AGENTS.md)** — `/api/bazaar/*` over the Bazaar API and `results/bazaar-live/`.
- **[`src/`](src/AGENTS.md)** — the React app (`BazaarScreen`).
- **[`test/`](test/AGENTS.md)** — model guardrails (`pnpm viewer:test`).
- Design system by alias to [`design-system/`](../design-system/AGENTS.md) (no build).

## Invariants

- **127.0.0.1 only**, Host checked, GET/HEAD only.
- **Towards the Bazaar only GET**: board ≤ 2 req/s and model ≤ 1.5 req/s (viewer < 4 req/s); it never returns the key.
- **The model cannot send**: read-only client (`ReadOnlyBazaarClient` + `readOnlyFetch`), routes in dry-run, never the execute method; guardrail test in `test/bazaar-model-guard.test.ts` (over `server/bazaar/bazaar-model.ts`) (`pnpm viewer:test`).
- **Private data only locally**: the model carries private values, `your_limit` and reserves; the server only listens on 127.0.0.1 and rejects any other Host.
- Only write: `results/bazaar-live/<date>/verdicts.json` (value of each deal, computed once).
- **Rival text**: plain text only, never as HTML.

## How to use

```bash
pnpm --dir viewer install
set -a && . ./.env && set +a && pnpm viewer   # http://127.0.0.1:5199/#bazaar
pnpm viewer:typecheck
pnpm viewer:test   # model guardrails
```

`VIEWER_PORT` changes the port; `VIEWER_BAZAAR_DIR` the traces folder (default `results/bazaar-live`); `BAZAAR_KEY` enables the private part of `/api/bazaar/board` (without a key, only the public market). `VIEWER_BAZAAR_SNAPSHOTS` points to a read-only backup if the Bazaar does not respond.

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
- → [`src/`](../src/AGENTS.md) — where the traces come from
