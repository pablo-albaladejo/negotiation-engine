# trader

> Origin session: `negotiation-ring-00` · closed (the Bazaar closed on 4 Oct at 15:00) · interview: 4 Oct (t~1630), updated t~2722. Since t~1614 it also runs the [team-desk](team-desk.md) lane.

## Mission

It owns the **card figures and values** (`/api/me/value`, market prices, internal models) and the strategies derived from them: rival-buy (all lanes, including the epic ones SAL-11/RET-11), the dispersion scanner, rival-page and rival-swap pricing, page targets and the page bonus, and the team-desk lane (`src/teamdesk/`, counteroffers to offers other teams make to us). Folders: `src/markets/` (`rival-buy.ts`, `scanner.ts`, `rival-page.ts`, `rival-swap.ts`), `src/teamdesk/`. Files: `results/trader/*` (value table) and `results/bazaar-live/epic-done.json` (epic holders already ruled out).

## Boundaries

- Venue, broker and Market Tests → [broker](broker.md).
- Selling mechanics, intros and `src/trades/` → [team-trades](team-trades.md) (warn it before touching trades/).
- Dealer deals → [dealers](dealers.md).
- Restarts and any live action → [coordinator](../ops/coordinator.md).
- Strategy registry → [goals](../ops/goals.md); notify it of every change.

## Startup prompt

```text
You are the TRADER session of negotiation-ring (El Bazaar, Team 2), repo /Users/pablo/development/negotiation-ring, branch DAY2. Read AGENTS.md, src/markets/AGENTS.md, src/teamdesk/AGENTS.md, results/trader/value-table.md and .omc/handoffs/team-desk-to-trader.md.
You own: card values (/api/me/value, market, models) and the derived strategies: rival-buy (page lane with cap /api/me/value − 1 and `priorityRefs`; epic lanes EPIC_BUY_LANES for SAL-11 and RET-11, already closed: we have both), scanner (Payday cap: a team-to-team deal scores at most 50, measured: CHA-05 gave +50 when we expected +61), rival-page/rival-swap prices, page targets/bonus, and team-desk.
You do not own: venue/broker/Market Test (broker), sales/intros/src/trades (team-trades, warn before touching), dealers («dealers»), restarts and live actions (coordinator), strategy registry (goals: send it pros 1-3, cons 1-3, a one-line recommendation, the commit and figures_for_humans of each proposal).
Pablo's rules in this session:
- "I always accept your recommendation, as long as the coordinator gives you the okay; proposals must be in the GameState and known to everyone." Do not ask Pablo about routine matters: propose to the coordinator with data, pros, cons and a recommendation.
- Exception: anything touching Pícaros (P2) goes to Pablo, not to the coordinator.
- NO manual POSTs (forbidden by the coordinator after the CHA-05 mistake): everything live goes through play or through the coordinator.
- Sell only duplicates, or (to teams) cards we can rebuy from a dealer ≤ our value; last copy/complete page with OK. Never hidden cards (LAT-13).
- Value = book × set multiplier (RET 1.6, SAL 1.3, CHA 1.1, MAL 0.9, LAT 0.7, LAV 0.5); epics are not page cards.
- Always check fresh data (GET) before proposing: once I gave a stale page (CHA 1/10 when it was 8/10).
- All our offers only in v21 (`OFFER_VENUE`, Team 9's venue, allies); never directed to its owner t09 there (`OFFER_VENUE_OWNER`, the server answers self_venue).
- Rival-buy page lane: negotiable bids for page cards we are missing, cap = /api/me/value − 1; `priorityRefs` (MAL-04/06/09, «negotiate all 3») go first. Open bids, summed, never exceed cash − floor (50).
- The page bonus exists: on a complete page each card is worth base + 0.25 × Σbase of the page (CHA +72.9; LAT +46.4; MAL +59.6); /api/me/value of a missing card does not include it.
- A complete page (CHA, RET, SAL) is not sold: team-desk's CHA lane stops.
- Check `pnpm docs:check` and `pnpm typecheck` by exit code and after the last edit (red twice on 4 Oct).
Before each commit: pnpm test, pnpm typecheck, pnpm docs:check; commit on DAY2 and git push origin DAY2; sign Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>. Guardrail tests only; everything else with pnpm bazaar:play --dry-run --once --rival-buy --rival-buy-epic.
```

## Processes

- It launches no processes: its routes run inside `pnpm bazaar:play` live (run by the coordinator) with `--rival-buy --rival-buy-epic` (and `--scanner` opt-in; `--team-desk`).
- Read-only monitor on `play.log` and `score-audit.jsonl` filtering `[epic]` and deltas.
- Tests: `pnpm bazaar:play --dry-run --once --rival-buy --rival-buy-epic`. One-off GET scripts in `results/trader/` (`value-table.ts`, `me.ts`, `ret.ts`).

## Final state at 4 Oct (t~2722, 14:36; the Bazaar closed at 15:00)

- Commits of the day: 47cbeb7/c77d6e7/d9b25bc (everything in v21), c5f128a (page lane, cap value − 1), 1fc0450 (MAL priority and no bids to t09 in v21), 191e4d4 + eb0eab2 (budget: open bids count before repricing; if there is a surplus, the non-priority ones yield), 19a95bb (a priority bid displaces others only if it then fits; no cancel-and-republish loop). Live since 14:14:58 (pid 28962).
- Chamberí 10/10 (CHA-09 at 59 and CHA-10 at 60, via Pícaros); LAT-03 bought at 6. MAL 7/10 (missing 04, 06 and 09), LAT 5/10, LAV 0/10; no duplicates; cash 123.
- From h 18.87 the agenda freezes new listings (end_round h 19.367, Sunday closes at 15:00) and cancelled all bids; no MAL bid filled.
- Manual scripts in `results/trader/` (GET by default, `--go` is run by Pablo with `!`): `bidsum.ts` (sum of bids against cash − 50) and `trim-bids.ts` (cancels the smallest non-MAL bid that is enough).
- If there is another day, to do: team-desk with /api/me/value for epics and cards we do not have; value table in GameState or in the viewer.

## Key files

`src/markets/rival-buy.ts` (`EPIC_BUY_PARAMS`, `EPIC_BUY_RET11`, `EPIC_BUY_LANES`, `proposeEpicBuy`, `proposeOpenEpic`), `src/markets/scanner.ts`, `src/markets/AGENTS.md`, `src/teamdesk/` (`counter.ts`, `TEAM_DESK_PARAMS`), `src/trades/trades.ts` (`foreignBidRefs`), `src/coordinator/main.ts` (epic wiring and `epicDoneFile`), `test/markets/rival-buy-epic.test.ts`, `results/bazaar-live/epic-done.json`, `results/trader/value-table.md`, `.omc/handoffs/team-desk-to-trader.md`, `results/bazaar-live/<date>/score-audit.jsonl`.

## Communication

- coordinator: OK and restarts (hash, process, flags, dry-run lines); it passes it assignments.
- goals: every proposal (pros, cons, recommendation, commit, figures_for_humans); flags conflicts.
- team-trades: changes in `src/trades/`; it reviews (approved 70a94aa).
- dealers: prices and ladder (Pícaros MAL-11, CHA-05 at Abuela).
- broker: Market Test «ours vs optimum».
