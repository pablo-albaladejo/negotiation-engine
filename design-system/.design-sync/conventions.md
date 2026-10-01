# Negotiation Ring: how to build with it

Screens for a negotiating agent: match replays, champion-vs-candidate comparisons, and live tournament views. The copy is in Spanish.

## Setup

Wrap every screen in `Root` (`window.NegotiationRing.Root`). It sets the page ground (`--bg`), the IBM Plex Sans body font and tabular numbers. Without it, text falls back to browser defaults and numbers stop aligning. Use `theme="dark"` for dark mode. The tokens themselves are always on `:root`.

```jsx
const { Root, Card, KpiStrip, OfferChart, Legend, ChatMessage, Flag } = window.NegotiationRing;
<Root>
  <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px var(--gutter)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
    <h1 className="nr-title">Visor de la arena</h1>
    <KpiStrip items={[{ label: "Resultado", value: "Trato", tone: "deal" }, { label: "Excedente / ZOPA", value: "0,64" }]} />
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.35fr) minmax(0,1fr)", gap: "var(--space-4)" }}>
      <Card title="Ofertas por ronda">{/* <OfferChart …/> + <Legend>…</Legend> */}</Card>
      <Card title="Mensajes"><div className="nr-chat"><ChatMessage side="them" round={2} offer={81} text="¿Qué te parece 81?" /></div></Card>
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
- **Numbers use Spanish format:** decimal comma (`0,64`), `84 %`, differences in `pp`. `formatEsNumber` is exported for this.
- **The UI displays values and never computes them.** Every offer, decision and verdict is a value the engine logged, passed in as props.
- **Rival text goes only in `ChatMessage`'s `text` prop**, which renders as text. Never inject it as HTML.
- There are no icons and no emoji. State is shown with `Flag` (`neutral` `injection` `decision` `walk` `fallback`) and `Pill` (`verdict` `rejected` `sample`).

## Where the truth lives

- `styles.css`, which imports `_ds_bundle.css`, holds every `nr-*` rule and every token.
- Each component's API and usage: `components/*/<Name>/<Name>.d.ts` and `<Name>.prompt.md`.
