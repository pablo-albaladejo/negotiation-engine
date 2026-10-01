# viewer/server/ — Servidor Node del Visor

Servidor node:http que sirve API y archivos estáticos del visor React.

## Propósito

Entry point Node: carga archivo JSON de resultados desde `results/`, expone rutas HTTP para la UI.

## Archivos

- **`main.ts`** — Entry point: arranca servidor en http://127.0.0.1:5199 (puerto configurable con `VIEWER_PORT`, dirección fija `127.0.0.1`).

## Cómo trabajar

```bash
pnpm --dir viewer start
```

## Links

- ↑ [`viewer/`](../AGENTS.md)
- → API: rutas HTTP para UI React
- → Datos: `results/` (generados por arena)
