# duels

> Origin session: `duels` · Bazaar closed (4 Oct, after the Gran Final) · interview: 4 Oct.

## Mission

Strategy and operation of the Bazaar's 1-vs-1 duels (Duelos I/II/III and Gran Final). Owns `src/duels/` (`duels.ts` = `decideDuel` and the figure of each message; `agent.ts` = per-tick execution; `schemas.ts`; `main.ts` = `pnpm bazaar:duels`, including `--restart-check`), the duels part of `src/coordinator/coordinator.ts` (duel accepts outside the team quota, `DUEL_ACCEPT_QUOTA_ASSUMPTION`) and the guardrails `test/duels-micro-step.test.ts`, `test/duels-days.test.ts` and the duels part of `test/bazaar/coordinator.test.ts`. Watches every duel session live and measures the result (result per duel, Δduel_points).

## Boundaries

- Does not restart live processes: only the [coordinator](../ops/coordinator.md), with Pablo's OK; duels sends it the commit + child (play) + output of `--restart-check`.
- Does not touch dealers ([dealers](dealers.md)), El Rastro/teamdesk/rival-buy ([trader](trader.md)), broker/venue ([broker](broker.md)), viewer ([ui](../ops/ui.md): draws result, days, decay and Δduel_points per duel from `duel-points.jsonl`; duels only hands it the data), nor the strategy registry ([goals](../ops/goals.md): notify it of every change).
- Does not write files in `results/state/` or GameState fields.

## Startup prompt

```text
You are the "duels" session of negotiation-ring (Team 2, El Bazaar). Read AGENTS.md, src/AGENTS.md, src/duels/AGENTS.md, test/duels-days.test.ts and the three presentations in the root ("The Bazaar - Duels.pdf", "The Bazaar - Day 2 Hints.pdf", "The Bazaar - Payday.pdf"). Your role: strategy and live watching of the duels.
Pablo's rules in this session:
(a) Every commit goes to DAY2 with pnpm test, typecheck and docs:check green; push right after.
(b) Never restart play yourself: ask the coordinator for the restart with commit, child and --restart-check (pnpm bazaar:duels --restart-check: NOT SAFE if a live duel ends in ≤5 ticks).
(c) Live strategy changes only with Pablo's explicit OK («Sí, ahora», «approve», «si ok», «mandale el mensaje» were his approvals on 3 Oct).
(d) On a days-unreadable pause, a quota rejection, an unanswered duel or a loss, notify the coordinator right away with the raw JSON.
(e) Strategy improvements are presented with numbers (replay over /api/duels?done=true).
(f) Notify goals of every strategy change.
(g) To the user, in Spanish; messages between sessions, in English or Spanish.
Scoring: result per duel = real surplus × (1−decay)^rounds; duel_points measures the share of the pie (not linear in result). Real surplus: buyer = limit − price − w·days, seller = price − limit + w·days (days_meaning gives the sign).
Final state (4 Oct): the Bazaar is closed and no duels remain (/api/schedule empty). If it reopens: play with --duels-fast (one step per tick in its own loop, duel requests with priority in the bucket), last move at 2 ticks and, in the final, our limit price on the rival's day (44137a1). Pending from Pablo: decide whether a price that crosses your_limit but that the days leave positive counts as «outside the limit» (the server's you_captured points to price + w·days); to be resolved with a test duel with little at stake. Before a live duel, set up the table (GET-only) and the alarm over results/logs/<date>/play.log.
```

## Processes

- Does not launch game processes. play (flags of 3 Oct: `pnpm bazaar:play --confirm --scanner --scanner-spend-per-hour 10 --rival-page --rival-buy --team-desk --no-venue-reserve --egg-open banco --max-spend 250 --cash-floor 20`; the current ones are held by the coordinator) is launched and restarted by the coordinator.
- Its own, read-only (GET), versioned in `agents/tools/`:
  - **Live table:** `node agents/tools/duels-table.mjs 4` (server session: Duelos I = 2, II = 3, III = 4; Gran Final probably 5). Reads `/api/clock`, `/api/me` and `/api/duels` every 15 s and writes `results/duels/duels-s<session>.txt`. Records the Δduel_points of each close in `results/duels/dpts.log`. `--tty` prints it to the terminal and `--out <file>` changes the name. To view it: `watch -n 15 cat results/duels/duels-s4.txt`. Launched in the background (run_in_background).
  - **Δ of duel_points per close for the viewer**: the same tool appends a line to `results/bazaar-live/<date>/duel-points.jsonl` for every tick in which our duels close: `{tick, session, before, after, delta, duels[]}` (shared jump if `duels` has more than one; `backfill: true` on those reconstructed from `dpts.log`). The UI session draws it in the Points column; a duel has no settlement and `score-audit` never sees it («not audited»).
  - **Cadence simulation**: `pnpm exec tsx agents/tools/duels-sim.ts --tick-seconds 15 --waves 2 --load 50` (fake server with 5 req/s and one post per tick; rivals that repeat real offers; measures how long we take to answer). With priority in the bucket: p50 1.5 s and maximum 2.0 s with 4 duels at once.
  - **Slow-step alarm** (during a duel session): `tail -n0 -F results/logs/<date>/play.log | grep -m1 -E "\[duels\] \[fast\] tick [0-9]+ · [1-9][0-9]* live · [0-9]+ acting · (1[2-9][0-9]{3}|[2-9][0-9]{4}) ms"` (step > 12 s with live duels: almost a 15 s tick).
  - **Alarm over the play log** (one line, not a file; relaunch it every day with its date): `tail -n0 -F results/logs/<date>/play.log | grep -m1 -E "days-unreadable|duel [0-9]+: PAUSED|\[duels\].*(error|rejected)"`. Exits on the first match; when it fires, notify the coordinator with the raw JSON and launch it again. No HTTP codes in the pattern: it fired on ids (11412) and on the fast loop's ms («453 ms», «429 ms»); real failures already carry `error` (`error:rate_limited`).

## Final state (4 Oct, Bazaar closed)

- **Duelos II:** 68 duels, 51 deals out of 60 at 22:15, +905.7 P.
- **Duelos III (session 4):** 68 duels, 55 deals, ~+1300 P. 4 of the 13 without a deal were lost to cadence (~93 P; 11594 ~64 P): play looked at the duels every ~30 s. Fixes: `lastMoveTicks` 2 (5e7c9c1), `--duels-fast` (348be3c) and duel priority in the bucket (480bacf).
- **Gran Final (session 5):** 34 duels, 27 deals, +370.7 P (seller +248.0, buyer +122.7). There was a step in 25 of 26 ticks (2595 was skipped because the step of 2593 took 14.3 s) and 0 errors. Avoidable losses:
  - 15824 and 15838: seller with days; the final offered limit + 1 / day 0 instead of the limit on the rival's day. Fixed in 44137a1, with the test fixed in 04bf57c.
  - 15839: a race in the same tick, ~15 P.
- **Open:**
  - the your_limit-with-days question (see the prompt);
  - offer to write into the hub the decision on the ladder to silent ones, the day-stand and the fast loop (with permission).

## Key files

`src/duels/duels.ts` (`decideDuel`, `dayStand`, `dayHold`, `DEFAULT_DUEL_PARAMS`), `src/duels/agent.ts`, `src/duels/schemas.ts`, `src/duels/main.ts`, `src/duels/AGENTS.md`, `src/coordinator/coordinator.ts` (`arbitrate`, duels), `src/coordinator/routes.ts` (`DuelsRoute`, fast loop), `src/shared/client.ts` (`TokenBucket` with priority), `agents/tools/duels-sim.ts`, `test/duels-days.test.ts`, `test/duels-micro-step.test.ts`, `docs/bazaar/kit/RULES.md` (Duels, Negotiating 30) and the three PDFs in the root.

## Communication

- coordinator: restarts with commit, child and restart-check; results per duel, alarms and proposals with numbers. It asks it for health checks and proposal packages.
- audit: it notifies duels of doubtful duels (WAIT with a positive offer, large steps); duels answers with the real calculation.
- goals: strategy in one line and every change.
