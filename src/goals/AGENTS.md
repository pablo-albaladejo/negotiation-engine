# src/goals/ — Team goals and strategy registry (`pnpm bazaar:goals`)

The **what**: which goals the team pursues, with what weight and in what state each one is, and which strategy each session declares. The **how** (which route, which session, which restart) belongs to the coordinator, who reads both files. Phase 1: display only; no route reads them to decide.

## Files

- **`goals.ts`** — pure, no I/O. `refreshGoals` recomputes at every tick the measured fields of each goal (`now`, `day_start`, `delta_tick`, the `status` rules of `ruleStatus` and the list of linked strategies) and copies as-is those set by hand by the "goals" session (weight, priority, `target`, `why`, `do_not`, `guardrails`). `refreshGaps` adds the automatic gaps (goal with weight > 0 and priority ≤ `GAP_PRIORITY` without a live strategy) and keeps those written by hand. `isRoundReset` detects a new round because `deals` drops. `windowEndTick` computes `until_tick` for duels (next duels wave), market-test (end of the next bench session) and dealer-ladder (closing of the stalls) with `/api/clock` and `/api/schedule`: with the doors closed, the clock resumes at the next `day_opens` with that day's tick_seconds and earlier events are skipped.
- **`read.ts`** — `readGoalsState`: reads goals.json and strategies.json from `results/state/` for `GameState.goals` at every tick (`buildGameState`); a file that is missing or cannot be read stays null.
- **`main.ts`** — read-only CLI: one GET to `/api/me`, `/api/clock` and `/api/schedule` every `--interval` s (30), never a POST; `--once` refreshes once and exits. It writes atomically (.tmp and rename) in `results/state/` (outside git): goals.json, the `gaps` of strategies.json and goals-day-start.json (the snapshot of the first tick of the round: new round when `round` from `/api/clock` changes; if that fails, when `deals` drops).

## Rules

- **Proposals** (Pablo, 4 Oct): a strategy may carry `figures_for_humans`, `pros`, `cons`, `recommendation`, `ok_by` (coordinator for TRADER's, by Pablo's delegation; pablo for the rest) and `approved_at`. `figures_for_humans` is text for whoever decides: no code reads it and it is never a price.
- Outside `figures_for_humans`, neither goals.json nor strategies.json ever carry a price, a limit, an offer id or a concrete action: the figure comes from each route's code.
- strategies.json is written only by the "goals" session from what each session declares; `approved_by_pablo` is only true with a date and context.
- Lines that start with `auto: ` (in `changes` and `gaps`) are rewritten by the process; the rest belong to the "goals" session and are kept.

## Links

- ↑ [`src/`](../AGENTS.md)
