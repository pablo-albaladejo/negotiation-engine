# design-system/src/components/charts/ — SVG charts

Presentation components: they display values, they do not compute metrics. Exported from `../../index.ts`.

## Files

- **`OfferChart.tsx`** — `OfferChart` and `Legend`: offer curve per round (ours, the rival's, reserves, final); optional: `planned` (our planned path), `predicted` (the rival's predicted path with a band), their limit with a band (`theirLimit`) and the walk-away round (`walkMarker`).
- **`Scatter2D.tsx`** — `Scatter2D`: offers on two axes with isolines, mandate and deal.
- **`Heatmap.tsx`** — `Heatmap` and `heatmapBand`: heat map by rows and columns.

## Links

- ↑ [`components/`](../AGENTS.md)
- → Examples: [`examples/charts/`](../../../examples/charts/AGENTS.md)
