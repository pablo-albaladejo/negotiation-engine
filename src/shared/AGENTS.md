# src/shared/ — Lo común

Lo que usan todas las rutas: cliente HTTP de la API, esquemas Zod, claves, «un activo en un solo sitio», trazas y la cifra.

## Archivos

- **`env.ts`** — `loadBazaarEnv`: `BAZAAR_URL` y `BAZAAR_KEY` del entorno o de `.env` (process.loadEnvFile). La clave nunca se imprime.
- **`client.ts`** — `BazaarClient`: cabecera X-Team-Key, `TokenBucket` (4 req/s, ráfaga 2; el servidor admite 5), reintento de rate_limited, wait_for_tick (duerme next_tick_in si waitOnTick; el bucle lo deja en falso y salta al siguiente tick), un POST nunca se repite tras fallo de red. Errores tipados `BazaarError` con `code`, `status` y `extra`. Caché de valores privados en el propio cliente (`/api/me/value`): un valor dura una hora y `noteHand` olvida las cartas cuya cantidad cambió; `seedValues` siembra lo de `/api/me` y la caché en disco (`results/bazaar-live/values.json`). Todos los que comparten cliente (agentes, coordinador, visor) piden solo lo que falta.
- **`schemas.ts`** — Zod tolerante (campos extra permitidos). `/api/dealers` responde personas: `DealersSchema` acepta ambos nombres.
- **`asset-locks.ts`** — **guardarraíl crítico**: un activo, un sitio. `busyAssets` (hilos abiertos + `/api/me/offers`) y `sellBlocked` (dealers + El Rastro). El agente de dealers no abre un hilo de venta de un activo ya en otro hilo u oferta abierta (si no puede leerlos, no ofrece ninguno); `../trades/agent.ts` no lista ni paga con un activo que esté en un hilo con un dealer.
- **`trace.ts`** — `FileTrace`: JSONL en `results/bazaar-live/<fecha>/decisions.jsonl` y `thread-<id>.jsonl` (tick, precios, reserva usada, acción, regla, resultado).
- **`score.ts`** — la cifra que maximizamos: `ScoreTracker.record` lee de `/api/me` solo los campos públicos de la cifra (lista cerrada; los campos privados de rareza/suerte del servidor nunca se leen) y escribe un snapshot por tick en `results/bazaar-live/<fecha>/score.jsonl` (`FileScoreTrace`), con `delta` por campo y `cause` (hilo, dealer, acción, precio) desde la traza del propio tick. `formatScoreSummary`/`formatScoreBreakdown` dan la línea de la CLI y el desglose de `bazaar:status`.

## Reglas

- Nada aquí decide una cifra; la clave nunca sale en una traza ni en un log.

## Links

- ↑ [`src/`](../AGENTS.md)
