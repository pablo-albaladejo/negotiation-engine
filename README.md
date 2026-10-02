# negotiation-ring

Agente del **Equipo 2** para **El Bazaar** (hackathon Causa Prima): cromos de Madrid, dealers, El Rastro y duelos entre equipos.

> **La cifra la decide siempre el código.** El texto es una plantilla con esa misma cifra; del rival solo se lee la estructura de sus ofertas.

## Empezar

```bash
pnpm i --frozen-lockfile
pnpm test
pnpm bazaar:status                                   # solo lectura
pnpm bazaar --serious --cash-floor 20 --dry-run --once   # plan de dealers, sin POST
```

Necesita `.env` con `BAZAAR_URL` y `BAZAAR_KEY` (ver `.env.example`).

## Más

- [`AGENTS.md`](AGENTS.md) — reglas, arquitectura y comandos.
- [`DAY1.md`](DAY1.md) — estado del torneo y prioridades.
- [`src/bazaar/AGENTS.md`](src/bazaar/AGENTS.md) — cada pieza del agente.
