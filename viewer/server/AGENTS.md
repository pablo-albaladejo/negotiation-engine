# viewer/server/ — Servidor Node del Visor

Servidor node:http (`http.ts`) que sirve `/api/bazaar/*` y delega el resto en Vite. Solo 127.0.0.1, solo GET/HEAD, Host comprobado (DNS rebinding); cualquier otra ruta `/api` da 404.

## Archivos

- **`api.ts`** — tipo `ApiResponse` (`{ data, errors }`). **`read.ts`** / **`paths.ts`** — lectura JSONL validada con Zod y rutas resueltas dentro de su raíz.
- **`main.ts`** — Entry point: arranca servidor en http://127.0.0.1:5199 (puerto configurable con `VIEWER_PORT`, dirección fija `127.0.0.1`; `VIEWER_BAZAAR_DIR` la de los `score.jsonl` del Bazaar).
- **`bazaar.ts`** — `bazaarScore` lee los `score.jsonl` de `VIEWER_BAZAAR_DIR` (por defecto `results/bazaar-live`), de solo lectura y a prueba de traversal. `BazaarLive.get` (`GET /api/bazaar/live`) solo llama al Bazaar en vivo (`GET /api/me` + `/api/clock`) cuando `BAZAAR_KEY` está en el entorno del propio servidor (cargado como `src/shared/env.ts`); devuelve solo los campos públicos de la cifra y el reloj, nunca la clave, cacheado ~5 s. `BazaarThreads.get` (`GET /api/bazaar/threads`) llama `GET /api/me/threads` + `GET /api/threads/{id}` (las 6 más recientes/abiertas) y añade nuestra traza local (`thread-<id>.jsonl` bajo `VIEWER_BAZAAR_DIR`) si existe; `BazaarDuels.get` (`GET /api/bazaar/duels`) llama `GET /api/duels` (abiertos y, si el servidor lo soporta, `?done=true`). Ambos cacheados ~5 s, solo con `BAZAAR_KEY`, nunca la clave en la respuesta. **Pestaña unificada `#bazaar`** con vista en tiempo real del board (threads, duels, trades, offers entre equipos).

- **`bazaar-board.ts`** + **`bazaar-board-core.ts`** — **`GET /api/bazaar/board`**: vista unificada del Bazaar en la pestaña `#bazaar`. Un ciclo por tick (programado con `next_tick_in` de `/api/clock`, caché compartida y un solo vuelo) hace solo GET (`/api/clock`, `/api/leaderboard`, `/api/feed`, `/api/venues/rastro/offers` sin clave; `/api/me`, `/api/me/threads`, `/api/duels` (+`?done=true`), `/api/me/offers`, `/api/venues/<nuestro>/offers` y `/api/me/value` con clave) por un cubo de ≤ 2 req/s. El núcleo puro arma UNA lista (hilos con dealers, duelos, tratos y ofertas entre equipos) con precio, valor de lo recibido/entregado, excedente, veredicto (≥ 1 bueno, ≤ −1 malo), Δ de `score.jsonl` por `cause.thread`, ticks, mensajes literales, ofertas y nuestras `decisions.jsonl`. El valor se calcula una vez y se guarda en `<VIEWER_BAZAAR_DIR>/<fecha>/verdicts.json` (único fichero que escribe el visor), junto con las liquidaciones del feed que nos tocan (el feed es corto). Los libros (El Rastro y nuestro venue) traen las 40 ofertas más recientes y siempre las nuestras. Para la cabina añade `/api/catalog` (cada hora), `/api/schedule` y `/api/me/value` de ≤ 3 cartas que faltan por ciclo (se recuerdan hasta que cambian nuestras cartas). Respaldo opcional de solo lectura: `VIEWER_BAZAAR_SNAPSHOTS` (por defecto el fichero de snapshots del monitor de causa-prima). Nunca la clave en la respuesta.
- **`bazaar-cockpit-core.ts`** — núcleo puro de la cabina: copias que tenemos (`holdingsOf`), páginas del álbum con las cartas que faltan (`albumOf`) y calendario futuro (`scheduleOf`).
- **`bazaar-agents.ts`** — estado de dealers, duelos y broker por la hora y la última línea de su traza en `results/bazaar-live/<fecha>/` (solo lectura).

## Cómo trabajar

```bash
pnpm --dir viewer start
```

## Links

- ↑ [`viewer/`](../AGENTS.md)
- → API: rutas HTTP para UI React
- → Datos: `results/bazaar-live/` (trazas de `src/`)
