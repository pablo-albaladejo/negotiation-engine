# viewer/server/bazaar/market-test/ — Market Test (auto versus board)

- **`market-test.ts`** — `marketTestOf` builds `board.market_test`: our Market Test sessions (the synthetic book that every venue receives), in AUTO (v04) versus BOARD (v26, our broker matching live).
  - Official result per session: «bench.started» and «bench.finished» from the team stream (`results/bazaar-live/<date>/stream-team.jsonl`, only the lines with «bench.»): game hour, real start and end (`started_at` and `finished_at`, from the recorder's `recv`), efficiency versus the auto baseline, Δ, pairings and whether it is the «hard» version.
  - Tick-by-tick book: `results/bazaar-live/<date>/bench.jsonl` (quote and temper of each synthetic operator), over the window `start_tick`…+`ticks`. `dryRun` says whether the shadow or the live broker read it.
  - Our pairings: «match» lines of `<date>/broker.jsonl` (sent, rejected or dry-run), if it exists.
  - The book and the pairings are gathered from all date folders (ticks are global): a broker launched yesterday keeps writing to yesterday's folder. If the window has lines from the live broker (`dryRun` false), the shadow's are discarded.
  - Numbers from the shadow of the auto sessions: `results/bazaar-live/bench-sessions.json`.
  - «Now»: the last line of `results/logs/broker-live.log`.
  - `hindsight` per session: ours («sent» and non-dry-run pairings: pairs and quote surplus, the `surplus` field) versus the hindsight optimum, with the missed pairs (`missed`) and ours outside the optimum (`suboptimal`); provisional up to the last tick read while it runs, final when it ends. Only comparable in board (v26): in auto (v04) the book is recorded after auto already crossed, so it is marked «not comparable» and with no % captured. It is quote surplus (bid − ask), **not** the official efficiency: bench.jsonl carries no private limits.
  - The book and pairings are only sent for the last 8 sessions. Each file is re-read only if its size changes. Read-only: never a POST.
- **`optimum.ts`** — pure functions: `hindsightOptimum` (operators = distinct ids in the book up to a tick; an ask × bid pair is possible if at some tick both are present with bid ≥ ask; its weight is the best bid − ask over those ticks; maximum-weight matching with the Hungarian algorithm, each operator once: first more surplus, then more pairs and, on a tie, ours) and `maxWeightAssignment`. Test in [`viewer/test/`](../../../test/AGENTS.md).

## Links

- ↑ [`viewer/server/bazaar/`](../AGENTS.md)
- → Screen: [`viewer/src/screens/market-test/`](../../../src/screens/market-test/AGENTS.md)
