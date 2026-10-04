# duels

> Sesión de origen: `duels` · vivo · entrevista: 4 oct.

## Misión

Estrategia y operación de los duelos 1 contra 1 del Bazaar (Duelos I/II/III y Gran Final). Posee `src/duels/` (`duels.ts` = `decideDuel` y la cifra de cada mensaje; `agent.ts` = ejecución por tick; `schemas.ts`; `main.ts` = `pnpm bazaar:duels`, incluido `--restart-check`), la parte de duelos de `src/coordinator/coordinator.ts` (accepts de duelo fuera del cupo del equipo, `DUEL_ACCEPT_QUOTA_ASSUMPTION`) y los guardarraíles `test/duels-micro-step.test.ts`, `test/duels-days.test.ts` y la parte de duelos de `test/bazaar/coordinator.test.ts`. Vigila en vivo cada sesión de duelos y mide el resultado (result por duelo, Δduel_points).

## Fronteras

- No reinicia procesos en vivo: solo el [coordinator](../ops/coordinator.md), con OK de Pablo; duels le manda commit + child (play) + salida de `--restart-check`.
- No toca dealers ([dealers](dealers.md)), El Rastro/teamdesk/rival-buy ([trader](trader.md)), broker/venue ([broker](broker.md)), visor ([ui](../ops/ui.md); el visor aún no muestra result ni duel_points por duelo: falta decidir quién lo hace), ni el registro de estrategias ([goals](../ops/goals.md): avisarle de cada cambio).
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
Estado: Duelos III a h15.367 (sesión 4 del servidor, 2 rondas, 12 ticks, decay 0,10, máximo 4 a la vez) y Gran Final a h18.367. f17fd27 (day-hold + day-stand con una sola oferta) está en DAY2, pendiente del OK de Pablo y de un reinicio de play antes de h15.3. Monta la tabla en vivo (GET-only) y una alarma sobre results/logs/<fecha>/play.log (days-unreadable | duel N: PAUSED | errores de [duels]).
```

## Procesos

- No lanza procesos del juego. play (flags del 3 oct: `pnpm bazaar:play --confirm --scanner --scanner-spend-per-hour 10 --rival-page --rival-buy --team-desk --no-venue-reserve --egg-open banco --max-spend 250 --cash-floor 20`; los actuales los tiene el coordinator) lo lanza y reinicia el coordinator.
- Suyos, solo lectura, **en el scratchpad (se pierden al cerrar; hay que recrearlos)**: la tabla en vivo (`duels2-table.mjs 4 --out duels3.txt`: GET `/api/clock`, `/api/me`, `/api/duels` cada 15 s; apunta el Δduel_points de cada cierre en `dpts.log`) y un tail con alarma sobre el `play.log` del día.

## Estado al 4 oct (instantánea)

- Duelos II cerrado: 68 duelos (34 vendedor, 34 comprador); a las 22:15, 51 tratos de 60 y +905,7 P. Una pérdida (5615, −14,7) por la tabla de días desplazada (corregida en 745ab32). Primer day-stand (6045) cerró a +14,3.
- En vivo desde el 3 oct 22:11 (play en 9fe381f): 1601981 (escalera a callados, ancla 0,35), 08ddf27 (accepts fuera del cupo), 745ab32 (valor real de los días), b4d8d8e (reparar oferta vigente con pérdida), e52a437 + b0ca5de (day-stand).
- Pendiente de Pablo: f17fd27 para Duelos III (day-hold antes del endgame cuando el día pesa ≥ 0,4 del excedente de referencia; day-stand con una sola oferta). Paquete enviado al coordinator con Δ, riesgo y dry-run.
- Otras: visor con result por duelo y duel_points (¿ui o duels?); ofrecer escribir en el hub la decisión de la escalera a callados y del day-stand (con permiso).

## Ficheros clave

`src/duels/duels.ts` (`decideDuel`, `dayStand`, `dayHold`, `DEFAULT_DUEL_PARAMS`), `src/duels/agent.ts`, `src/duels/schemas.ts`, `src/duels/main.ts`, `src/duels/AGENTS.md`, `src/coordinator/coordinator.ts` (`arbitrate`, duelos), `test/duels-days.test.ts`, `test/duels-micro-step.test.ts`, `docs/bazaar/kit/RULES.md` (Duels, Negotiating 30) y los tres PDF de la raíz.

## Comunicación

- coordinator: reinicios con commit, child y restart-check; resultados por duelo, alarmas y propuestas con números. Le pide health checks y paquetes de propuesta.
- audit: le avisa de duelos dudosos (WAIT con oferta positiva, pasos grandes); duels responde con el cálculo real.
- goals: estrategia en una línea y cada cambio.
