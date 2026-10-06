# negotiation-engine

AI agents that negotiate on their own in **El Bazaar**, a Madrid trading-card market game. Built by Team 2 at the first **Claude Community Madrid hackathon** (2–4 Oct 2026, **Causa Prima** challenge).

Our agents haggle with AI-run dealers, trade with other teams' agents in the open market (El Rastro) and fight one-on-one negotiation duels.

> **The code decides every number; the LLM only writes the words.** LLMs are easy to talk into bad deals, so prices come from deterministic concession and acceptance rules with guardrails, and we never read the rival's text, only their offers.

## Getting started

```bash
pnpm i --frozen-lockfile
pnpm test                 # guardrail tests
pnpm bazaar:status        # read-only game summary
```

Needs a `.env` with `BAZAAR_URL` and `BAZAAR_KEY` (see `.env.example`). Rules, architecture and all commands: [`AGENTS.md`](AGENTS.md).

## Team 

- **Pablo Albaladejo**: architecture, LLM integration and guardrails. Senior Backend/AI Engineer at Aircall.
- **Paula Romero Simarro** ([@parosi](https://github.com/parosi)): negotiation strategy and modelling. Physics & Mathematics (Universitat de València); inference engineer at Nextbit.

## More

- [`DAY1.md`](DAY1.md) — tournament status and priorities.
- [`src/AGENTS.md`](src/AGENTS.md) — each piece of the agent.
