# src/coordinator/ — Coordinador

`pnpm bazaar:play`: cada tick construye el estado, mira agenda y disparadores, pide intenciones a cada ruta sin enviarlas y arbitra con el presupuesto de `clock.limits`. En vivo solo sin --dry-run y con --confirm.

## Archivos

- **`coordinator.ts`** — `arbitrate`, `budgetFrom` y `ACCEPT_PRIORITY`: cupos, prioridades y un activo en un solo sitio.
- **`routes.ts`** — `DuelsRoute`, `DealersRoute`, `TradesRoute`, `FlagsRoute` y `EggsRoute`.
- **`main.ts`** — CLI de `pnpm bazaar:play`.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`state/`](../state/AGENTS.md)
- → [`agenda/`](../agenda/AGENTS.md)
- → [`packs/`](../packs/AGENTS.md)
- → [`markets/`](../markets/AGENTS.md)
