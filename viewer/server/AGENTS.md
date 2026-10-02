# viewer/server/ — Servidor Node del Visor

Servidor node:http que sirve API y archivos estáticos del visor React.

## Propósito

Entry point Node: carga archivo JSON de resultados desde `results/`, expone rutas HTTP para la UI.

## Archivos

- **`main.ts`** — Entry point: arranca servidor en http://127.0.0.1:5199 (puerto configurable con `VIEWER_PORT`, dirección fija `127.0.0.1`; `VIEWER_RESULTS_DIR` cambia la raíz de `results/`, `VIEWER_BAZAAR_DIR` la de los `score.jsonl` del Bazaar).
- **`bazaar.ts`** — `bazaarScore` lee los `score.jsonl` de `VIEWER_BAZAAR_DIR` (por defecto `results/bazaar-live`), de solo lectura y a prueba de traversal. `BazaarLive.get` (`GET /api/bazaar/live`) solo llama al Bazaar en vivo (`GET /api/me` + `/api/clock`) cuando `BAZAAR_KEY` está en el entorno del propio servidor (cargado como `src/bazaar/env.ts`); devuelve solo los campos públicos de la cifra y el reloj, nunca la clave, cacheado ~5 s. `BazaarThreads.get` (`GET /api/bazaar/threads`) llama `GET /api/me/threads` + `GET /api/threads/{id}` (las 6 más recientes/abiertas) y añade nuestra traza local (`thread-<id>.jsonl` bajo `VIEWER_BAZAAR_DIR`) si existe; `BazaarDuels.get` (`GET /api/bazaar/duels`) llama `GET /api/duels` (abiertos y, si el servidor lo soporta, `?done=true`). Ambos cacheados ~5 s, solo con `BAZAAR_KEY`, nunca la clave en la respuesta.

## Cómo trabajar

```bash
pnpm --dir viewer start
```

## Links

- ↑ [`viewer/`](../AGENTS.md)
- → API: rutas HTTP para UI React
- → Datos: `results/` (generados por arena)
