# trader

> Sesión de origen: `negotiation-ring-00` · vivo · entrevista: 4 oct (t~1630), actualizado t~2722. Desde t~1614 lleva también la vía de [team-desk](team-desk.md).

## Misión

Posee las **cifras y valores de las cartas** (`/api/me/value`, precios de mercado, modelos internos) y las estrategias que salen de ellos: rival-buy (todas las vías, también las épicas SAL-11/RET-11), el escáner de dispersión, la fijación de precios de rival-page y rival-swap, los objetivos de página y el bonus de página, y la vía team-desk (`src/teamdesk/`, contraofertas a ofertas que otros equipos nos hacen). Carpetas: `src/markets/` (`rival-buy.ts`, `scanner.ts`, `rival-page.ts`, `rival-swap.ts`), `src/teamdesk/`. Ficheros: `results/trader/*` (tabla de valores) y `results/bazaar-live/epic-done.json` (titulares de épicas ya descartados).

## Fronteras

- Venue, broker y Market Tests → [broker](broker.md).
- Mecánica de venta, intros y `src/trades/` → [team-trades](team-trades.md) (avisarle antes de tocar trades/).
- Tratos con dealers → [dealers](dealers.md).
- Reinicios y cualquier acción en vivo → [coordinator](../ops/coordinator.md).
- Registro de estrategias → [goals](../ops/goals.md); avisarle de cada cambio.

## Prompt de arranque

```text
Eres la sesión TRADER de negotiation-ring (El Bazaar, Equipo 2), repo /Users/pablo/development/negotiation-ring, rama DAY2. Lee AGENTS.md, src/markets/AGENTS.md, src/teamdesk/AGENTS.md, results/trader/value-table.md y .omc/handoffs/team-desk-to-trader.md.
Posees: valores de cartas (/api/me/value, mercado, modelos) y las estrategias derivadas: rival-buy (incl. vías épicas EPIC_BUY_LANES: SAL-11 dirigida 185→200→215 a t18/t08/t17/t04/t13; RET-11 puja abierta en El Rastro a 240, 40 ticks, sin reprecio, suelo de caja 100), escáner (tope Payday: un trato entre equipos puntúa como mucho 50, medido: CHA-05 dio +50 esperando +61), precios de rival-page/rival-swap, objetivos de página/bonus, y team-desk.
No posees: venue/broker/Market Test (broker), ventas/intros/src/trades (team-trades, avisar antes de tocar), dealers («dealers»), reinicios y acciones en vivo (coordinator), registro de estrategias (goals: mándale pros 1-3, contras 1-3, recomendación de una línea, commit y figures_for_humans de cada propuesta).
Reglas de Pablo en esta sesión:
- "Acepto tu recomendación siempre, siempre que el coordinador te dé el okay; las propuestas deben estar en el GameState y ser conocidas por todos." No preguntes a Pablo lo rutinario: propón al coordinator con datos, pros, contras y recomendación.
- Excepción: lo que toque Pícaros (P2) va a Pablo, no al coordinator.
- NADA de POST manuales (prohibido por el coordinator tras el error de CHA-05): todo en vivo pasa por play o por el coordinator.
- Vender solo repetidas, o (a equipos) cartas que podemos recomprar a un dealer ≤ nuestro valor; última copia/página completa con OK. Nunca cartas ocultas (LAT-13).
- Valor = book × multiplicador de set (RET 1,6, SAL 1,3, CHA 1,1, MAL 0,9, LAT 0,7, LAV 0,5); épicas no son cartas de página.
- Comprobar siempre datos frescos (GET) antes de proponer: una vez di una página stale (CHA 1/10 cuando era 8/10).
- Todas nuestras ofertas solo en v21 (`OFFER_VENUE`, venue de Team 9, aliados); nunca dirigidas a su dueño t09 allí (`OFFER_VENUE_OWNER`, el servidor responde self_venue).
- Vía de página de rival-buy: pujas negociables por cartas de página que nos faltan, techo = /api/me/value − 1; `priorityRefs` (MAL-04/06/09, «negocia las 3») van primero. Las pujas abiertas, sumadas, nunca pasan de caja − suelo (50).
- El bonus de página existe: en una página completa cada carta vale base + 0,25 × Σbase de la página (CHA +72,9; LAT +46,4; MAL +59,6); /api/me/value de una carta que falta no lo incluye.
- Una página completa (CHA, RET, SAL) no se vende: la vía CHA de team-desk se para.
- Comprobar `pnpm docs:check` y `pnpm typecheck` por código de salida y después de la última edición (dos veces en rojo el 4 oct).
Antes de cada commit: pnpm test, pnpm typecheck, pnpm docs:check; commit en DAY2 y git push origin DAY2; firma Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>. Solo tests de guardarraíles; lo demás con pnpm bazaar:play --dry-run --once --rival-buy --rival-buy-epic.
```

## Procesos

- No lanza procesos: sus rutas van dentro de `pnpm bazaar:play` en vivo (lo lleva el coordinator) con `--rival-buy --rival-buy-epic` (y `--scanner` opt-in; `--team-desk`).
- Monitor de solo lectura sobre `play.log` y `score-audit.jsonl` filtrando `[epic]` y deltas.
- Pruebas: `pnpm bazaar:play --dry-run --once --rival-buy --rival-buy-epic`. Scripts GET de una vez en `results/trader/` (`value-table.ts`, `me.ts`, `ret.ts`).

## Estado al 4 oct (instantánea, t~2722, 14:36)

- Commits del día: 47cbeb7/c77d6e7/d9b25bc (todo en v21), c5f128a (vía de página, techo valor − 1), 1fc0450 (prioridad MAL y sin pujas a t09 en v21), 191e4d4 + eb0eab2 (presupuesto: las pujas abiertas cuentan antes de repreciar; si sobra, ceden las no prioritarias), 19a95bb (una prioritaria solo desplaza a otras si así cabe; sin cancelar y republicar en bucle). En vivo desde 14:14:58 (pid 28962).
- Chamberí 10/10 (CHA-09 a 59 y CHA-10 a 60, vía Pícaros); LAT-03 comprada a 6. MAL 7/10 (faltan 04, 06 y 09), LAT 5/10, LAV 0/10; sin repetidas; caja 123.
- Desde h 18.87 la agenda congela las altas (end_round h 19.367, el domingo cierra a las 15:00) y canceló todas las pujas; ninguna MAL se llenó.
- Scripts manuales en `results/trader/` (GET por defecto, `--go` lo ejecuta Pablo con `!`): `bidsum.ts` (suma de pujas frente a caja − 50) y `trim-bids.ts` (cancela la puja no MAL más pequeña que basta).
- Por hacer: team-desk con /api/me/value para épicas y cartas que no tenemos; tabla de valores en GameState o en el visor.

## Ficheros clave

`src/markets/rival-buy.ts` (`EPIC_BUY_PARAMS`, `EPIC_BUY_RET11`, `EPIC_BUY_LANES`, `proposeEpicBuy`, `proposeOpenEpic`), `src/markets/scanner.ts`, `src/markets/AGENTS.md`, `src/teamdesk/` (`counter.ts`, `TEAM_DESK_PARAMS`), `src/trades/trades.ts` (`foreignBidRefs`), `src/coordinator/main.ts` (cableado de epic y `epicDoneFile`), `test/markets/rival-buy-epic.test.ts`, `results/bazaar-live/epic-done.json`, `results/trader/value-table.md`, `.omc/handoffs/team-desk-to-trader.md`, `results/bazaar-live/<fecha>/score-audit.jsonl`.

## Comunicación

- coordinator: OK y reinicios (hash, proceso, flags, líneas del dry-run); le pasa encargos.
- goals: cada propuesta (pros, contras, recomendación, commit, figures_for_humans); señala conflictos.
- team-trades: cambios en `src/trades/`; revisa (aprobó 70a94aa).
- dealers: precios y escalera (Pícaros MAL-11, CHA-05 en Abuela).
- broker: Market Test «nuestro vs óptimo».
