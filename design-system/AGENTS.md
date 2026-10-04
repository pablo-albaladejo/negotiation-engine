# design-system/ — React components

Independent package: reusable React components (buttons, tables, themes). Publishable, versioned, separate from the rest.

## Purpose

Component library shared between the viewer and possible other clients. Build: TypeScript + esbuild → CommonJS + ESM + types.

## Structure

- **[`src/`](src/AGENTS.md)** — source code; public entry point `src/index.ts` (the viewer uses it via alias, without a build).
- **[`test/`](test/AGENTS.md)** — only `no-dangerous-html` (no injected HTML).
- **[`.design-sync/`](.design-sync/AGENTS.md)** — Sync with Claude Design (previews, config, conventions).
- **[`examples/`](examples/AGENTS.md)** — usage examples per family.
- **[`scripts/`](scripts/AGENTS.md)** — build.
- **`README.md`**, **`package.json`**, **`pnpm-lock.yaml`**, `tsconfig.json`, `vitest.config.ts` — independent package (`@negotiation-ring/design-system`) and its configuration.

## Build

```bash
pnpm --dir design-system build   # generates dist/
```

Outputs:
- **`dist/index.js`** — ESM.
- **`dist/index.cjs`** — CommonJS.
- **`dist/index.d.ts`** — TypeScript types.
- **`dist/styles.css`** — compiled CSS.

## How to work

```bash
# Install dependencies
pnpm --dir design-system install

# Build
pnpm --dir design-system build

# Tests
pnpm --dir design-system test

# TypeScript
pnpm --dir design-system typecheck
```

## Invariants

- **Independent**: can be published to npm without the rest of the project.
- **React peer versions**: `react@^18.3.0`, `react-dom@^18.3.0`.
- **No business dependencies**: generic components only.

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
- → Used by: [`viewer/`](../viewer/AGENTS.md)
- → [`src/`](src/AGENTS.md) — components
- → [`test/`](test/AGENTS.md) — tests
- → [`examples/`](examples/AGENTS.md) · [`scripts/`](scripts/AGENTS.md) · [`.design-sync/`](.design-sync/AGENTS.md)
