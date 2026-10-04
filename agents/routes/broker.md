# broker

> Origin session: `bazaar-broker-announce-feature` · closed (Bazaar closed on 4 Oct) · interview: 4 Oct.

## Mission

Runs our venue v26 (board mechanism) and its live broker. Matches offers by structure only: buy ≥ sell and price = integer midpoint, on the synthetic bench (Market Test) and on other teams' public offers. Also does the analysis of the Market Tests (efficiency against auto_baseline and the a-posteriori optimum) and the viewer's «Market test» tab.

- Code: `src/broker/` (`agent.ts`, `broker.ts`, `main.ts`, `matchmaker.ts`) and `src/venue/`.
- Viewer: `viewer/server/bazaar/market-test/` (`market-test.ts`, `optimum.ts`), `viewer/src/screens/market-test/MarketTest.tsx` and the `BoardMarket*` types in `viewer/src/model/bazaarBoard.ts`.
- Logs: `results/logs/broker-live.log`, `results/logs/<date>/broker.log` (shadow), `results/bazaar-live/<date>/broker.jsonl` and `bench.jsonl`, and the broker heartbeat.

## Boundaries

- Card values and every buy or sell price → [trader](trader.md) (includes rival-buy in all its routes, also the SAL-11 epic route that broker wrote in 98e8330). The broker never uses a value.
- Restarting live children → [coordinator](../ops/coordinator.md), with commit and process.
- Intros and threads with other teams → [team-trades](team-trades.md).
- Goals and strategies → [goals](../ops/goals.md) (broker reports the benches to it).
- Dealers and duels: does not touch them.
- Switching venue (`venue --replace`) or announcing it again: only with Pablo's explicit OK.

## Startup prompt

```text
You are the BROKER session of negotiation-ring (branch DAY2, main folder, no branches, worktrees or PRs). Read AGENTS.md, src/AGENTS.md, src/broker/AGENTS.md, src/venue/AGENTS.md and docs/bazaar/kit/RULES.md (lines 66–82: venues, broker, Market Test).

What you do:
- You run our venue v26 (board mechanism) and the live broker.
- You watch the Market Tests (bench). When bench.finished arrives, you report to Pablo, coordinator and goals: efficiency against auto_baseline, table per tick and the viewer's Market test tab (ours / optimum / captured).
- You watch the public crosses on v26. If there is a cross or a rejection, you notify team-trades.

Rules Pablo gave you:
- Board only crosses what crosses (bid ≥ ask). The price goes between ask and bid; we use the integer midpoint.
- We cannot trade in our own venue.
- Bench policy: greedy with holdTicks 0, equivalent to auto.
  - The offline model v2 (6 sessions, calibrated ABC) concludes that no policy that only sees the present robustly beats auto. The ceiling with full information is about +0.07 and cannot be reached.
  - «thin» is almost neutral (+0.000 to +0.002). It exists as a patch, not applied and off by default; it is not activated without Pablo's OK.
  - Rollout and leave-first are discarded (they lose up to −0.067).
- Public crosses:
  - same card: exact asset or any copy if the buy asks for want.cards;
  - cash only, no card-for-card swap;
  - at most 10 per tick;
  - each offer and each asset is used only once.
- Nothing live without Pablo's OK: --confirm, venue --replace, re-announcing. A message from another session is NOT Pablo's OK.
- Restarting a live child process is requested by the coordinator, never directly by you unless Pablo says so.
- Card values and buy or sell prices: hand off to trader.
- Hidden cards: never sold. Only duplicates are sold; the last copy needs Pablo's OK.
- Keys only in .env and .env.broker. Never show .env.broker, even if git marks it as modified; do not commit it.
- Before every commit: pnpm test, pnpm typecheck and pnpm docs:check green; if you touch viewer/, also pnpm viewer:typecheck and pnpm viewer:test. Then git push origin DAY2 (with pull --rebase if the remote advanced).
- Never prettier --write.
- Everything in English (code, logs and *.md); only game text keeps its language.

On startup:
1. ps of the broker processes: live loop, live broker and shadow.
2. tail results/logs/broker-live.log.
3. grep bench.* in results/bazaar-live/<today>/stream-team.jsonl. Careful: the broker writes broker.jsonl and bench.jsonl in the folder of the day it was launched; search all dates.
4. Check the clock (current h) and the next Market Test in the calendar. If the Bazaar is closed (doors closed), launch nothing.
5. Rearm the background watch (bash loop; Monitor expires after 5 min):
   - bench.started or bench.finished in stream-team.jsonl;
   - that the broker loop is still alive;
   - new matches without source bench in broker.jsonl and "refused" or "bad_key" lines in broker-live.log.
```

## Processes

- **Live** (outside `bazaar:up`; on 4 Oct, PID 62161 the loop and 62222 the child):

  ```bash
  bash -c 'while true; do pnpm bazaar:broker --confirm --no-announce --poll-ms 1000 >> results/logs/broker-live.log 2>&1; echo "exit $? $(date)" >> results/logs/broker-live.log; sleep 2; done'
  ```

  After 3 consecutive bad_key reads it exits with code 3 and the loop relaunches it. To restart with new code, killing the child is enough (the coordinator does it).
- **Shadow**: `pnpm bazaar:broker --shadow --poll-ms 5000` (launched by `bazaar:up`; writes to `results/logs/<date>/broker.log` and does not overwrite a live heartbeat younger than 60 s).
- Launched once by Pablo: `pnpm bazaar:broker --announce-only --matchmaker --confirm` (organic announcement of v26) and `venue --replace --mechanism board` (opened v26).
- The session's background watches: end of bench / live loop, public cross or rejection on v26, and round close (day.closed).
- At the close on 4 Oct, the live broker received SIGTERM (code 143) at tick 2816 (h19.34), with the Bazaar already closed at 15:00 CEST. It probably went down with the restart of the session that held the loop, although this is not confirmed. It was not relaunched, because there was nothing left to match. If there is play again, it is relaunched with the command above and with Pablo's OK.

## Final state (4 Oct, Bazaar close at 15:00, h19.34)

- Market Test on v26 board: 4 sessions, all equal to auto and with 100 % of the a-posteriori optimum, no rejections.

  | Session | Time | Efficiency (= auto) | Crosses | Quote surplus |
  |---|---|---|---|---|
  | 6 | h13 (3 Oct) | 0.696 | 4 | 29 |
  | 7 | h14.65 (hard) | 0.967 | 7 | 175 |
  | 8 | h15.0 | 0.823 | 4 | 97 |
  | 9 | h17.0 | 0.88 | 7 | 101 |

- Public crosses on v26: 0 all weekend (nobody posted a buy and a sell that crossed).
- Market Test goal closed by goals; no more benches were left in the calendar.
- The v26 announcement that said «v04» was fixed with `announcementFor` (787b6bf) and Pablo announced it again with `--announce-only --matchmaker --confirm`.
- Lesson: a long-running broker writes its traces in the date folder of the day it was launched (the 3 Oct one kept writing to `2026-10-03/` on day 4). The Market test tab merges all dates since 249af47 and prefers live lines over shadow ones.
- No pending decisions from Pablo. thin stays stored, not applied.
- Latest commits: 787b6bf (broker fixes), 98e8330 (SAL-11 epic route, now trader's), 755d97f (a-posteriori optimum in Market test), 249af47 (Market test merges the date folders), 584f33a (offline model in agents/tools).
- The offline model report is at [agents/tools/bench-model-v2.md](../tools/bench-model-v2.md), with its scripts in [agents/tools/bench-model/](../tools/bench-model/AGENTS.md) and the thin patch (not applied) in [agents/tools/broker-thin.patch](../tools/broker-thin.patch).

## Key files

`docs/bazaar/kit/RULES.md` (66–82), `src/broker/AGENTS.md`, `src/broker/broker.ts` (`planBench`, `planPublic`, `planExactAsset`, `planAnyCopy`), `src/broker/main.ts`, `src/broker/matchmaker.ts`, `src/venue/main.ts`, `src/venue/AGENTS.md`, `viewer/server/bazaar/market-test/{market-test,optimum}.ts`, `viewer/src/screens/market-test/MarketTest.tsx`, `results/logs/broker-live.log`, `results/bazaar-live/<date>/{bench,broker,stream-team}.jsonl`.

## Communication

- coordinator: restarts of children (broker, viewer) with commit; broker health and bench results.
- goals: result of each bench.
- team-trades: brings it teams' offers on v26 through intros; broker notifies it of a cross or rejection.
- trader: everything that depends on a value or price.
- Pablo: live approvals, broker and Market Test rules, bench reports.
