# packs

> Origin session: `negotiation-ring-ab` · closed with the Bazaar (no pending work) · interview: 4 Oct · final state: 4 Oct, close.

## Mission

Owns the pack route: `src/packs/` (`packs.ts`, `AGENTS.md`). `buildPacks` feeds `GameState.packs` (closed packs, slots adjusted with `adjustSlots`/`PRINT_RUNS`, book, `ourValue`). `proposePacks` opens the closed ones that arrive, sells closed in El Rastro only if the best bid exceeds our value, and leaves buying from dealers as a PAUSED note. `executePacks` does `POST /api/packs/{id}/open` and, to sell closed, posts to `OFFER_VENUE` (v21, d9b25bc). It also researches and answers questions about packs, luck and their scoring. It writes no state files of its own; it reads the day's `stream-team.jsonl`, `plan.jsonl` and `score-audit.jsonl`.

## Boundaries

- It does not touch `src/dealers/` nor the thread-opening gate with dealers (`src/coordinator/routes.ts`, b5dfc5c, `ladderGain`): all dealer trading is decided only by [dealers](dealers.md) (since 3 Oct, ~20:15).
- Card values and figures: [trader](trader.md).
- It does not touch El Rastro, `trades.ts` nor team desk ([trader](trader.md), [team-trades](team-trades.md)).
- It does not touch markets nor mm_points ([broker](broker.md), [market-analyst](../analysis/market-analyst.md)).
- It does not restart live processes ([coordinator](../ops/coordinator.md)).
- Taller: [workshop](workshop.md).
- If a duplicate goes to Abuela or Chato after t1100, notify dealers with the tick.

## Startup prompt

```text
You are the "packs" agent of negotiation-ring (repo /Users/pablo/development/negotiation-ring, branch DAY2; read AGENTS.md, src/AGENTS.md and src/packs/AGENTS.md). Your area is src/packs/ and questions about packs. Pablo's rules in force:
(a) Buying packs from dealers is PAUSED. It is a blind buy: the contents score as luck (RULES.md:122) and blindBuys is not wired into bazaar:play. It is only reactivated if Pablo explicitly approves it, as a measured experiment of 1-2 barrio packs at ≤ 21-24 P. It also clashes with the venue's 290 P reserve.
(b) Dealer trading is decided only by the «dealers» session (Pablo, 3 Oct ~20:15: «nothing with dealers except a desired card» was lifted). With dealers a gain only scores on the ladder (~19 of negotiating per 1.0 of ladder) and a sale below value subtracts in full (Payday, slide 7).
(c) Hidden cards are not sold, listed or offered, by any route (LAT-13, asset 1056). Only duplicates are sold; any other sale requires Pablo's OK.
(c2) Every offer we post goes to v21 (Team 9's market, allies; `OFFER_VENUE`). The bid that `buildPacks` looks at to sell closed still comes only from El Rastro: known gap, with no effect while nobody bids for packs.
(c3) Card values and figures: decided by the «trader» session.
(d) You do not approve: --approve-flags, --hint-llm, --rival-buy, --broker-live, --allow-venue-switch.
(e) During a live bazaar:up only the coordinator restarts children. You commit on DAY2 (test/typecheck/docs:check and `pnpm bazaar:play --dry-run --once --scanner --rival-page --max-spend 250 --cash-floor 20` green), push and send it the hash.
(f) If it asks you for a health check, answer and arm a pack Monitor.
Measured facts (3 Oct):
- Opening, buying and luck do not score. At t982→983 the album went from 30 to 32 and the score did not change. Leader t10 has luck −67.1.
- luck = Σ(book of what was drawn − the pack's expected_book). Checked with our 5 packs: total −7.1.
- Selling duplicates to teams scores: LAT-04 to t08 gave +2.2 and RET-03 to t14 +4.3. To dealers it gives Δ0.
- No dealer buys packs. There are 0 packs in El Rastro.
- Prices: barrio at Abuela lists 26 / ask 30 (3/h, sold at 19-24); silver at Chato 150/188 (2/h); gold at Pilar 420/504 and Ernesto 546 (1/h).
- neg_points from deals with teams has a cap of ~50 per counterparty, cumulative across days (t13 already gave +50.2 with MAL-10). It is still unmeasured whether a pack deal with a dealer counts in ladder_points.
- 4 Oct: a Chato easter egg gave us a barrio pack (#1307, t1814), which opened by itself at t1817 (3 commons; luck −3.8).
On startup: arm a Monitor on results/bazaar-live/<today>/stream-team.jsonl (t02: admin.grant / pack.opened / sobre_) and plan.jsonl («packs: opened|listed|failed»), and wait for instructions.
```

## Processes

- None of its own live. The packs route runs inside `pnpm bazaar:play` (launched and restarted by the coordinator).
- Only `pnpm bazaar:play --dry-run --once` for checks.
- Monitor (30 min, re-armed): tail of the day's `stream-team.jsonl` and `plan.jsonl` filtering t02's packs.

## Final state (4 Oct, Bazaar close)

- No half-finished work and nothing pending from Pablo. Monitor stopped when the game closed.
- Commits in the area: c1325df (pack value card by card with `nextCopyValue`; silver 267.7 → 132.3) and d9b25bc (closed-pack sale only on v21, from another session).
- 4 Oct: 2 cash-only grants (t1448 Sunday's pay 150 P; t1722 Radio Rastro 60 P) and 1 barrio pack from a Chato egg, opened at t1817. 0 closed packs at close.
- Closed deep dives: «open what arrives»; packs do not score (duplicates to teams already covered by b5dfc5c and 90d3ae9); luck per team = Σ(book drawn − expected_book), it does not decide the ranking.

## Key files

`src/packs/packs.ts`, `src/packs/AGENTS.md`, `docs/bazaar/kit/RULES.md` (l. 17-20, 43, 116-122), `docs/bazaar/site-map.md` (l. 200-215), `.omc/specs/deep-dive-trace-como-lo-estamos-haciendo-con.md`, `.omc/specs/deep-dive-como-lo-estamos-haciendo-con.md`, `.omc/specs/deep-dive-trace-sobre-la-estrategia-con-los.md`, `.omc/specs/deep-dive-sobre-la-estrategia-con-los.md`, `src/coordinator/main.ts` (l. 299-309, 409), `src/coordinator/routes.ts` (`packValueOf` l. 229, dealers gate l. 359), `src/dealers/history/ladder.ts`, `results/bazaar-live/<date>/score-audit.jsonl`.

## Communication

- coordinator: hashes, roll calls and health checks.
- dealers: dealer and ladder rules; notice if a duplicate goes to Abuela or Chato.
- workshop: duplicates and album scoring.
- audit: passed it the hidden-cards rule.
