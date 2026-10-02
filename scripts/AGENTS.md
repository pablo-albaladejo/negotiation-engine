# scripts/ — Utilidades

- **`bazaar-api-scan.mjs`** — Escaneo de solo lectura de la API del Bazaar (`pnpm bazaar:scan`, con `.env` y la clave del broker (`BAZAAR_BROKER_KEY`) cargados): GET a cada endpoint, guarda las respuestas en `results/bazaar-live/<fecha>/api-scan-HHMM.json`. `/api/cards/{id}` pide el id numérico del asset, no la ref (`SAL-09` da 422).
- **`bazaar-convo-feed.mjs`** — `pnpm bazaar:feed`: imprime en vivo cada mensaje nuevo de nuestros hilos (dealers y equipos). Solo lectura, la clave nunca se imprime.
- **`check-agents-links.mjs`** y **`check-identifiers.mjs`** — `pnpm docs:check`: enlaces de los AGENTS.md e identificadores citados que existen en el código.

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
