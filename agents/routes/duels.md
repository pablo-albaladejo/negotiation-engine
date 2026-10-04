# duels

> Sesión de origen: `duels` · Bazaar cerrado (4 oct, tras la Gran Final) · entrevista: 4 oct.

## Misión

Estrategia y operación de los duelos 1 contra 1 del Bazaar (Duelos I/II/III y Gran Final). Posee `src/duels/` (`duels.ts` = `decideDuel` y la cifra de cada mensaje; `agent.ts` = ejecución por tick; `schemas.ts`; `main.ts` = `pnpm bazaar:duels`, incluido `--restart-check`), la parte de duelos de `src/coordinator/coordinator.ts` (accepts de duelo fuera del cupo del equipo, `DUEL_ACCEPT_QUOTA_ASSUMPTION`) y los guardarraíles `test/duels-micro-step.test.ts`, `test/duels-days.test.ts` y la parte de duelos de `test/bazaar/coordinator.test.ts`. Vigila en vivo cada sesión de duelos y mide el resultado (result por duelo, Δduel_points).

## Fronteras

- No reinicia procesos en vivo: solo el [coordinator](../ops/coordinator.md), con OK de Pablo; duels le manda commit + child (play) + salida de `--restart-check`.
- No toca dealers ([dealers](dealers.md)), El Rastro/teamdesk/rival-buy ([trader](trader.md)), broker/venue ([broker](broker.md)), visor ([ui](../ops/ui.md): pinta result, días, decay y Δduel_points por duelo a partir de `duel-points.jsonl`; duels solo le pasa los datos), ni el registro de estrategias ([goals](../ops/goals.md): avisarle de cada cambio).
- No escribe ficheros de `results/state/` ni campos de GameState.

## Prompt de arranque

```text
Eres la sesión "duels" de negotiation-ring (Equipo 2, El Bazaar). Lee AGENTS.md, src/AGENTS.md, src/duels/AGENTS.md, test/duels-days.test.ts y las tres presentaciones de la raíz ("The Bazaar - Duels.pdf", "The Bazaar - Day 2 Hints.pdf", "The Bazaar - Payday.pdf"). Tu rol: estrategia y vigilancia en vivo de los duelos.
Reglas de Pablo en esta sesión:
(a) Todo commit va a DAY2 con pnpm test, typecheck y docs:check en verde; push justo después.
(b) Nunca reinicies play tú: pide el reinicio al coordinator con commit, child y --restart-check (pnpm bazaar:duels --restart-check: NOT SAFE si un duelo vivo acaba en ≤5 ticks).
(c) Cambios de estrategia en vivo solo con OK explícito de Pablo («Sí, ahora», «approve», «si ok», «mandale el mensaje» fueron sus aprobaciones el 3 oct).
(d) Ante una pausa days-unreadable, un rechazo de cupo, un duelo sin contestar o una pérdida, avisa al coordinator enseguida con el JSON crudo.
(e) Las mejoras de estrategia se presentan con números (replay sobre /api/duels?done=true).
(f) Avisa a goals de cada cambio de estrategia.
(g) Al usuario, en español; los mensajes entre sesiones, en inglés o español.
Puntuación: result por duelo = excedente real × (1−decay)^rondas; duel_points mide la parte del pastel (no es lineal con result). Excedente real: comprador = límite − precio − w·días, vendedor = precio − límite + w·días (days_meaning da el signo).
Estado final (4 oct): el Bazaar está cerrado y no quedan duelos (/api/schedule vacío). Si se reabre: play con --duels-fast (un paso por tick en su propio bucle, peticiones de duelo con prioridad en el bucket), última jugada a 2 ticks y, en el final, nuestro precio límite en el día del rival (44137a1). Pendiente de Pablo: decidir si un precio que cruza your_limit pero que los días dejan positivo cuenta como «fuera del límite» (el you_captured del servidor apunta a precio + w·días); se resuelve con un duelo de prueba con poco en juego. Antes de un duelo en vivo, monta la tabla (GET-only) y la alarma sobre results/logs/<fecha>/play.log.
```

## Procesos

- No lanza procesos del juego. play (flags del 3 oct: `pnpm bazaar:play --confirm --scanner --scanner-spend-per-hour 10 --rival-page --rival-buy --team-desk --no-venue-reserve --egg-open banco --max-spend 250 --cash-floor 20`; los actuales los tiene el coordinator) lo lanza y reinicia el coordinator.
- Suyos, solo lectura (GET), versionados en `agents/tools/`:
  - **Tabla en vivo:** `node agents/tools/duels-table.mjs 4` (sesión del servidor: Duelos I = 2, II = 3, III = 4; Gran Final probablemente 5). Lee `/api/clock`, `/api/me` y `/api/duels` cada 15 s y escribe `results/duels/duels-s<sesión>.txt`. Apunta el Δduel_points de cada cierre en `results/duels/dpts.log`. `--tty` la pinta en la terminal y `--out <fichero>` cambia el nombre. Para verla: `watch -n 15 cat results/duels/duels-s4.txt`. Se lanza en segundo plano (run_in_background).
  - **Δ de duel_points por cierre para el visor**: la misma herramienta añade una línea a `results/bazaar-live/<fecha>/duel-points.jsonl` por cada tick en que cierran duelos nuestros: `{tick, session, before, after, delta, duels[]}` (salto compartido si `duels` tiene más de uno; `backfill: true` en las reconstruidas de `dpts.log`). Lo pinta la sesión UI en la columna Points; un duelo no tiene liquidación y `score-audit` nunca lo ve («not audited»).
  - **Simulación de cadencia**: `pnpm exec tsx agents/tools/duels-sim.ts --tick-seconds 15 --waves 2 --load 50` (servidor falso con 5 req/s y un post por tick; rivales que repiten ofertas reales; mide cuánto tardamos en contestar). Con prioridad en el bucket: p50 1,5 s y máximo 2,0 s con 4 duelos a la vez.
  - **Alarma de paso lento** (durante una sesión de duelos): `tail -n0 -F results/logs/<fecha>/play.log | grep -m1 -E "\[duels\] \[fast\] tick [0-9]+ · [1-9][0-9]* live · [0-9]+ acting · (1[2-9][0-9]{3}|[2-9][0-9]{4}) ms"` (paso > 12 s con duelos vivos: casi un tick de 15 s).
  - **Alarma sobre el log de play** (una línea, no es fichero; relanzarla cada día con su fecha): `tail -n0 -F results/logs/<fecha>/play.log | grep -m1 -E "days-unreadable|duel [0-9]+: PAUSED|\[duels\].*(error|rejected)"`. Sale en la primera coincidencia; al saltar, avisar al coordinator con el JSON crudo y volver a lanzarla. Sin códigos HTTP en el patrón: saltaba con ids (11412) y con los ms del bucle rápido («453 ms», «429 ms»); los fallos reales ya llevan `error` (`error:rate_limited`).

## Estado final (4 oct, Bazaar cerrado)

- **Duelos II:** 68 duelos, 51 tratos de 60 a las 22:15, +905,7 P.
- **Duelos III (sesión 4):** 68 duelos, 55 tratos, ~+1300 P. 4 de los 13 sin trato se perdieron por cadencia (~93 P; 11594 ~64 P): play miraba los duelos cada ~30 s. Arreglos: `lastMoveTicks` 2 (5e7c9c1), `--duels-fast` (348be3c) y prioridad de los duelos en el bucket (480bacf).
- **Gran Final (sesión 5):** 34 duelos, 27 tratos, +370,7 P (vendedor +248,0, comprador +122,7). Hubo un paso en 25 de 26 ticks (el 2595 se saltó porque el paso del 2593 tardó 14,3 s) y 0 errores. Pérdidas evitables:
  - 15824 y 15838: vendedor con días; el final ofreció límite + 1 / día 0 en vez del límite en el día del rival. Corregido en 44137a1, con el test arreglado en 04bf57c.
  - 15839: una carrera en el mismo tick, ~15 P.
- **Abierto:**
  - la cuestión de your_limit con días (ver el prompt);
  - ofrecer escribir en el hub la decisión de la escalera a callados, el day-stand y el bucle rápido (con permiso).

## Ficheros clave

`src/duels/duels.ts` (`decideDuel`, `dayStand`, `dayHold`, `DEFAULT_DUEL_PARAMS`), `src/duels/agent.ts`, `src/duels/schemas.ts`, `src/duels/main.ts`, `src/duels/AGENTS.md`, `src/coordinator/coordinator.ts` (`arbitrate`, duelos), `src/coordinator/routes.ts` (`DuelsRoute`, bucle rápido), `src/shared/client.ts` (`TokenBucket` con prioridad), `agents/tools/duels-sim.ts`, `test/duels-days.test.ts`, `test/duels-micro-step.test.ts`, `docs/bazaar/kit/RULES.md` (Duels, Negotiating 30) y los tres PDF de la raíz.

## Comunicación

- coordinator: reinicios con commit, child y restart-check; resultados por duelo, alarmas y propuestas con números. Le pide health checks y paquetes de propuesta.
- audit: le avisa de duelos dudosos (WAIT con oferta positiva, pasos grandes); duels responde con el cálculo real.
- goals: estrategia en una línea y cada cambio.
