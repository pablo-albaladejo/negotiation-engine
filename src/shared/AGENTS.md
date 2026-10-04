# src/shared/ — Lo común

Lo que usan todas las rutas: cliente HTTP de la API, esquemas Zod, claves, «un activo en un solo sitio», trazas y la cifra.

## Archivos

- **`env.ts`** — `loadBazaarEnv`: `BAZAAR_URL` y `BAZAAR_KEY` del entorno o de `.env` (process.loadEnvFile). La clave nunca se imprime.
- **`client.ts`** — `BazaarClient`: cabecera X-Team-Key, `TokenBucket` (4 req/s, ráfaga 2; el servidor admite 5; con prioridad: el método prioritized del cliente da otro cliente con la misma clave y el mismo cubo cuyas peticiones pasan delante de las normales sin subir el total, lo usa la ruta de duelos), reintento (hasta 3) de rate_limited y too_many_failures (y de fallos de red solo en GET), wait_for_tick (duerme hasta el siguiente tick solo con waitOnTick, apagado por defecto y que nadie enciende: el bucle salta al siguiente tick), un POST nunca se repite tras fallo de red. Errores tipados `BazaarError` con `code`, `status` y `extra`. Caché de valores privados en el propio cliente (`/api/me/value`): un valor dura una hora y `noteHand` olvida todo el set en el que cambió alguna cantidad (el bonus de página depende del resto del set); `seedValues` siembra lo de `/api/me` y, solo en el primer tick, la caché en disco (`results/bazaar-live/values.json`, guardada con la mano: sin ella no se usa). Todos los que comparten cliente (agentes, coordinador, visor) piden solo lo que falta.
- **`schemas.ts`** — Zod tolerante (campos extra permitidos). `/api/dealers` responde personas: `DealersSchema` acepta ambos nombres.
- **`asset-locks.ts`** — **guardarraíl crítico**: un activo, un sitio. `busyAssets` (hilos abiertos + `/api/me/offers`) y `sellBlocked`, que usa el agente de dealers; `assetsInThreads`/`assetsInOffers` los usa `trades`. El agente de dealers no abre un hilo de venta de un activo ya en otro hilo u oferta abierta (si no puede leerlos, no ofrece ninguno); `../trades/agent.ts` no lista ni paga con un activo que esté en un hilo con un dealer. `isKeepsake` (regla de Pablo, 3 oct: **las cartas ocultas NO se venden**): toda carta oculta (`hidden: true` en el catálogo; `rememberHiddenCards` las apunta en cada lectura de `/api/catalog` desde `client.ts`, con LAT-13 sembrada) sea cual sea su valor, y además una carta de tirada única (`print_run` 1) o una épica/legendaria sin valor privado positivo nunca sale sola; `heldAssets` (trades) la marca `locked`, así que ni El Rastro ni rival-page, rival-swap, el escáner o el team desk la ofrecen (3 oct: el regalo del egg LAT-13, «La Chulapa Dorada», con your_value 0, se ofreció a banco al tick siguiente).
- **`last-copy.ts`** — **guardarraíl de última copia**: `freeCounts` (copias libres = en mano − bloqueadas − reservadas), `takesLastFreeCopy` e `isLastFreeCopy`: ninguna venta ni pago puede dejar 0 copias libres de una carta. Lo usan la aceptación de El Rastro (`../trades/trades.ts`), el escáner (`../markets/markets.ts`) y rival-page.
- **`trace.ts`** — `FileTrace`: JSONL en `results/bazaar-live/<fecha>/decisions.jsonl` y `thread-<id>.jsonl` (tick, precios, reserva usada, acción, regla, resultado).
- **`score.ts`** — la cifra que maximizamos: `ScoreTracker.record` lee de `/api/me` solo los campos públicos de la cifra (lista cerrada; los campos privados de rareza/suerte del servidor nunca se leen) y escribe un snapshot por tick en `results/bazaar-live/<fecha>/score.jsonl` (`FileScoreTrace`), con `delta` por campo y `cause` (hilo, dealer, acción, precio) desde la traza del propio tick. `formatScoreSummary`/`formatScoreBreakdown` dan la línea de la CLI y el desglose de `bazaar:status`.
- **`llm.ts`** — `claudeOnce`: una llamada a `claude -p --model haiku` con el prompt por stdin y 60 s de tope; null si falla, nunca lanza. La usan el resumen de noticias (`../news/`) y el etiquetado de pistas (`../hints/labels.ts`); su salida nunca es una cifra.

## Reglas

- Nada aquí decide una cifra; la clave nunca sale en una traza ni en un log.

## Links

- ↑ [`src/`](../AGENTS.md)
