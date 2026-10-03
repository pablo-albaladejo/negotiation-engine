# design-system/src/ — Componentes React

Componentes reutilizables: botones, tablas, temas, utilidades.

## Propósito

Biblioteca base de UI. Componentes genéricos tipados, sin dependencias de negocio (sin conocimiento del motor, ring, etc.).

## Archivos

- **`index.ts`** — entrada pública: exporta cada componente (el visor la importa por alias).
- **`styles.css`** / **`tokens.css`** — estilos y tokens CSS (`--us`, `--them`, `--ok`, `--warn`…).
- **`format.ts`** — `formatNumber` y formato de cifras.
- **[`components/`](components/AGENTS.md)** — componentes React por familia.

## Cómo trabajar

```bash
pnpm --dir design-system build
pnpm --dir design-system test
```

## Links

- ↑ [`design-system/`](../AGENTS.md)
- → [`components/`](components/AGENTS.md)
