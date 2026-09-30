# Design-sync notes — Negotiation Ring

## Known render warns

- `[FONT_REMOTE]` — the validator flags the Google Fonts `@import` in
  `dist/styles.css` (Bricolage Grotesque, IBM Plex Sans, IBM Plex Mono) as a
  remote font host it can't verify at build time. Legitimate: this is the
  package's documented font delivery mechanism (see the package README and
  the source `bundle.css`), not an accident. No local font files ship in
  the package.
- No other warns were produced by `package-validate.mjs` on the final run
  (`render check: 12/12 previews render cleanly`).

## Gotchas

- **`cfg.provider: {"component": "Root"}` already wraps every cell.** Every
  exported preview function is auto-mounted inside `<Root>` by the harness.
  The `Root.tsx` preview file still wraps its own two cells in an explicit
  `<Root theme="light">` / `<Root theme="dark">` on purpose — that's the only
  way to demonstrate the `theme` prop, and nesting `.nr-root` is harmless
  (same class, no compounding side effects).
- **`ChatMessage`'s left/right alignment is a flex-parent contract, not a
  standalone style.** `.nr-msg.us{align-self:flex-end}` only takes effect
  inside a `display:flex;flex-direction:column` ancestor — i.e. `.nr-chat`,
  per the source README ("Chat" section). My first pass rendered each
  `ChatMessage` cell standalone and every bubble (us and them) sat flush
  left, because `align-self` is a no-op outside a flex/grid item context. I
  found this by reading the first capture sheet: all four bubbles lined up
  at the same x position regardless of `side`. Fixed by wrapping each cell's
  message in a local `<div className="nr-chat">` (a `ChatFrame` helper in
  the preview file), matching how the component is meant to be composed.
  This was a preview-authoring bug, not a `ChatMessage` bug — the component
  itself has no default margin/alignment fallback and isn't supposed to.
- **Wide components need `cardMode:"column"` or the grid clips them.**
  `DataTable`, `Heatmap`, `OfferChart` and `KpiStrip` all overflow a 320px
  grid cell. Added `.design-sync/config.json → overrides.<Name>.cardMode =
  "column"` for all four (kept every other config key). `cardMode` is
  explicitly NOT part of the grade key (per `lib/emit.mjs`'s comment), so
  flipping it doesn't invalidate carried-forward grades.
- **Flag's "walk" chip looks pale at thumbnail scale.** On the review sheet
  thumbnail, the `Walk` flag chip (`se retira`) looked almost identical to
  the plain `Neutral` chip — I double-checked by sampling pixel colors from
  the PNG directly (`(248,230,223)` background, same as `Injection`'s
  `--warn-soft`), confirming the CSS (`.nr-flag.injection,.nr-flag.walk{...}`)
  is applied correctly. It's a legibility issue of the warn palette at small
  chip size, not a styling bug — graded "good" on the absolute rubric
  (styled correctly, distinguishable from neutral/decision/fallback at full
  zoom).

## Bugs found (reported, not patched — `src/` was left untouched)

- **`OfferChart.end` has no visual distinction between `kind:"deal"` and
  `kind:"walk"`.** The component only exposes `.deal-ring`/`.deal-label`
  (both hard-coded to `--ok`, green) for the closing marker regardless of
  `end.kind`. Passing `end={{ kind: "walk", ... }}` would render a green
  "success" ring around a walk-away point, which contradicts the design
  system's own semantic rule (`--ok` = deal/accept, `--warn` = walk/reject,
  from the source README's "Semantics are separate from sides" section). I
  avoided demoing this combination (the tournament preview cell omits `end`
  entirely) rather than showing a misleading render. This should be fixed
  in `OfferChart.tsx` (e.g. a `.walk-ring`/`.walk-label` pair using
  `--warn`) in a follow-up ticket, not silently patched here.

## Re-sync risks

- All 12 previews are hand-authored and markerless (no
  `// @ds-preview generated` line), so they are permanently "owned" —
  a future `package-build` run will never regenerate or overwrite them; any
  further design/content changes must be made by hand in
  `.design-sync/previews/*.tsx`.
- The grade contract is keyed to preview source + config slices
  (`sourceKeyFor`, per `.stories-map.json`). Any future edit to a preview
  file's body, or to `.design-sync/config.json`'s `overrides`/`provider`
  keys, will re-key the affected component(s) and clear their carried-forward
  grade — expect a one-time re-grade pass after such an edit.
- `cardMode` itself is excluded from the grade key by design, so toggling
  it on/off for `DataTable`/`Heatmap`/`OfferChart`/`KpiStrip` is safe and
  won't force a re-grade — but changing the underlying preview JSX
  (row/column data, wording) will.
- The `OfferChart.end`/walk-styling gap above means any future preview that
  demonstrates a walk-away closing point will render misleadingly (green
  ring) until the component itself is fixed — worth flagging to whoever
  picks up that ticket before it ships to Claude Design.
- `dist/` is gitignored in this package (see the package README); the
  design-sync bundle in `ds-bundle/` was built directly against the
  worktree's `dist/`, so any consumer of this sync must run `pnpm build`
  first if `dist/` isn't already present.

## Update (first sync, 2026-10-01)
- FIXED before upload: `OfferChart` now renders `.walk-ring`/`.walk-label` (`--warn`) when `end.kind === "walk"`, `.deal-ring`/`.deal-label` (`--ok`) otherwise. The two bullets above about the walk-styling gap are historical. No preview cell demonstrates a walk end yet — a good candidate for the next sync.
- Emitted `.d.ts` referenced helper types (TabItem, Match, KpiItem, OfferPoint, OfferChartEnd, ChatMessageFlag, DataTable/Heatmap row types) without defining them; `dtsPropsFor` inlines their shapes for Tabs, MatchSelector, KpiStrip, ChatMessage, OfferChart, DataTable, Heatmap. **Re-sync risk:** if those props change in `src/`, update `dtsPropsFor` too or the design agent codes against a stale contract.
- All components land in group `general` (no per-component docs with `category`). Regrouping would need `docsMap` stubs.
- Playwright pinned to 1.60.0 in `.ds-sync/` to match the cached chromium-1223.
