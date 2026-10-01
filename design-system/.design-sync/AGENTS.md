# design-system/.design-sync/ — Sincronización con Claude Design

Sistema de sincronización bidireccional: componentes React exportados al proyecto Claude Design (https://claude.ai/design/p/cdd2a1f7-6d46-4e13-92d2-b22d00a99e6c) con vista previa autorizada (`previews/`) y contrato tipado (`config.json`).

## Propósito

La carpeta `.design-sync/` contiene la configuración de sync con Claude Design:

- **`config.json`** — metadatos y contrato de sincronización.
- **`conventions.md`** — README en inglés que lee el agente Claude Design (cómo construir pantallas con la librería).
- **`NOTES.md`** — gotchas de sincronización, bugs reportados (no parchados), riesgos de re-sync.
- **`previews/*.tsx`** — celdas de vista previa autorizadas (una por componente: `Root`, `Card`, `Tabs`, `MatchSelector`, `KpiStrip`, `ChatMessage`, `Flag`, `Pill`, `DataTable`, `Heatmap`, `OfferChart`, `Legend`, `Filters`, `ModeBadge`, `Scatter2D`, `Scoreboard`, `WarningBanner`).

## Archivos clave

### `config.json`

```json
{
  "projectId": "cdd2a1f7-6d46-4e13-92d2-b22d00a99e6c",
  "shape": "package",
  "pkg": "@negotiation-ring/design-system",
  "globalName": "NegotiationRing",
  "buildCmd": "pnpm build",
  "cssEntry": "dist/styles.css",
  "provider": {"component": "Root"},
  "overrides": { /* cardMode:"column" para componentes anchos */ },
  "dtsPropsFor": { /* Tabs, MatchSelector, KpiStrip, ... */ },
  "readmeHeader": ".design-sync/conventions.md"
}
```

- **`projectId`** — referencia al proyecto Claude Design (pinned, nunca cambiar).
- **`pkg`** — nombre del paquete npm.
- **`globalName`** — espacio de nombres global en consumidores (e.g. `window.NegotiationRing.Root`).
- **`buildCmd`** — comando para compilar antes de sync.
- **`cssEntry`** — ruta a bundle CSS final.
- **`provider`** — `{"component": "Root"}` envuelve cada celda automáticamente.
- **`overrides`** — `cardMode:"column"` para `DataTable`, `Heatmap`, `OfferChart`, etc. (no invalida grados).
- **`dtsPropsFor`** — contrato tipado: shape de props para cada componente (inline, sin importar tipos helper).
- **`readmeHeader`** — `.design-sync/conventions.md`.

### `conventions.md`

README de construcción en inglés. Temas:

- **Setup**: envolver pantallas en `<Root>` (sets ground color, fonts, numbers tabulares).
- **Styling**: use props, tokens CSS (`--bg`, `--ink`, `--us`, `--them`, `--ok`, `--warn`, etc.), clases helper (`nr-title`, `nr-chat`, `nr-cfg`).
- **Semántica de color**: `--us` (blue) = nuestro lado, `--them` (amber) = rival. `--ok` = deal/accept, `--warn` = walk/reject. Nunca swappear.
- **Números**: formato inglés (`0.64`, `84%`), usar `formatNumber(v, {locale:"en"})`.
- **Rival text**: verbatim (nunca traducido ni alterado).
- **UI display-only**: no computa métricas, solo muestra valores.
- **17 componentes**: `Root`, `Card`, `Tabs`, `MatchSelector`, `KpiStrip`, `ChatMessage`, `Flag`, `Pill`, `DataTable`, `Heatmap`, `OfferChart`, `Legend`, `Filters`, `ModeBadge`, `Scatter2D`, `Scoreboard`, `WarningBanner`.

### `NOTES.md`

Gotchas y riesgos de re-sync (v2, 2026-10-01):

- **Render warns**: `[FONT_REMOTE]` en `dist/styles.css` (fuentes de Google — esperado y documentado).
- **Gotchas**:
  - `.provider: {"component":"Root"}` auto-envuelve cada celda. `Root.tsx` anida `<Root>` manualmente para demostrar el `theme` prop (harmless).
  - `ChatMessage` alignment requiere flex-parent (`.nr-chat`). No es una propiedad standalone.
  - Componentes anchos (`DataTable`, `Heatmap`, `OfferChart`, `KpiStrip`) usan `cardMode:"column"` (no invalida grados).
  - Flag "walk" se ve pálido a escala thumbnail (legibilidad de paleta warn, no bug).
- **Bugs reportados (no parchados)**:
  - `OfferChart.end` con `kind:"walk"` → FIXED en 2026-10-01: ahora usa `.walk-ring` (`--warn`) vs `.deal-ring` (`--ok`).
  - Helper types inline en `dtsPropsFor` → si props cambian en `src/`, actualizar `dtsPropsFor` también.
- **Re-sync risks**:
  - Previews marcadas como "owned" (no regenerables): cambios futuros → edit a mano en `previews/*.tsx`.
  - Editar preview JSX o keys en `config.json` → re-key y re-grade obligatoria.
  - `cardMode` excluido del grade key → safe sin re-grade. Pero cambiar JSX → re-grade.
  - `dist/` es gitignored: consumidores deben `pnpm build` primero.
  - Playwright pinned a 1.60.0 (matches chromium-1223).

### `previews/*.tsx`

17 celdas autorizada, una por componente. Estructura:

```tsx
export function Preview() {
  return (
    <OfferChart
      rounds={5}
      yDomain={[0, 100]}
      ourOffers={[...]}
      theirOffers={[...]}
    />
  );
}
```

Cada archivo: sin marcadores `// @ds-preview generated` (permanente owned).

## Archivos git-ignorados

(Fuera de control de versión)

- **`.cache/`** — grados locales (per worktree), `remote-sync.json`.
- **`ds-bundle/`** — bundle buildado para sync.
- **`.ds-sync/`** (root) — caché de sync.
- **`learnings/`** — analysis artifacts.

## Cómo re-sincronizar

1. Cambiar un componente en `src/` → editar preview en `.design-sync/previews/<Name>.tsx` e `config.json→dtsPropsFor`.
2. Desde Claude Code session en `design-system/`: `/design-sync` (comando integrado).
3. El proyecto Claude Design (projectId en `config.json`) se actualiza vía la plataforma.

**Invariante**: cambios de UI copy en inglés → sync seguro. Cambios de JSX de preview → expect re-grade. Playwright 1.60.0 pinned.

## Links

- ↑ [`design-system/`](../AGENTS.md) — paquete React
- ← Componentes: `src/` (componentes TS)
- → Claude Design: https://claude.ai/design/p/cdd2a1f7-6d46-4e13-92d2-b22d00a99e6c
- → Convenciones: [`conventions.md`](conventions.md)
- → Notas: [`NOTES.md`](NOTES.md)
- → Config: [`config.json`](config.json)
