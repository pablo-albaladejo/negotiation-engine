# viewer/server/ — Servidor Node del Visor

Servidor node:http (`http.ts`) que sirve `/api/bazaar/*` y delega el resto en Vite. Solo 127.0.0.1, solo GET/HEAD, Host comprobado (DNS rebinding); cualquier otra ruta `/api` da 404.

## Archivos

- **`api.ts`** — tipo `ApiResponse` (`{ data, errors }`). **`read.ts`** / **`paths.ts`** — lectura JSONL validada con Zod y rutas resueltas dentro de su raíz.
- **`main.ts`** — Entry point: arranca servidor en http://127.0.0.1:5199 (puerto configurable con `VIEWER_PORT`, dirección fija `127.0.0.1`; `VIEWER_BAZAAR_DIR` la de los `score.jsonl` del Bazaar).
- **[`bazaar/`](bazaar/AGENTS.md)** — los endpoints `/api/bazaar/*`: puntuación, en vivo, hilos, duelos, tablero (`/api/bazaar/board`) y modelo (`/api/bazaar/model`).

## Cómo trabajar

```bash
pnpm --dir viewer start
```

## Links

- ↑ [`viewer/`](../AGENTS.md)
- → [`bazaar/`](bazaar/AGENTS.md) — endpoints del Bazaar
- → Datos: `results/bazaar-live/` (trazas de `src/`)
