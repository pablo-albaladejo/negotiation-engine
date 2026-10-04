# agents/analysis — analysis and audit agents

Read-only sessions: they measure, explain and warn; they execute nothing live. Parent: [`agents/`](../AGENTS.md).

| Agent | What it owns |
|--------|-----------|
| [audit](audit.md) | Per-tick auditor (`bazaar:audit --watch`), warnings to the owning session |
| [leaderboard-analyst](leaderboard-analyst.md) | Score trend and the duels' days guard |
| [market-analyst](market-analyst.md) | Market-making scoring and per-rival penalty in the markets route |
