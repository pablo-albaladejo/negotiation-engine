# agents/tools — session tools to keep

Scripts and notes that each agent used from its scratchpad (which is lost when the session closes). Here they are versioned so the agent can be relaunched as it was. Parent: [`agents/`](../AGENTS.md).

Rules: read-only (GET) unless the agent's sheet says otherwise; keys are read from `.env` and never written here; code comments in English. Each agent adds its file; the table below is maintained by the session that runs `agents/`.

| File | Agent | What it is |
|------|-------|------------|
| [duels-table.mjs](duels-table.mjs) | [duels](../routes/duels.md) | Live table (GET only) of a duel session: deal, result and Δduel_points per duel every 15 s (`node agents/tools/duels-table.mjs 4`) |
| [duels-sim.ts](duels-sim.ts) | [duels](../routes/duels.md) | Duel latency simulation without the API: fake server with real ticks, 4 concurrent duels whose rivals repeat real offers, play's `--duels-fast` sub-loop and a load that mimics the rest of play in the same bucket; it measures how long we take to see and answer each of the rival's offers (`pnpm exec tsx agents/tools/duels-sim.ts --tick-seconds 15 --waves 2 --load 50`; output in `results/duels/sim-*.json`) |
| [audit-tick-eval.py](audit-tick-eval.py) | [audit](../analysis/audit.md) | One line per `play.log` tick with the Δs (score, ladder, neg, duels, cash) and the FLAGs |
| [audit-alerts.sh](audit-alerts.sh) | [audit](../analysis/audit.md) | Alerts: play outages, bank/Pícaros, score-audit mismatches, bench, our venue and our deals |
| [objetivos-design.md](objetivos-design.md) | [market-analyst](../analysis/market-analyst.md) → [goals](../ops/goals.md) | Starting design of the team goals |
| [workshop-opps.mjs](workshop-opps.mjs) | [workshop](../routes/workshop.md) | Read-only (GET) check of trios for El Taller and Pilar L3 candidates, with no copies in offers or threads and no hidden cards; launched with `.env` loaded (see the sheet) |
| [bench-model-v2.md](bench-model-v2.md) | [broker](../routes/broker.md) | Report of the Market Test offline model: no policy that only sees the present beats auto robustly; live, greedy with no waiting |
| [broker-thin.patch](broker-thin.patch) | [broker](../routes/broker.md) | Patch of the «thin» policy for the broker (almost neutral, from +0.000 to +0.002); only stored, not applied without Pablo's OK |
| [bench-model/](bench-model/AGENTS.md) | [broker](../routes/broker.md) | Scripts and priors to reproduce the model (ABC calibration, replays, synthetic evaluation) |

## Links

- [bench-model/](bench-model/AGENTS.md) — offline Market Test model (broker)
