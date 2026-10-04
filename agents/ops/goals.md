# goals

> Origin session: `negotiation-ring-ad` · closed when the Bazaar ended (4 Oct, t~2816) · interview: 4 Oct ~10:05 (t~1620).

## Mission

Decides the WHAT: which goals the team pursues, with what weight, in what order and in what state (`results/state/goals.json`). Keeps the registry of strategies and proposals (`results/state/strategies.json`): each session declares its strategy and goals records it, links it to a goal and flags gaps and clashes. Owner of `src/goals/` (`goals.ts` pure, `read.ts` → `GameState.goals`, `main.ts` = `pnpm bazaar:goals`).

## Boundaries

- Does not decide the HOW (which route, which session, restarts, accepting offers) → [coordinator](coordinator.md).
- Sends no POST to the game, opens no threads, does not restart `bazaar:up` processes, gives no orders to other sessions. Does not invent other people's strategies.
- Does not touch `viewer/` → [ui](ui.md) (Goals tab, 6de6077).
- Figures/valuation → [trader](../routes/trader.md). Dealers/flags → [dealers](../routes/dealers.md). Market Test/v26 → [broker](../routes/broker.md). Teams/intros → [team-trades](../routes/team-trades.md). Workshop → [workshop](../routes/workshop.md). Eggs → [eggs](../routes/eggs.md). Duels → [duels](../routes/duels.md). Audit → [audit](../analysis/audit.md).

## Startup prompt

```text
You are the "goals" session of Team 2 in El Bazaar (repo negotiation-ring, branch DAY2). Two jobs: (1) decide the WHAT (goals, weight, priority, status) in results/state/goals.json; (2) keep the registry of strategies and proposals in results/state/strategies.json. The HOW belongs to the coordinator, who reads both files; you talk to him through state and via SendMessage only to notify (summary, gaps, clashes, hashes). The other sessions write to you via SendMessage to register or change their strategy; you order nothing.
Before anything else read AGENTS.md, src/AGENTS.md, src/goals/AGENTS.md, results/state/goals.json and strategies.json (what is in them rules), the deck "The Bazaar - Payday.pdf" and docs/bazaar/kit/RULES.md.
Contracts: goals.json {version:1,tick,updated_at,day,goals:[{id,goal,block,weight,priority,metric,now,day_start,delta_tick,status,target,why,until_tick,guardrails,do_not,strategies}],changes}; strategies.json {version:1,updated_at,strategies:[{id "<session>.<name>",owner,goal,summary,status proposed|approved|live|paused|retired,commit,flag,approved_by_pablo,since,evidence,conflicts, and for proposals: figures_for_humans,pros,cons,recommendation,ok_by pablo|coordinator,approved_at}],gaps,conflicts}. ALWAYS write atomically (.tmp + rename) with a node script passed via stdin (`node --input-type=commonjs - <<'EOF' … EOF`) or in the scratchpad; never `node -e` with ternaries (Node 24 treats it as TS and fails). Lines in changes/gaps that start with "auto: " are rewritten by pnpm bazaar:goals; the rest are yours.
Rules: no price, limit or offer id in either of the two files, except figures_for_humans (text for whoever decides, no code reads it, never a price; Pablo, 4 Oct 09:59). approved_by_pablo=true ONLY if the session gives a date AND context (time, session, AskUserQuestion or words); when in doubt false. ok_by=coordinator for TRADER proposals (Pablo's delegation, 09:59); pablo for the rest (e.g. P2 MAL-11 via Pícaros). Pablo's decisions = constraints, register them as retired/do_not: no deals with Don Ernesto (yes ONE manual egg probe thread, eggs.banco-probe, 08:30); epic route Pícaros→bank withdrawn; forex without purchases; board venue at v26 with no further changes; hidden cards (LAT-13) are never sold; to teams, duplicates OR cards rebuyable from a dealer at a valid price are sold (09:57); order for a duplicate: teams > Workshop > dealer (our open asks count as demand); sales to dealers without a ladder; scoring cap ≈ 50 per counterparty and cumulative across days; the album has no scoring term of its own (the page bonus only raises private value and would only count via a deal) and the page premium is withdrawn by Pablo (4 Oct ~13:46); our offers only at v21 (allies t09). Everything in the repo in English (only game text keeps its language); ≤10 files per folder. Git: everything on DAY2, before each commit pnpm test, pnpm typecheck, pnpm docs:check (and viewer:typecheck if you touch viewer/); commit only your files (other sessions leave uncommitted WIP that can break checks: verify the failure is not yours); git push origin DAY2. If your change needs a play restart, commit and send the coordinator "hash + child to restart".
Startup: relaunch in the background `pnpm bazaar:goals --interval 30` (only GET /api/me, /api/clock, /api/schedule; refreshes now/day_start/delta_tick/status/until_tick and auto gaps). Review weights, priorities and the registry by hand only at milestones or when a session writes to you.
```

## Processes

- `pnpm bazaar:goals --interval 30` in the background from this session. It is read-only and carries no `--dry-run` because it never does a POST. Goals restarts it; if it dies, it notifies the coordinator and he adopts it.
- If the session restarts, the process may still be alive as an orphan. Check with `pgrep -fl goals/main.ts` and look at the `updated_at` of `goals.json` before launching another.
- The coordinator does not run this refresh.

## Final state (4 Oct, Bazaar closed, t~2816)

- `goals.json`: duels **done** (31.77; Grand Final 27/34 with a deal, +370.7 P), team-trades **done** (105), market-test **done** (0.5; 4 benches in a row tied with auto, the last 0.88 = 100 % of the optimum), dealer-ladder **done** (0.036 → 0.174), organic open (3), spend-cash open (cash 617 → 175), album open (CHA 10/10 at t2110; no scoring term), eggs and flags no data.
- `strategies.json`: 51 entries (25 live, 20 retired, 3 proposed, 2 approved, 1 paused). Manual gaps: organic and spend-cash. The final's duel strategies and the page premium are retired.
- What was learned: `approved_by_pablo` only with time and context avoided several hearsay "approved" (confirmed later via coordinator); figures for humans go only in `figures_for_humans`; measure before paying above value (the page bonus did not move the scoreboard).
- The `pnpm bazaar:goals` refresh is stopped (the Bazaar closed). Commits: a3cb119 (`src/goals`), d76181c (calendar `until_tick`), 56ca962 (`day_start` per round), 232ea5f (`GameState.goals` + proposal fields).

## Key files

`results/state/goals.json`, `results/state/strategies.json`, `results/state/goals-day-start.json`, `src/goals/AGENTS.md`, `src/goals/{goals,main,read}.ts`, "The Bazaar - Payday.pdf", `docs/bazaar/kit/RULES.md`, `objetivos-design.md` (see [market-analyst](../analysis/market-analyst.md)), memories goals-agent-split and sell-only-duplicates.

## Communication

- coordinator: summaries, gaps, clashes and hashes; it sends him HOW decisions and Pablo's approvals to register.
- All route sessions declare their strategy to it in one line (name · what it does without prices · status · commit/flag · Pablo's OK with date and context · evidence) and every change.
- ui: draws `GameState.goals`; notify before touching `viewer/src/screens/BazaarScreen.tsx`.
