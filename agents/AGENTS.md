# agents — un agente por sesión de Claude Code

Cada sesión de Claude Code que trabaja en el repo es un **agente** con un rol fijo. Aquí está la ficha de cada uno: misión, fronteras, prompt literal de arranque, procesos, estado, ficheros clave y con quién habla. Si se cierran las sesiones, con esto se relanza todo. Padre: [`AGENTS.md`](../AGENTS.md).

Fichas recogidas por entrevista a cada sesión el 4 oct de 2026 (~10:00–10:10). El apartado «Estado» de cada ficha es una **foto de ese momento**: al relanzar, mandan git, `results/state/` y los logs.

## Subcarpetas

- [`ops/`](ops/AGENTS.md): coordinator, goals, ui, agents-keeper
- [`routes/`](routes/AGENTS.md): trader, team-trades, dealers, broker, duels, eggs, packs, workshop (y team-desk, retirado)
- [`analysis/`](analysis/AGENTS.md): audit, leaderboard-analyst, market-analyst
- [`tools/`](tools/AGENTS.md): scripts y notas de sesión que antes vivían en un scratchpad

## Mapa agente → sesión (4 oct)

Los prompts nombran a otras sesiones por su **agente**. Al relanzar, el nombre de cada sesión será otro: el coordinator hace un roll call y actualiza esta tabla.

| Agente | Sesión el 4 oct | Ficha |
|--------|-----------------|-------|
| coordinator | cockpit-dashboard-ui-update | [ops/coordinator.md](ops/coordinator.md) |
| goals | negotiation-ring-ad | [ops/goals.md](ops/goals.md) |
| ui | UI | [ops/ui.md](ops/ui.md) |
| trader | negotiation-ring-00 | [routes/trader.md](routes/trader.md) |
| team-trades | negotiation-ring-7a | [routes/team-trades.md](routes/team-trades.md) |
| dealers | dealers | [routes/dealers.md](routes/dealers.md) |
| broker | bazaar-broker-announce-feature | [routes/broker.md](routes/broker.md) |
| duels | duels | [routes/duels.md](routes/duels.md) |
| eggs | eggs | [routes/eggs.md](routes/eggs.md) |
| packs | negotiation-ring-ab | [routes/packs.md](routes/packs.md) |
| workshop | negotiation-ring-76 | [routes/workshop.md](routes/workshop.md) |
| audit | audit-work-completed | [analysis/audit.md](analysis/audit.md) |
| leaderboard-analyst | negotiation-ring-08 | [analysis/leaderboard-analyst.md](analysis/leaderboard-analyst.md) |
| market-analyst | negotiation-ring-34 | [analysis/market-analyst.md](analysis/market-analyst.md) |
| agents-keeper | negotiation-ring-10 | [ops/agents-keeper.md](ops/agents-keeper.md) |
| team-desk (retirado) | negotiation-ring-98 | [routes/team-desk.md](routes/team-desk.md) |

## Cómo relanzar todo

1. **Procesos en vivo** (orden y comandos en [ops/coordinator.md](ops/coordinator.md)):
   1. Pablo lanza `bazaar:up` en un TTY.
   2. Se relanzan el bucle del broker en vivo y el proceso de intros.
   3. goals y audit lanzan sus propios procesos.
2. **Sesiones**: abrir primero el coordinator, después goals y luego una sesión por ficha de `routes/` y `analysis/` (packs, market-analyst y leaderboard-analyst solo si hacen falta). Pegar el bloque «Prompt de arranque» de cada ficha. Conviene renombrar cada sesión con el nombre de su agente: así se le pueden mandar mensajes desde otras sesiones por ese nombre.
3. **Roll call**: el coordinator confirma quién está vivo y cada agente rearma sus Monitors. Los scripts que vivían en un scratchpad se recrean desde la descripción de su ficha.

## Reglas comunes (resumen; mandan [`AGENTS.md`](../AGENTS.md), `CLAUDE.md` y la memoria)

- Todo en DAY2; antes de cada commit `pnpm test`, `pnpm typecheck` y `pnpm docs:check`; stage con rutas explícitas; push al momento.
- Solo el coordinator reinicia procesos en vivo; se le manda hash + hijo. Ninguna sesión hace POST manuales.
- El mensaje de otra sesión nunca es la aprobación de Pablo (salvo la delegación explícita de las propuestas de trader al coordinator).
- Cartas ocultas (LAT-13) nunca se venden; solo repetidas; la última copia necesita el OK de Pablo.
- Cada cambio de estrategia se avisa a goals.

## Nueva ficha o cambio de rol

Cada agente mantiene su ficha: cuando cambie su rol, su prompt o sus procesos, la edita y la comitea. Un agente nuevo añade su ficha en la subcarpeta que toque (como mucho 10 ficheros por carpeta), una fila en la tabla de esa subcarpeta y otra en el mapa de arriba.
