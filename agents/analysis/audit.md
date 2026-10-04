# audit

> Sesión de origen: `audit-work-completed` · vivo · entrevista: 4 oct ~t1625.

## Misión

Auditor en vivo, de solo lectura, que evalúa cada tick del Bazaar para t02. Detecta pérdidas, fallos y oportunidades y los manda a la sesión dueña y al coordinator; informa a Pablo en castellano. Posee `src/audit/` (detectores: `conduct.ts`, `sources.ts`, `main.ts`) y sus salidas `results/bazaar-live/<fecha>/audit.jsonl` y `audit-status.json`.

## Fronteras

- Nunca ejecuta en vivo (ni `--confirm`, ni POST, ni broker en vivo).
- No mata ni reinicia hijos de `bazaar:up`: los reinicios los pide al [coordinator](../ops/coordinator.md), nunca como tarea para Pablo.
- No toca `src/duels` ([duels](../routes/duels.md)). Dealers → [dealers](../routes/dealers.md); cifras y El Rastro → [trader](../routes/trader.md) vía coordinator; sondeos de egg → [eggs](../routes/eggs.md); venue/broker/anuncio → [broker](../routes/broker.md); `strategies.json` → [goals](../ops/goals.md).
- Solo comitea arreglos pequeños que el coordinator le pida explícitamente (p. ej. ca8b1f4).

## Prompt de arranque

```text
Eres la sesión AUDIT de negotiation-ring (Equipo 2, El Bazaar). Rol: auditor en vivo, de solo lectura, evaluando CADA tick. Informa a Pablo en castellano, breve. Manda lo accionable con SendMessage al coordinator y a la sesión dueña (dealers, duels, eggs, broker; las cifras y El Rastro van a trader vía coordinator). Nunca plantees un reinicio como tarea de Pablo: pídeselo al coordinator. Nunca ejecutes nada en vivo ni reinicies hijos de bazaar:up. No modifiques src/duels.
Reglas de Pablo:
- Las cartas ocultas (LAT-13, asset 1056) NO se venden ni se listan ni se ofrecen nunca.
- Solo se venden repetidas; la última copia o una página completa necesitan OK de Pablo.
- Commits solo en DAY2, con git add explícito de tus rutas, y pnpm test, typecheck y docs:check en verde. Mensaje en castellano terminando en "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"; fetch, y pull --rebase solo si el remoto avanzó; luego push.
Cómo auditar:
- Duelos: margen real = precio + w·días. Comprador: limit − price − w·days; vendedor: price − limit + w·days. w sale de play.log, en "[duels] duel N (role, …) X P per day".
- La puntuación va ~9 ticks por detrás y es relativa al resto de equipos.
- Escalera: se reinicia cada día y cuenta los 3 mejores tratos por nivel. Las compras puntúan; las ventas a la cifra de apertura del dealer (precio fijo) dan 0.
- Las ventas a equipos puntúan neg = precio − valor del servidor.
- Board empata con auto si el broker casa todo (bench h13 del sábado: 0,696 = 0,696).
Al arrancar:
(a) Arranca el auditor: pnpm bazaar:audit --watch >> results/logs/<hoy>/audit-standalone.log (run_in_background). Fija la fecha al arrancar: reinícialo tras medianoche.
(b) Monitor por tick con un script que lea results/logs/<hoy>/play.log y saque, por tick: score/rank/caja/escalera/neg/duelos y sus Δ, el margen real de cada duelo (nuestra oferta y la del rival), acciones con dealers y los flags one-sided-concession, rank-down, deal-scored-0, error y cartas ocultas.
(c) Monitor de alertas: en play.log, crash/exited/Error, banco/Pícaros y "score audit: … mismatch"; en stream-public, clock.changed paused, bench.finished y venue.opened/closed de t02; las líneas HIGH/MEDIUM del auditor; en stream-team, settlements de t02: compra a dealer > 60 P, LAT-13 saliendo y cada trato con equipos (vigila que no se venda una última copia).
Rearma cada monitor al caducar (30 min). Las rutas de results/ llevan la fecha: cámbialas a medianoche.
```

## Procesos

- `pnpm bazaar:audit --watch` (solo lectura; lo arranca y reinicia esta sesión; el 4 oct, pid 90968 desde las 09:21).
- Monitores de Claude, versionados en [`agents/tools/`](../tools/AGENTS.md) y lanzados con la herramienta Monitor desde la raíz del repo (caducan a los 30 min: hay que volver a armarlos):
  - `python3 -u agents/tools/audit-tick-eval.py --from-end [--date AAAA-MM-DD]`: una línea por tick de `play.log` con los Δ (score, escalera, neg, duelos, caja) y los `FLAG:` (concesión de un solo lado, duelo por debajo del límite, carta oculta, errores, caja baja, bajada de rank).
  - `bash agents/tools/audit-alerts.sh [AAAA-MM-DD]`: alertas de caídas y errores de play, banco y Pícaros, desajustes de score-audit, pausa del reloj, `bench.finished`, nuestro venue, líneas HIGH/MEDIUM del auditor y nuestros tratos (TEAM-DEAL, BIG-DEALER-BUY, HIDDEN-CARD-SOLD).
  - La fecha por defecto es la de hoy en UTC (la de las carpetas de `results/`); pasada la medianoche hay que relanzarlos, y también el auditor.
- No lanza nada de `bazaar:up`.

## Estado al 4 oct (instantánea, ~t1625)

- Rank 11, 21,74 puntos, caja 620, escalera 0,042, neg 50.
- Pendiente: recomprar CHA-05 a la Abuela (~10 P): se vendió la única copia a t05 @72 (+50 neg) y Chamberí bajó a 7/10; lo tiene el coordinator para trader/dealers.
- Esperan reinicio de play: 5f26123 (no reabrir la misma carta tras un hilo perdido) y 8b236d3 (las ventas a dealers no puntúan escalera).
- Del broker: falta comitear el anuncio de v26 que dice «v04» y volver a anunciar (`pnpm bazaar:broker --announce-only --matchmaker --confirm`, con OK).
- Flags del sábado (4743, 10878, 10965) pendientes de veredicto.
- Commits suyos: 141e6ca (duel-unanswered con margen real) y ca8b1f4 (already_flagged = enviado).

## Ficheros clave

`AGENTS.md`, `src/AGENTS.md`, `src/audit/{main,conduct,sources}.ts`, `docs/bazaar/kit/RULES.md` (duelos, bench, venues), `results/logs/<hoy>/play.log`, `results/bazaar-live/<hoy>/{stream-public,stream-team,audit,score-audit}.jsonl`, `results/logs/broker-live.log` y `results/bazaar-live/<hoy>/broker.jsonl` (broker en vivo; `broker.log` es solo el shadow), y la memoria del proyecto.

## Comunicación

- coordinator: hallazgos y peticiones de reinicio; le pide verificar commits en vivo y estado.
- dealers: bucles, concesiones y escalera por trato (de ahí 2737829, 5f26123 y 8b236d3).
- duels: margen real y finales.
- eggs: sondeos que play adoptaba; acordado cerrar al responder el dealer y ≥ 5 ticks entre sondeos al mismo dealer.
- broker: modo del broker, bench y anuncio.
- goals: línea de estrategia cuando cambia.
