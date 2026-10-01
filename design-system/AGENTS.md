# design-system/ — Componentes React

Paquete independiente: componentes React reutilizables (botones, tablas, temas). Publicable, versionado, separado del resto.

## Propósito

Biblioteca de componentes compartida entre visor y posibles otros clientes. Build: TypeScript + esbuild → CommonJS + ESM + types.

## Estructura

- **`src/`** — Código fuente (TypeScript, componentes React).
- **`test/`** — Tests.
- **`.design-sync/`** — Sincronización con herramienta de diseño (Figma, etc.).
- **`examples/`** — Ejemplos de uso.
- **`scripts/`** — Build scripts.
- **`package.json`** — Paquete independiente (`@negotiation-ring/design-system`).
- **`pnpm-lock.yaml`** — Lockfile específico.

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
- → [`test/`](test/) — tests
