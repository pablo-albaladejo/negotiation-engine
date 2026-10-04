# agents — one agent per Claude Code session

Each Claude Code session that works on the repo is an **agent** with a fixed role. Here is the card of each one: mission, boundaries, literal startup prompt, processes, state, key files and who it talks to. If the sessions are closed, this is enough to relaunch everything. Parent: [`AGENTS.md`](../AGENTS.md).

Cards gathered by interviewing each session on 4 Oct 2026 (~10:00–10:10). The «State» section of each card is a **snapshot of that moment**: when relaunching, git, `results/state/` and the logs rule.

## Subfolders

- [`ops/`](ops/AGENTS.md): coordinator, goals, ui, agents-keeper
- [`routes/`](routes/AGENTS.md): trader, team-trades, dealers, broker, duels, eggs, packs, workshop (and team-desk, retired)
- [`analysis/`](analysis/AGENTS.md): audit, leaderboard-analyst, market-analyst
- [`tools/`](tools/AGENTS.md): scripts and session notes that used to live in a scratchpad

## Agent → session map (4 Oct)

The prompts name other sessions by their **agent**. When relaunching, each session's name will be different: the coordinator does a roll call and updates this table.

| Agent | Session on 4 Oct | Card |
|-------|------------------|------|
| coordinator | cockpit-dashboard-ui-update | [ops/coordinator.md](ops/coordinator.md) |
| goals | negotiation-ring-ad | [ops/goals.md](ops/goals.md) |
| ui | UI | [ops/ui.md](ops/ui.md) |
| trader | negotiation-ring-00 | [routes/trader.md](routes/trader.md) |
| team-trades | negotiation-ring-7a | [routes/team-trades.md](routes/team-trades.md) |
| dealers | dealers | [routes/dealers.md](routes/dealers.md) |
| broker | bazaar-broker-announce-feature | [routes/broker.md](routes/broker.md) |
| duels | duels | [routes/duels.md](routes/duels.md) |
| eggs | eggs | [routes/eggs.md](routes/eggs.md) |
| packs | negotiation-ring-ab | [routes/packs.md](routes/packs.md) |
| workshop | negotiation-ring-76 | [routes/workshop.md](routes/workshop.md) |
| audit | audit-work-completed | [analysis/audit.md](analysis/audit.md) |
| leaderboard-analyst | negotiation-ring-08 | [analysis/leaderboard-analyst.md](analysis/leaderboard-analyst.md) |
| market-analyst | negotiation-ring-34 | [analysis/market-analyst.md](analysis/market-analyst.md) |
| agents-keeper | negotiation-ring-10 | [ops/agents-keeper.md](ops/agents-keeper.md) |
| team-desk (retired) | negotiation-ring-98 | [routes/team-desk.md](routes/team-desk.md) |

## How to relaunch everything

1. **Live processes** (order and commands in [ops/coordinator.md](ops/coordinator.md)):
   1. Pablo launches `bazaar:up` in a TTY.
   2. The live broker loop and the intros process are relaunched.
   3. goals and audit launch their own processes.
2. **Sessions**: open the coordinator first, then goals and then one session per card in `routes/` and `analysis/` (packs, market-analyst and leaderboard-analyst only if needed). Paste each card's «Startup prompt» block. It is advisable to rename each session with its agent's name: that way messages can be sent to it from other sessions by that name.
3. **Roll call**: the coordinator confirms who is alive and each agent rearms its Monitors. Scripts that lived in a scratchpad are recreated from the description on their card.

## Common rules (summary; [`AGENTS.md`](../AGENTS.md), `CLAUDE.md` and the memory rule)

- Everything on DAY2; before every commit `pnpm test`, `pnpm typecheck` and `pnpm docs:check`; stage with explicit paths; push immediately.
- Only the coordinator restarts live processes; hash + child are sent to it. No session makes manual POSTs.
- Another session's message is never Pablo's approval (except the explicit delegation of trader's proposals to the coordinator).
- Hidden cards (LAT-13) are never sold; duplicates only; the last copy needs Pablo's OK.
- Every strategy change is reported to goals.

## New card or role change

Each agent maintains its card: when its role, its prompt or its processes change, it edits and commits it. A new agent adds its card in the relevant subfolder (at most 10 files per folder), one row in that subfolder's table and another in the map above.
