# src/coordinator/ — Coordinador

`pnpm bazaar:play`: cada tick construye el estado, mira agenda y disparadores, pide intenciones a cada ruta sin enviarlas y arbitra con el presupuesto de `clock.limits`. En vivo solo sin --dry-run y con --confirm.

## Archivos

- **`coordinator.ts`** — puro. `budgetFrom` lee el presupuesto de `clock.limits` (aceptaciones por tick, mensajes por conversación, hilos abiertos, altas por tick, ofertas abiertas); un límite ausente cuenta como 0 y se avisa. `ACCEPT_PRIORITY`: duelo (el valor decae cada ronda) > SAL-09 o compra que completa página > escalera del dealer > resto; a igual rango, más valor esperado. `arbitrate`: como mucho N aceptaciones entre todas las rutas, mensajes por conversación (ninguno donde sale una aceptación), hilos nuevos y altas dentro de los cupos, y **un activo en un solo sitio** también entre rutas en el mismo tick (`locks`). **ASSUMPTION** (`DUEL_ACCEPT_QUOTA_ASSUMPTION`, también en la salida): la aceptación de un duelo comparte el cupo del equipo.
- **`routes.ts`** — `DuelsRoute`, `DealersRoute` y `TradesRoute`: proponen sin enviar (método propose) y, en vivo, ejecutan solo lo seleccionado (método execute). Dealers: un `BazaarAgent` por dealer desbloqueado (como el modo serio: ficha obligatoria, perfil por dealer, safety 1,0, `TeamBudget`) con `gate`: primera pasada recoge y deniega, segunda abre la puerta solo a lo seleccionado. `FlagsRoute`: propone un flag por flagCandidate verificable no enviado aún; una frase de presión (`tactic`) solo si está aprobada (`FlagApproval`), si no se lista como candidata; no usa el cupo de aceptaciones. **Probes de eggs a caballo de una contraoferta** (`eggProbeFor`, `EGG_PARAMS`): `DealersRoute` pasa al agente la frase X y la plantilla añade «Do you know about X?» a una contraoferta que ya íbamos a mandar; nunca un mensaje ni un hilo aparte. Como mucho uno por conversación, nunca la misma X con la misma persona (`eggsTried` y `eggProbes`), nunca con avisos, strikes o cooloff, X sin dígitos (`isProbePhrase`). `EggsRoute` solo informa de qué probe iría con la próxima contraoferta.
- **`main.ts`** — `pnpm bazaar:play --dry-run --once`: imprime el `GameState` (con TIME, eggs, regalos y flags), los 5 próximos eventos de la agenda con cuenta atrás y acción prevista, los disparadores del tick, el recuento de pistas por persona con las 3 últimas candidatas, una línea por persona con estado y progreso de desbloqueo, el presupuesto, cada intención propuesta, qué sale y qué no (y por qué), una línea por conversación (tipo, contraparte, activo, fase, últimos precios, turno, última decisión, camino previsto) y el detalle de cada duelo. En vivo solo sin `--dry-run` **y** con `--confirm` (sin `--confirm` corre como dry-run); con reloj en pausa o puertas cerradas espera. Flags: `--max-spend-hour` (60), `--max-spend` (150), `--cash-floor` (20: el venue ya está pagado), `--page-targets` (SAL-09), `--leaderboard-every` (5), `--approve-flags` (ids de mensaje con frase de presión aprobados) y `--flag-pressure` (todas aprobadas).

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`state/`](../state/AGENTS.md)
- → [`agenda/`](../agenda/AGENTS.md)
- → [`packs/`](../packs/AGENTS.md)
- → [`markets/`](../markets/AGENTS.md)
