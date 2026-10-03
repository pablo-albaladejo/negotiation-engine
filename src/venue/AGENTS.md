# src/venue/ — Nuestro mercado

Plan para abrir nuestro venue. Entrada: `main.ts` (`pnpm bazaar:venue`).

## Archivos

- **`venue.ts`** — `planVenue` (nombre, `fee_bps` 0 y `fee_per_card` 0 porque las comisiones nunca puntúan y atraen flujo, mecanismo `auto` por defecto porque aún no hay broker; coste 250 + 20; comprueba nivel ≥ 2, caja ≥ 270, nombre ≤ 40 y que no tengamos ya uno).
- **`main.ts`** — `pnpm bazaar:venue --dry-run` solo lee; abrir exige quitar `--dry-run` **y** pasar `--confirm` (solo con aprobación del usuario); la broker key se guarda en el fichero .env.broker de la raíz (ignorado por git, permisos 600) y nunca se imprime.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`src/broker/`](../broker/AGENTS.md)
