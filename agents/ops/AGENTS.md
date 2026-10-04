# agents/ops — coordination, goals and viewer

Cross-cutting agents: they do not own a game route. Parent: [`agents/`](../AGENTS.md).

| Agent | What it owns |
|-------|--------------|
| [coordinator](coordinator.md) | The HOW: restarts, handoffs and approvals; the only one that restarts live processes |
| [goals](goals.md) | The WHAT: goals and the strategy registry (`bazaar:goals`) |
| [ui](ui.md) | The viewer (read-only) |
| [agents-keeper](agents-keeper.md) | This collection: cards, agent → session map and the `tools/` table |
