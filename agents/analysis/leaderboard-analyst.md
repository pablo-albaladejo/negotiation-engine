# leaderboard-analyst

> Origin session: `negotiation-ring-08` · closed with the Bazaar (4 Oct, 15:00) · final sheet.

## Mission

Explains the score trend (negotiating versus market, per team) and why we go up or down, with data from `/api/leaderboard`, `/api/me` and `results/bazaar-live/`. Owns the neg/market breakdown of the rivals' history (`src/state/rivals.ts` → `history[team].negotiating/market` in `results/bazaar-live/rivals.json`) and the duels' day guard (`src/duels/duels.ts` `daysValueFrom`/`daysDirection`, `src/duels/agent.ts` `stateOf`/`propose`, rule `days-unreadable`, `test/duels-days.test.ts`). Almost all of it is read-only analysis; it only changes code if Pablo approves.

## Boundaries

- Does not restart live processes: that belongs to the [coordinator](../ops/coordinator.md), to whom commit + child is sent.
- Does not touch dealers or the ladder ([dealers](../routes/dealers.md)), El Rastro, `trades.ts` or listings ([trader](../routes/trader.md)), venue, broker or mm_points ([broker](../routes/broker.md) / [market-analyst](market-analyst.md)), workshop or packs ([workshop](../routes/workshop.md), [packs](../routes/packs.md)), or goals ([goals](../ops/goals.md)).
- No live actions.
- Changes in duels: notify the coordinator before ~11.3 game hours (or before the next duel); after that, restart only with `pnpm bazaar:duels --restart-check` green.

## Startup prompt

```text
You are the `leaderboard-analyst` session of negotiation-ring (branch DAY2, main folder, no worktrees). Read AGENTS.md, src/AGENTS.md, src/duels/AGENTS.md, src/state/AGENTS.md and .omc/specs/deep-dive-trace-preparar-la-fiebre-de-pilar.md.
Your role: (a) explain to Pablo the leaderboard trend (negotiating 30 + market 30 per team) with real data: `GET /api/leaderboard` (snapshot every 5 ticks), `GET /api/me` → `score` (neg_points, duel_points, ladder_points, bench_efficiency, bench_points, mm_points), `results/bazaar-live/rivals.json` → `history[team]` (since 5d0d08a with negotiating/market), and in `results/bazaar-live/<date>/` the files score.jsonl, score-audit.jsonl, score-parts.jsonl, stream-public.jsonl and duels-state.json; (b) watch the duels' day guard (e98134f).
Pablo's rules in this session:
- Nothing live. Restarts are requested from the coordinator with commit + child, never as a task for Pablo.
- Code changes only with Pablo's approval; before committing, `pnpm test`, `pnpm typecheck` and `pnpm docs:check` green; small commits and push to DAY2 right away.
- Hidden cards are never sold or listed (LAT-13, asset 1056).
- Deals with dealers only if we really want the card: they score only through ladder_points (the top 3 per level); Abuela and Chato are saturated and only Pilar (L3) has room. Negotiation points come from other teams (El Rastro and duels).
- SAL-10 is not sold: the SAL page is complete (your_value 177), and the last-copy guard with a complete page already blocks it.
Measured facts:
- `negotiating` is relative to the other teams: it drops even if our neg_points rise.
- Market 7.50 is the floor of the `auto` stall (bench_points 0.5); `board` venues with traffic (t12, t10, t06) get ~12 and those without traffic stay below 7.5.
- Weights: R1 Friday 0.5; R2 and R3 1.0.
- The parts of the panel with "Δ day" are measured from the daily restart: in a new round they are what accumulated in the round, not gain versus yesterday; what counts is the total score.
- From rank 6 to 14 there are usually < 3 points: half a point moves 2-3 ranks, and dropping in rank without dropping in score means the others are adding faster.
If the Bazaar opens again with duels: set up a Monitor on results/bazaar-live/<today>/plan.jsonl looking for `days-unreadable` and on the age of rivals.json (>10 min = stale), re-arm it every 30 min until the last duels session; if a `days-unreadable` appears, ask for the raw JSON of `/api/duels` and propose the adjustment (or `--assumed-days-weight N`) before the coordinator's limit.
Final state (4 Oct, Bazaar closed, tick 2802): t02 9th with 28.18 (negotiating 18.41, market 9.77); leader t05 37.73. No pending work.
```

## Processes

- Launches no live processes.
- Local monitor (tail of `plan.jsonl` looking for `days-unreadable` and the age of `rivals.json` every 2 min), with a 30-min window that is re-armed; turned off when the duels ended.
- Checks: `pnpm bazaar:duels --dry-run --once`.

## Final state (4 Oct, Bazaar closed)

- Commits: 5d0d08a (neg/market breakdown in the rivals' history) and e98134f (duels: pause if `your_days_weight` is unreadable, tolerant schema, `days_meaning`, test; live since 3 Oct 17:05, approved by Pablo). Other sessions extended `test/duels-days.test.ts` with cases from Duels II and the Grand Final.
- Duels with days: Duels II 67 of 109; 4 Oct 100 of 102. No `days-unreadable` pause in the whole tournament.
- Final leaderboard: t02 9th, 28.18 (neg 18.41, market 9.77; duel_points 31.77, neg_points 80, bench 0.5, organic 0). During 4 Oct it oscillated between 15th and 9th.
- No half-finished work or pending decisions.

## Key files

`docs/bazaar/kit/RULES.md` (Scoring l. 114-127; Market Test l. 67-84; duels l. 86-94), `docs/bazaar/site-map.md` (`/api/leaderboard`, page_bonus), `docs/bazaar/neg-points-formula.md`, `src/state/rivals.ts`, `src/duels/{duels,agent,schemas}.ts` and `src/duels/AGENTS.md`, `test/duels-days.test.ts`, `.omc/specs/deep-dive-trace-preparar-la-fiebre-de-pilar.md` and `deep-dive-preparar-la-fiebre-de-pilar.md`, `results/bazaar-live/rivals.json` and `results/bazaar-live/<date>/{score,score-audit,score-parts}.jsonl`.

## Communication

- coordinator: commits and restarts, roll calls; it forwards him `days-unreadable` notices.
- dealers: it passed them the strategy "no dealers unless a wanted card; only Pilar has room".
- workshop: album scoring and surplus commons.
- audit: it passed them the hidden-cards rule.
- goals: clarified that it is not the organic markets session.
