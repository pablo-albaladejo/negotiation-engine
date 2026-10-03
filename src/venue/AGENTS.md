# src/venue/ — Nuestro mercado

Plan para abrir nuestro venue. Entrada: `main.ts` (`pnpm bazaar:venue`).

## Archivos

- **`venue.ts`** — `planVenue` (nombre, `fee_bps` 0 y `fee_per_card` 0 porque las comisiones nunca puntúan y atraen flujo, mecanismo `auto` por defecto (`board` solo si lo decide `mechanism.ts`); coste 250 + 20; comprueba nivel ≥ 2, caja ≥ 270, nombre ≤ 40 y que no tengamos ya uno).
- **`mechanism.ts`** — puro: ¿auto o board? `decideMechanism` con umbrales con nombre (`DEFAULT_MECHANISM_THRESHOLDS`): `switch-to-board` solo con ≥ 2 sesiones del Market Test medidas en sombra (≥ 1 hard si ya pasó un bench hard), media shadow/auto ≥ 1,10, ninguna sesión por debajo de auto más de un 5 %, caja ≥ 250 + 20 + suelo, sin bench en curso, ≥ 20 ticks hasta el próximo bench (`noSwitchWithinTicks`; 10 para cerrar, abrir y arrancar el broker) y latido del broker sano (≤ 120 s). Si no, `stay-auto` o `insufficient-data` con el motivo; en board, `back-to-auto` si no hay broker vivo antes de un bench. Una sesión cuenta como medida si tiene `ratio`: por excedente o, con el `bench.finished` oficial (`official`), por pares (`ratioBasis`); el motivo lista cada sesión (`sessionNote`, p. ej. «board not better»). `ticksPerHourOf` usa 3600 / `tick_seconds` (el cociente acumulado tick / t_hours se sesga con la pausa). `formatMechanismLine` da la línea de `pnpm bazaar:play`. El excedente es por cotizaciones (proxy: los límites ocultos no se ven).
- **`route.ts`** — ruta `venue-mechanism` del coordinador: `proposeVenueMechanism` propone `venue:switch-to-board` (cerrar v04 + abrir board + broker en vivo) o `venue:back-to-auto`; nunca board a menos de N ticks de un bench. `venueSwitchGate`: en vivo solo con `--confirm` **y** `--allow-venue-switch`; aun así `executeVenueMechanism` solo imprime los pasos (`pnpm bazaar:venue --replace`).
- **`switch.ts`** — puro: `planVenueSwitch` decide si se puede cambiar el venue (cerrar el nuestro y abrir otro con el otro mecanismo): venue abierto, mecanismo distinto, caja ≥ 270 + suelo (la fianza vieja vuelve tras una espera) y ni bench en curso ni a menos de `noSwitchWithinTicks` de uno (`ticksToNextBench`). Descripción de board: «any copy» y 0 comisión.
- **`main.ts`** — `pnpm bazaar:venue --dry-run` solo lee; abrir exige quitar `--dry-run` **y** pasar `--confirm` (solo con aprobación del usuario); la broker key se guarda en el fichero .env.broker de la raíz (ignorado por git, permisos 600) y nunca se imprime. `--replace --mechanism board|auto` cambia el venue: con `--dry-run` imprime el plan y las comprobaciones; en vivo (solo con aprobación y `--confirm`) cierra, vuelve a leer `/api/me`, para si el venue sigue abierto y abre el nuevo; el broker lo reinicia la sesión coordinadora.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`src/broker/`](../broker/AGENTS.md)
