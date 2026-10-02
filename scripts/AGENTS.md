# scripts/ — Utilidades

- **`bazaar-api-scan.mjs`** — Escaneo de solo lectura de la API del Bazaar (`pnpm bazaar:scan`, con `.env` y la clave del broker (`BAZAAR_BROKER_KEY`) cargados): GET a cada endpoint, guarda las respuestas en `results/bazaar-live/<fecha>/api-scan-HHMM.json`. `/api/cards/{id}` pide el id numérico del asset, no la ref (`SAL-09` da 422).
- **`bazaar-dump.mjs`** — `pnpm bazaar:dump`: volcado de solo lectura para reconstruir el día en `results/bazaar-live/<fecha>/dump-HHMM/`: foto de todos los endpoints, nuestros hilos y duelos terminados, historial de todos los activos, cartas y sobres (`/api/cards/{id}` desde el 1 hasta 40 ids seguidos inexistentes), feed, `timeline.jsonl` ordenado por tick y un resumen en summary.md. El feed da como mucho 500 eventos y no pagina; en el historial de cartas ajenas el dueño sale como `a team`. Unas 600 peticiones, unos 2–3 minutos.
- **`bazaar-stream-record.mjs`** — `pnpm bazaar:record [--scope team,public] [--quiet]`: graba cada evento del stream SSE en `results/bazaar-live/<fecha>/stream-<scope>.jsonl` (`{recv, scope, event, id?, data}`). Reconecta con espera creciente y `Last-Event-ID`; con 429/503 (6 streams por clave) lee `/api/feed` y guarda lo no visto en `feed-poll.jsonl`. Dejarlo corriendo todo el día: es lo único que conserva la historia completa del feed.
- **`bazaar-convo-feed.mjs`** — `pnpm bazaar:feed`: imprime en vivo cada mensaje nuevo de nuestros hilos (dealers y equipos). Solo lectura, la clave nunca se imprime.
- **`check-agents-links.mjs`** y **`check-identifiers.mjs`** — `pnpm docs:check`: enlaces de los AGENTS.md e identificadores citados que existen en el código.

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
