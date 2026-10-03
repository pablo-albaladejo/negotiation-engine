# design-system/ — Componentes React

Paquete independiente: componentes React reutilizables (botones, tablas, temas). Publicable, versionado, separado del resto.

## Propósito

Biblioteca de componentes compartida entre visor y posibles otros clientes. Build: TypeScript + esbuild → CommonJS + ESM + types.

## Estructura

- **[`src/`](src/AGENTS.md)** — código fuente; entrada pública `src/index.ts` (el visor la usa por alias, sin build).
- **[`test/`](test/AGENTS.md)** — solo `no-dangerous-html` (nada de HTML inyectado).
- **[`.design-sync/`](.design-sync/AGENTS.md)** — Sincronización con Claude Design (previews, config, convenciones).
- **[`examples/`](examples/AGENTS.md)** — ejemplos de uso por familia.
- **[`scripts/`](scripts/AGENTS.md)** — build.
- **`README.md`**, **`package.json`**, **`pnpm-lock.yaml`**, `tsconfig.json`, `vitest.config.ts` — paquete independiente (`@negotiation-ring/design-system`) y su configuración.

## Build

```bash
pnpm --dir design-system build   # genera dist/
```

Outputs:
- **`dist/index.js`** — ESM.
- **`dist/index.cjs`** — CommonJS.
- **`dist/index.d.ts`** — TypeScript types.
- **`dist/styles.css`** — CSS compilado.

## Cómo trabajar

```bash
# Instalar dependencias
pnpm --dir design-system install

# Build
pnpm --dir design-system build

# Tests
pnpm --dir design-system test

# TypeScript
pnpm --dir design-system typecheck
```

## Invariantes

- **Independiente**: puede publicarse por npm sin el resto del proyecto.
- **Versiones peer de React**: `react@^18.3.0`, `react-dom@^18.3.0`.
- **Sin dependencias de negocio**: solo componentes genéricos.

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
- → Usado por: [`viewer/`](../viewer/AGENTS.md)
- → [`src/`](src/AGENTS.md) — componentes
- → [`test/`](test/AGENTS.md) — tests
- → [`examples/`](examples/AGENTS.md) · [`scripts/`](scripts/AGENTS.md) · [`.design-sync/`](.design-sync/AGENTS.md)
