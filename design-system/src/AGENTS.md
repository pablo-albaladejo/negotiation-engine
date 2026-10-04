# design-system/src/ — React components

Reusable components: buttons, tables, themes, utilities.

## Purpose

Base UI library. Generic typed components with no business dependencies (no knowledge of the engine, ring, etc.).

## Files

- **`index.ts`** — public entry point: exports every component (the viewer imports it by alias).
- **`styles.css`** / **`tokens.css`** — styles and CSS tokens (`--us`, `--them`, `--ok`, `--warn`…).
- **`format.ts`** — `formatNumber` and number formatting.
- **[`components/`](components/AGENTS.md)** — React components by family.

## How to work

```bash
pnpm --dir design-system build
pnpm --dir design-system test
```

## Links

- ↑ [`design-system/`](../AGENTS.md)
- → [`components/`](components/AGENTS.md)
