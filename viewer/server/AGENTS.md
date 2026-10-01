# viewer/server/ — Servidor Node del Visor

Servidor Hono que sirve API y archivos estáticos del visor React.

## Propósito

Entry point Node: carga archivo JSON de resultados desde `results/`, expone rutas HTTP para la UI.

## Archivos

- **`main.ts`** — Entry point: arranca servidor en 127.0.0.1:3000.

## Cómo trabajar

```bash
pnpm --dir viewer start
```

## Links

- ↑ [`viewer/`](../AGENTS.md)
- → API: rutas HTTP para UI React
- → Datos: `results/` (generados por arena)
