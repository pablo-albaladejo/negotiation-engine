# src/intros/ — presentaciones por hilo

Mitad uno a uno del emparejador del market: para cada pareja de repetida y carta que falta del registro de rivales (`matchPairs` de [`broker/`](../broker/AGENTS.md)), **puja primero** (Pablo, 4 oct: 8 presentaciones a dos bandas, 0 órdenes): solo se escribe al equipo al que le falta la carta, en un hilo en El Rastro (en nuestro venue el juego lo rechaza con self_venue) que se cierra en el acto, para que puje ya en **nuestro venue** (se lee de `/api/me`; si no hay venue abierto, no sale nada). En cuanto su puja está en el libro, las presentaciones de libro avisan a quien tiene la carta, que así siempre ve una puja viva; el broker las cruza. El valor creado entre otros equipos en nuestro venue es la parte orgánica del market.

- **Presentaciones de libro:** antes que las parejas, si otro equipo tiene una orden abierta en nuestro venue (venta de una carta o puja por cualquier copia; el libro público muestra al autor con seudónimo), se avisa a quien puede casarla: a quien tiene la carta si es una puja, y a quien la busca si es una venta. Como mucho 2 equipos por orden y 4 mensajes por hora.
- **Sin cifras:** el texto nombra carta, equipos y venue; es texto del juego (`// game text`). Del rival solo se lee estructura (ofertas, feed, `/api/cards`).
- **Topes** (`INTRO_PARAMS`): 3 parejas por hora, 1 por pasada, un equipo como mucho cada 2 h, al mismo equipo no se le habla de la misma carta más de una vez cada 6 h; deja libres ≥ 3 huecos de conversación (dealers y team desk los comparten).
- Registro de enviadas en `results/bazaar-live/intros.json`.

## Archivos

- **`intros.ts`** — puro: `planIntros`, `bidFirstMessage`, `INTRO_PARAMS`; memoria con `loadIntroMemo`/`saveIntroMemo`. `introDemand`: cartas de presentaciones de las últimas 6 h en las que tenemos la repetida; ni los dealers ni El Taller las usan (las repetidas van antes a los equipos).
- **`main.ts`** — `pnpm bazaar:intros` (`--dry-run --once`; en vivo con `--confirm`, cada `--every-s` segundos, 300 por defecto).

Padre: [`src/`](../AGENTS.md)
