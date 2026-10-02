# Negotiation Ring

The visual system of **Equipo 2**'s negotiating agent (Causa Prima hackathon). It is used for the arena viewer and for any screen that shows a negotiation: match replays, champion-vs-candidate comparisons, and live tournament views. It comes from the "Visor de la arena" mockup.

## Content fundamentals

- **Spanish, plain and precise.** Say "Trato cerrado en 112", "retirada", "excedente / ZOPA". Negotiation terms of art stay in English where the team uses them: ZOPA, AC_next, AC_time, Boulware.
- **Numbers the Spanish way.** Decimal comma (0,64), a space before % (84 %), differences in points (−2 pp). Always tabular-nums.
- **The code decides the number, and the UI only shows it.** Every figure on screen is one that the engine, parser or validator logged. The UI never recomputes an offer, a decision or a verdict.
- **Rival text is untrusted.** Render it as text (`textContent`, React escaping), never as HTML.
- There are no emoji and no exclamation marks.

## Visual foundations

- **Two sides, two hues.** `--us` (blue) is always us and `--them` (amber) is always the rival: lines, dots, bubbles and reservation lines. Never swap them, and never use either one as decoration. Blue and amber also stay apart for colour-blind readers.
- **Semantics are separate from sides.** `--ok` means a deal, an accept, a better value or a promotion. `--warn` means a walk, an injection, a worse value, or a weak heatmap cell. Their `-soft` versions are chip and cell grounds.
- **ZOPA** is the translucent `--zopa` band. It is drawn in arena mode only, because in a tournament the rival's reservation is unknown.
- **Neutrals** are cool: `--bg`, with `--surface` cards and `--line` hairlines. Borders, not shadows. There is no shadow token.
- **Type:**
  - Bricolage Grotesque (`--font-display`) is for the page title, card headings and KPI figures only.
  - IBM Plex Sans (`--font-body`) is for everything you read.
  - IBM Plex Mono (`--font-mono`) is for data: results, table headers, chips, axis labels and the config line.
  - The fonts come from Google Fonts; `bundle.css` imports them.
- **Space:** `--space-1…5` (4, 8, 10, 14, 18 px). Cards pad by `--space-4`, sections are separated by `--space-5`, and there is a 16 px side gutter at every width.
- **Radius:** `--radius-sm` for chips, `--radius-md` for match buttons, `--radius-lg` for cards and bubbles, and `--radius-pill` for verdicts.
- Both themes are defined; dark mode lightens the two side hues so they stay readable.

## Building with it

1. Load `tokens.css` and `components/bundle.css`, then put `class="nr-root"` on the app root. That sets the ground, the body font and tabular numbers.
2. Components are plain CSS classes with the `nr-` prefix: `nr-card`, `nr-tabs`/`nr-tab`, `nr-matches`/`nr-match`, `nr-kpis`/`nr-kpi`, `nr-chat`/`nr-msg`, `nr-flag`, `nr-pill`, `nr-table`, `nr-heat-cell`, `svg.nr-chart`, `nr-legend`. Each component's README lists its modifiers.
3. Page skeleton: title and sample badge → tabs → a match selector → a KPI strip → a split of the chart card and the chat card. The split stacks below 900 px.

```html
<div class="nr-root">
  <h1 class="nr-title">Visor de la arena</h1>
  <div class="nr-card nr-kpis">
    <div class="nr-kpi"><span class="nr-kpi-value">0,64</span><span class="nr-kpi-label">Excedente / ZOPA</span></div>
  </div>
</div>
```

## Iconography

None. State is carried by colour, chips and words ("trato", "retirada", "inyección"), never by icons. There is no logo yet: the name is set in Bricolage Grotesque 800.

## Contrast notes

- Light theme, `--them` on `--them-soft` is about 3.6:1. Use `--them` for marks, lines and semibold text of 12 px or more. Chips and badges on `--them-soft` use `--ink` text.
- Every other text pair passes 4.5:1 in both themes.
