# src/goals/ — Objetivos del equipo y registro de estrategias (`pnpm bazaar:goals`)

El **qué**: qué objetivos persigue el equipo, con qué peso y en qué estado está cada uno, y qué estrategia declara cada sesión. El **cómo** (qué ruta, qué sesión, qué reinicio) es del coordinador, que lee los dos ficheros. Fase 1: solo mostrar; ninguna ruta los lee para decidir.

## Archivos

- **`goals.ts`** — puro, sin E/S. `refreshGoals` recalcula en cada tick los campos medidos de cada objetivo (`now`, `day_start`, `delta_tick`, las reglas de `status` de `ruleStatus` y la lista de estrategias enlazadas) y copia tal cual los que fija a mano la sesión «goals» (peso, prioridad, `target`, `why`, `do_not`, `guardrails`). `refreshGaps` añade los huecos automáticos (objetivo con peso > 0 y prioridad ≤ `GAP_PRIORITY` sin estrategia live) y conserva los escritos a mano. `isRoundReset` detecta una ronda nueva porque baja `deals`. `windowEndTick` calcula `until_tick` de duels (próxima ola de duelos), market-test (fin de la próxima sesión del bench) y dealer-ladder (cierre de los puestos) con `/api/clock` y `/api/schedule`: con las puertas cerradas, el reloj se reanuda en el siguiente `day_opens` con el tick_seconds de ese día y los eventos anteriores se saltan.
- **`read.ts`** — `readGoalsState`: lee goals.json y strategies.json de `results/state/` para `GameState.goals` en cada tick (`buildGameState`); un fichero que falta o no se puede leer queda null.
- **`main.ts`** — CLI de solo lectura: un GET a `/api/me`, `/api/clock` y `/api/schedule` cada `--interval` s (30), nunca un POST; `--once` refresca una vez y sale. Escribe de forma atómica (.tmp y rename) en `results/state/` (fuera de git): goals.json, el `gaps` de strategies.json y goals-day-start.json (la foto del primer tick de la ronda: ronda nueva cuando cambia `round` de `/api/clock`; si falla, cuando baja `deals`).

## Reglas

- **Propuestas** (Pablo, 4 oct): una estrategia puede llevar `figures_for_humans`, `pros`, `cons`, `recommendation`, `ok_by` (coordinator para las de TRADER, por delegación de Pablo; pablo para el resto) y `approved_at`. `figures_for_humans` es texto para quien decide: ningún código lo lee y nunca es un precio.
- Fuera de `figures_for_humans`, ni goals.json ni strategies.json llevan nunca un precio, un límite, un id de oferta ni una acción concreta: la cifra sale del código de cada ruta.
- strategies.json lo escribe solo la sesión «goals» a partir de lo que cada sesión declara; `approved_by_pablo` solo es true con fecha y contexto.
- Las líneas que empiezan por `auto: ` (en `changes` y `gaps`) las reescribe el proceso; las demás son de la sesión «goals» y se conservan.

## Links

- ↑ [`src/`](../AGENTS.md)
