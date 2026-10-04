# negotiation-ring

**Team 2** agent for **El Bazaar** (Causa Prima hackathon): Madrid trading cards, dealers, El Rastro and duels between teams.

> **The code always decides the figure.** The text is a template carrying that same figure; from the rival we read only the structure of their offers.

## Getting started

```bash
pnpm i --frozen-lockfile
pnpm test
pnpm bazaar:status                                   # read-only
pnpm bazaar --serious --cash-floor 20 --dry-run --once   # dealer plan, no POST
```

Needs `.env` with `BAZAAR_URL` and `BAZAAR_KEY` (see `.env.example`).

## More

- [`AGENTS.md`](AGENTS.md) — rules, architecture and commands.
- [`DAY1.md`](DAY1.md) — tournament status and priorities.
- [`src/AGENTS.md`](src/AGENTS.md) — each piece of the agent.
