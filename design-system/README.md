# @negotiation-ring/design-system

React component library of the **Negotiation Ring** design system, by
**Team 2** (Causa Prima hackathon). It brings together in code the tokens and
the `nr-*` CSS classes already defined for the arena viewer: match replays,
champion vs candidate comparisons and live tournament views.

This package is the source that `/design-sync` will use to publish the system
to Claude Design; the shape of `examples/` is what that flow will use to
generate the previews.

## Installation and usage

```bash
pnpm add @negotiation-ring/design-system
```

Import the stylesheet once (it brings the Google Fonts, the
colour/typography/spacing tokens and the classes of each component) and
wrap the application in `<Root>`, which sets the background, the body
typography and tabular numbers:

```tsx
import "@negotiation-ring/design-system/styles.css";
import { Root, Card, KpiStrip } from "@negotiation-ring/design-system";

function App() {
  return (
    <Root theme="light">
      <Card title="Offers per round">
        <KpiStrip items={[{ label: "Surplus / ZOPA", value: "0.64" }]} />
      </Card>
    </Root>
  );
}
```

`theme` accepts `"light"` or `"dark"` and is translated into the
`data-theme` attribute of the root container. Without `theme`, the theme follows the
operating system preference (`prefers-color-scheme`).

## Components

| Component | Props | What it is |
| --- | --- | --- |
| `Root` | `RootProps` | App root container (`div.nr-root`), sets background, typography and theme. |
| `Card` | `CardProps` | The only container: bordered surface with optional title and footer. |
| `Tabs` | `TabsProps` | Group of buttons/tabs: `role="group"` + `aria-pressed`; `variant="nav"` → `<nav>` + `aria-current="page"`. |
| `MatchSelector` | `MatchSelectorProps` | Row of matches to pick which one to replay (`aria-pressed`). |
| `KpiStrip` | `KpiStripProps` | Strip of key figures above the chart. |
| `ChatMessage` | `ChatMessageProps` | One turn of the negotiation as a bubble (`us` / `them`). |
| `Flag` | `FlagProps` | Mono chip on a message: what the parser, the engine or the validator recorded. |
| `Pill` | `PillProps` | Rounded label for a final state (verdict, rejection, sample). |
| `DataTable` | `DataTableProps` | Metrics table with numeric columns and better/worse variation. |
| `Heatmap` | `HeatmapProps` | Surplus/ZOPA heatmap by rival × role, built on `DataTable`. |
| `OfferChart` | `OfferChartProps` | Hand-drawn SVG with the offers per round; it only draws what it is given. `planned` (optional) adds our expected path as a dashed line. |
| `Legend` | — | Legend that always accompanies `OfferChart`. |
| `Filters` | `FiltersProps` | Controlled filter bar: rival, role, result and checkboxes. |
| `ModeBadge` | `ModeBadgeProps` | `ARENA` / `TOURNAMENT` badge according to the mode. |
| `Scatter2D` | `Scatter2DProps` | Hand-drawn SVG for offers on two issues (X axis / Y axis); it only draws what it is given. |
| `Scoreboard` | `ScoreboardProps` | Live projector header: teams, round and blocked attacks. |
| `WarningBanner` | `WarningBannerProps` | Inline notice with tone (`warn` / `info`), title and free content. |

Each component exports its props interface (`<Name>Props`) from
`src/index.ts`. The realistic usage examples, in English (the viewer's interface language), are in `examples/`, one per component grouped by family (`layout/`, `controls/`, `charts/`, `data/`, like `src/components/`), plus
`examples/ViewerScreen.tsx`, which composes the viewer's full screen:
tabs, match selector, KPI strip and, below, the chart card
next to the chat one.

## Brand rules

- **English, clear and precise, in the viewer interface.** "Deal closed at
  112", "walk away", "surplus / ZOPA". The team's technical terms
  stay in English: ZOPA, AC_next, AC_time, Boulware. The rival's text is
  shown as is, in whatever language it arrives; configuration identifiers
  (e.g. `calido-firme`) are also shown as is, untranslated.
- **Numbers in English format.** Decimal point (0.64), no space before
  the `%` (84%), differences in points (−2pp), always with `tabular-nums`.
  Use `formatNumber(v, { locale: "en" })`; `formatEsNumber` is kept
  for compatibility with Spanish-language consumers.
- **The code decides the number; the interface only shows it.** No
  component computes an offer, a decision or a verdict. The only
  exception is the formatting of the Spanish decimal comma (`formatEsNumber`).
- **The rival's text is untrusted.** It is always rendered as React text
  (children), never with `dangerouslySetInnerHTML`; the package does not use it
  anywhere (a test checks it with a grep).
- **Two sides, two tones.** `--us` (blue) is always us; `--them`
  (amber) is always the rival. They are never swapped or used as
  decoration.
- **Semantics are independent of the sides.** `--ok` is deal, accept,
  better value or promotion. `--warn` is withdrawal, injection, worse value or
  a weak heatmap cell.
- **The ZOPA** is the translucent `--zopa` band, and is only drawn in arena
  mode: in a tournament the rival's reserve is unknown.
- No emoji, no exclamation marks, no iconography: state is conveyed
  with colour, chips and words.

## Build

```bash
pnpm install
pnpm build      # dist/index.js (ESM), dist/index.cjs, dist/styles.css, dist/index.d.ts
pnpm test       # vitest
pnpm typecheck  # tsc --noEmit
```

`dist/` is not versioned in this repository: it is generated with `pnpm build` and,
if `/design-sync` needs the already-compiled artefacts, they are built in
that step instead of being committed.
