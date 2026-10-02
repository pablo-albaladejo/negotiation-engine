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
    <div className="nr-grid" style={{ "--nr-grid-cols": "minmax(0,1.55fr) minmax(320px,1fr)" }}>
      <Card title="Offers by round">{/* <OfferChart …/> + <Legend items={[{ kind: "us", label: "Our offers" }]} /> */}</Card>
      <Card title="Messages"><div className="nr-chat nr-chat-scroll"><ChatMessage side="them" round={2} offer={81} text="How about 81?" /></div></Card>
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
- **Heading size scale:** `nr-heading-sm` (16px) < `nr-heading` (18px, base — used by `Card`'s own title) < `nr-heading-lg` (22px, a screen's own `<h2>`). Keep screen content under a `Card` title at `nr-heading-lg` or lower.
- **Helper classes for your own text:** `nr-title` (26px app-shell title), `nr-muted` (caption), `nr-cfg` (mono config line), `nr-code-inline` (a short literal mixed into a sentence, monospace, no wrap — for a standalone/selectable snippet use `nr-code-box` instead), `nr-empty` (centered, narrow-measure body inside an empty-state `Card`). Wrap a list of `ChatMessage` in `<div className="nr-chat">` so bubbles align right for us and left for the rival; add `nr-chat-scroll` (560px max-height; `is-tall` for 820px) to cap that list's height instead of an inline `maxHeight`, or `nr-chat-projector` to scale the bubbles up for a projector view instead of a `transform: scale(...)` (which can clip).
- **Layout grids:** `nr-grid` is a responsive grid that reads its column ratio from the `--nr-grid-cols` custom property on the same element (e.g. `style={{ "--nr-grid-cols": "minmax(0,1.55fr) minmax(320px,1fr)" }}` -- in TS: as `React.CSSProperties`), defaulting to a single `minmax(0,1fr)` column; below 900px it always collapses to `minmax(0,1fr)` regardless of `--nr-grid-cols`, so content that can't wrap (a `nr-code-box`, a wide table) still shrinks instead of overflowing the page. Never set `gridTemplateColumns` inline on a `.nr-grid` element.
- **Literal snippets:** `nr-code-box` for a copy-command or similar literal text the user may select (monospace, horizontal scroll, no wrap). `nr-diff` (with `nr-diff-row`/`nr-diff-sign`) for a parameter diff list — a bordered box with one row per changed parameter and a muted sign column.
- **Colour meaning is fixed:**
  - `--us` (blue) is always our side and `--them` (amber) is always the rival. Never swap them or use them as decoration.
  - `--ok` means a deal, an accept or a better value. `--warn` means a walk, an injection or a worse value.
  - The ZOPA band (`zopa` on `OfferChart`) appears only in arena mode. In a tournament the rival's reservation is unknown: no `zopa` and no `theirReserve`.
- **Numbers use English format:** decimal point (`0.64`), `84%` with no space before the `%`, differences in `pp`. Use `formatNumber(v, { locale: "en" })` (`formatEsNumber` stays for backward compatibility with Spanish-locale consumers).
- **The rival's negotiation text is shown verbatim**, whatever language it is written in — it is never translated or altered. Config identifiers such as `calido-firme` are also shown verbatim, never translated.
- **The UI displays values and never computes them.** Every offer, decision and verdict is a value the engine logged, passed in as props.
- **Rival text goes only in `ChatMessage`'s `text` prop**, which renders as text. Never inject it as HTML.
- There are no icons and no emoji. State is shown with `Flag` (`neutral` `injection` `decision` `walk` `fallback`) and `Pill` (`verdict` `rejected` `sample` `champion` — `champion` reads green, like `verdict`, never blue).

## Components

`Root`, `Card`, `Tabs`, `MatchSelector`, `KpiStrip`, `ChatMessage`, `Flag`, `Pill`, `DataTable`, `Heatmap`, `OfferChart` + `Legend`, `StatFigure`, four button components, and five more for filtering, mode, two-issue offers, the live scoreboard and inline warnings:

- `Filters`: the filter bar above a match list — opponent select, role/outcome button groups (`role="group"` + `aria-pressed`, not an ARIA tablist: there is no tabpanel to switch), and checkboxes (`with injection`, `with fallback`). Controlled: every value and its `onChange` come from the host.
- `Legend`: always pass `items` (kinds: `us`, `them`, `target`, `estimate`, `zopa`, `reserve-us`, `reserve-them`, `same-round`, `mandate`); `children` render as plain text with no swatch, so a kind-less label never gets one.
- `Card`: `level` (2|3|4, default 3) picks the title's heading tag. A `Card` nests under the page's own `<h2>` at the default `level=3`; use `level={2}` only when the card itself is the top heading of a screen section, and never nest a `level={2}` card under another card's title.
- `ModeBadge`: a one-word badge, `ARENA` or `TOURNAMENT`, from the `mode` prop.
- `Scatter2D`: hand-written SVG for offers on two issues (e.g. discount % × payment day). It draws exactly the points, iso-utility curves and mandate polygon it is given — like `OfferChart`, it never computes a utility or a scale on its own beyond the linear pixel mapping. An optional `onPointClick({ side, round })` makes every offer point a roving, keyboard-reachable control: the chart is one tab stop, ArrowLeft/Right move between points ordered by round then side, Enter/Space activates the focused one. `OfferChart`'s own `onPointClick` follows the same pattern. Both carry the interactive role on a larger transparent hit circle (`r=12`, class `hit`) layered over the visible dot, so the click/focus target is bigger than what is drawn; the focus ring uses `stroke`, not `outline` (SVG circles don't get a reliable outline in Safari).
- `Scoreboard`: the large-type live header for the projector view — badge, `us vs rival`, round counter, attacks-blocked counter. `rivalPending` mutes the rival's name while waiting for the next match.
- `WarningBanner`: an alert block with a `tone` (`warn` or `info`), a `title` and arbitrary children.
- `Heatmap`: each row takes a `label` (preferred) or the older `rival` field — both optional, `label` wins when both are given; never invent a label when neither is logged.
- `StatFigure`: one large headline number (`value`, already formatted by the caller) with an accent `tone` (`us`/`them`) and an optional muted `caption` on the same row. Pass a caption only when the log actually has the comparison value to show — never invent one.
- `Tabs`: a button group with a `variant` prop (default `"group"` for toggle behavior with `aria-pressed`; `"nav"` renders a `<nav>` element with `aria-current="page"` on selected items).
- `PrimaryButton`, `SecondaryButton`, `BackLink`, `TableLink`: the only `<button>` elements in the system (`components/Button.tsx`) — every interactive control in a consuming app should use one of these instead of a raw `<button>`. `BackLink` is the low-key "go back" link, `SecondaryButton` is a bordered action (e.g. "Copy", "show all"), `PrimaryButton` is reserved for the one most important action in a panel, and `TableLink` is a link-styled `<button>` for a table cell that still needs click/keyboard semantics. `.nr-btn` and `.nr-btn-back` remain as deprecated aliases of `.nr-btn-secondary`/`.nr-link-back` for old consumers.

## Where the truth lives

- `styles.css`, which imports `_ds_bundle.css`, holds every `nr-*` rule and every token.
- Each component's API and usage: `components/*/<Name>/<Name>.d.ts` and `<Name>.prompt.md`.
