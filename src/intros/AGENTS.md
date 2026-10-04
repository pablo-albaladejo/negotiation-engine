# src/intros/ — presentaciones por hilo

Mitad uno a uno del emparejador del market: para cada pareja de repetida y carta que falta del registro de rivales (`matchPairs` de [`broker/`](../broker/AGENTS.md)), abre un hilo con el equipo que tiene la repetida y otro con el que la busca, dice un mensaje y lo cierra en el acto. Los manda a publicar en **nuestro venue** (se lee de `/api/me`; si no hay venue abierto, no sale nada), donde el broker cruza la venta en caja con la puja «cualquier copia». El valor creado entre otros equipos en nuestro venue es la parte orgánica del market.

- **Sin cifras:** el texto nombra carta, equipos y venue; es texto del juego (`// game text`). Del rival solo se lee estructura (ofertas, feed, `/api/cards`).
- **Topes** (`INTRO_PARAMS`): 3 parejas por hora, 1 por pasada, un equipo como mucho cada 2 h, la misma pareja como mucho cada 6 h; deja libres ≥ 3 huecos de conversación (dealers y team desk los comparten).
- Registro de enviadas en `results/bazaar-live/intros.json`.

## Archivos

- **`intros.ts`** — puro: `planIntros`, `introMessages`, `INTRO_PARAMS`; memoria con `loadIntroMemo`/`saveIntroMemo`. `introDemand`: cartas de presentaciones de las últimas 6 h en las que tenemos la repetida; ni los dealers ni El Taller las usan (las repetidas van antes a los equipos).
- **`main.ts`** — `pnpm bazaar:intros` (`--dry-run --once`; en vivo con `--confirm`, cada `--every-s` segundos, 300 por defecto).

Padre: [`src/`](../AGENTS.md)
