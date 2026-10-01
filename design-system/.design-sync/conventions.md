# Negotiation Ring: how to build with it

Screens for a negotiating agent: match replays, champion-vs-candidate comparisons, and live tournament views. The copy is in English.

## Setup

Wrap every screen in `Root` (`window.NegotiationRing.Root`). It sets the page ground (`--bg`), the IBM Plex Sans body font and tabular numbers. Without it, text falls back to browser defaults and numbers stop aligning. Use `theme="dark"` for dark mode. The tokens themselves are always on `:root`.

```jsx
const { Root, Card, KpiStrip, OfferChart, Legend, ChatMessage, Flag } = window.NegotiationRing;
<Root>
  <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px var(--gutter)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
    <h1 className="nr-title">Arena viewer</h1>
    <KpiStrip items={[{ label: "Result", value: "Deal", tone: "deal" }, { label: "Surplus / ZOPA", value: "0.64" }]} />
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.35fr) minmax(0,1fr)", gap: "var(--space-4)" }}>
      <Card title="Offers by round">{/* <OfferChart …/> + <Legend>…</Legend> */}</Card>
      <Card title="Messages"><div className="nr-chat"><ChatMessage side="them" round={2} offer={81} text="How about 81?" /></div></Card>
    </div>
  </div>
</Root>
```

## Styling idiom

- **Components are styled through their props**, not through classes you add. For layout glue, use `style` with the tokens:
  - Colours: `var(--bg)` `--surface` `--ink` `--muted` `--line` `--us` `--us-soft` `--them` `--them-soft` `--ok` `--ok-soft` `--warn` `--warn-soft` `--zopa`
  - Spacing: `--space-1`…`--space-5` (4, 8, 10, 14, 18 px) and `--gutter` (16 px)
  - Radius: `--radius-sm` `--radius-md` `--radius-lg` `--radius-pill`
  - Fonts: `--font-display` `--font-body` `--font-mono`
- **Helper classes for your own text:** `nr-title` (page title), `nr-heading` (card heading), `nr-muted` (caption), `nr-cfg` (mono config line). Wrap a list of `ChatMessage` in `<div className="nr-chat">` so bubbles align right for us and left for the rival.
- **Colour meaning is fixed:**
  - `--us` (blue) is always our side and `--them` (amber) is always the rival. Never swap them or use them as decoration.
  - `--ok` means a deal, an accept or a better value. `--warn` means a walk, an injection or a worse value.
  - The ZOPA band (`zopa` on `OfferChart`) appears only in arena mode. In a tournament the rival's reservation is unknown: no `zopa` and no `theirReserve`.
- **Numbers use English format:** decimal point (`0.64`), `84%` with no space before the `%`, differences in `pp`. Use `formatNumber(v, { locale: "en" })` (`formatEsNumber` stays for backward compatibility with Spanish-locale consumers).
- **The rival's negotiation text is shown verbatim**, whatever language it is written in — it is never translated or altered. Config identifiers such as `calido-firme` are also shown verbatim, never translated.
- **The UI displays values and never computes them.** Every offer, decision and verdict is a value the engine logged, passed in as props.
- **Rival text goes only in `ChatMessage`'s `text` prop**, which renders as text. Never inject it as HTML.
- There are no icons and no emoji. State is shown with `Flag` (`neutral` `injection` `decision` `walk` `fallback`) and `Pill` (`verdict` `rejected` `sample`).

## Components

`Root`, `Card`, `Tabs`, `MatchSelector`, `KpiStrip`, `ChatMessage`, `Flag`, `Pill`, `DataTable`, `Heatmap`, `OfferChart` + `Legend`, and five more for filtering, mode, two-issue offers, the live scoreboard and inline warnings:

- `Filters`: the filter bar above a match list — opponent select, role/outcome tabs, and checkboxes (`with injection`, `with fallback`). Controlled: every value and its `onChange` come from the host.
- `ModeBadge`: a one-word badge, `ARENA` or `TOURNAMENT`, from the `mode` prop.
- `Scatter2D`: hand-written SVG for offers on two issues (e.g. discount % × payment day). It draws exactly the points, iso-utility curves and mandate polygon it is given — like `OfferChart`, it never computes a utility or a scale on its own beyond the linear pixel mapping.
- `Scoreboard`: the large-type live header for the projector view — badge, `us vs rival`, round counter, attacks-blocked counter.
- `WarningBanner`: an alert block with a `tone` (`warn` or `info`), a `title` and arbitrary children.

## Where the truth lives

- `styles.css`, which imports `_ds_bundle.css`, holds every `nr-*` rule and every token.
- Each component's API and usage: `components/*/<Name>/<Name>.d.ts` and `<Name>.prompt.md`.
