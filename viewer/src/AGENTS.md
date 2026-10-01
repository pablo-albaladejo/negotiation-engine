# viewer/src/ — Componentes React

Componentes React: modelo de datos, pantallas (vistas) y UI (componentes básicos).

## Propósito

SPA de visor: carga JSON de resultados, renderiza tablas, gráficos, trazas.

## Subdirectorios

- **`model/`** — Lógica de modelo (tipos, carga de archivos, procesamiento).
- **`screens/`** — Pantallas: arena, promoción, turno (top-level).
- **`ui/`** — Componentes básicos: tablas, botones, gráficos (reusable).

## Cómo trabajar

```bash
pnpm --dir viewer start   # Dev + React hot reload
pnpm --dir viewer test    # Tests
```

## Links

- ↑ [`viewer/`](../AGENTS.md)
- → [`model/`](model/) — lógica
- → [`screens/`](screens/) — pantallas
- → [`ui/`](ui/) — componentes
- → Design system: [`design-system/`](../../design-system/AGENTS.md)
