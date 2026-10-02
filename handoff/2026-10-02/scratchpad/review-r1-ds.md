# Deep review R1 — DS fidelity findings (range 51859c9..ee156a9)

## Major
1. DS changes not reflected in design-system/.design-sync previews/conventions: add previews for StatFigure (+ AGENTS.md list), Pill kind="champion", Heatmap rowHeader="Opponent", DataTable clickable+selected row, Scatter2D onPointClick, Scoreboard rivalPending; document .nr-grid, .nr-code-box, .nr-diff* in .design-sync/conventions.md.
2. TwoIssueScreen.tsx:136-141 Legend passes plain spans → no swatches. Add LegendItem kinds `same-round` (`border-top:1px solid var(--muted)`) and `mandate` (`height:10px;border:1px dashed var(--us);background:var(--us-soft)`) to DS and use `items` (mandate only when present).
3. Page h2 must be 22px (reference: nr-heading + font-size 22px). Add DS `.nr-heading-lg{font-family:var(--font-display);font-size:22px;font-weight:700;margin:0}` and use for page h2 in RunsScreen:60, MatchesScreen:100, TournamentReplayScreen:85, GateScreen:124, StatesScreen:15, ui/replay-header.tsx:26.
4. Move PrimaryButton/SecondaryButton/BackLink/TableLink into design-system/src/components/Button.tsx, export from DS index; viewer/src/ui/buttons.tsx re-exports them (keep viewer imports working).

## Minor
5. Keep deprecated aliases `.nr-btn` (= .nr-btn-secondary) and `.nr-btn-back` (= .nr-link-back) by duplicating selectors.
6. `.nr-pill.champion` should be green like verdict: `background:var(--ok-soft);color:var(--ok)`.
7. Selected row distinct from hover: `.nr-table tr.is-selected{background:var(--us-soft);box-shadow:inset 3px 0 0 var(--us)}`.
8. StatFigure layout: number + muted caption on one row (`display:flex;align-items:baseline;flex-wrap:wrap;gap:var(--space-3);margin:var(--space-2) 0 var(--space-3)`); Tournament passes a caption only if the log has the comparison data (otherwise none — never invent).
9. `.nr-grid` without !important: `grid-template-columns:var(--nr-grid-cols,1fr)`; media <900px sets 1fr; screens pass `--nr-grid-cols` custom property instead of inline gridTemplateColumns.
10. ArenaReplay grid ratio = reference `minmax(0,1.55fr) minmax(320px,1fr)`.
11. Chat cards: DS `.nr-chat-scroll{overflow:auto;max-height:560px;margin-top:var(--space-3);padding-right:var(--space-1)}` (tournament variant max-height 820px) instead of inline maxHeight 80vh.
12. Tournament header: reuse ReplayHeader (BackLink on its own line above, badge slot). Fields only if logged.
13. LiveScreen inline type styles → DS classes `.nr-live-stat-value`, `.nr-live-stat-label`, `.nr-live-headline`, `.nr-live-waiting`.
14. LiveScreen chat `transform: scale(1.6)` can clip; replace with a DS projector modifier `.nr-chat-projector .nr-msg{font-size:…;padding:…}` (no zoom, no transform).
15. ui/states.tsx inline styles → DS `.nr-code-inline{font-family:var(--font-mono);color:var(--ink);white-space:nowrap}` and `.nr-empty{…}`.
16. Scatter2D focus-visible: `outline:none;stroke:var(--ink);stroke-width:2.5` (Safari).
17. Gate header: BackLink gap consistent with ReplayHeader.

## Nit
18. GateScreen.tsx:166 diff sign: ASCII `-` not U+2212.
19. HeatmapRow: add `label` alias, keep `rival`.
20. Heatmap.tsx:83 inline textAlign → `.nr-heat th:not(:first-child){text-align:center}`.
21. LiveScreen.tsx:96 redundant inline color on BackLink; states.tsx:61 .nr-heading-sm → document size scale (sm16/base18/lg22) in conventions.md.

## A11y items that belong to DS/styles (from a11y reviewer)
D1. (supersedes #9) .nr-grid: `grid-template-columns:var(--nr-grid-cols,minmax(0,1fr))`; <900px `minmax(0,1fr)` (NOT plain 1fr — prevents overflow from nowrap code boxes/wide tables); no !important; update test/responsive.test.ts to assert minmax(0,1fr).
D2. Theme on <html>: set document.documentElement.dataset.theme in toggle + inline pre-paint script in viewer/index.html (try/catch localStorage "nr-theme" key — use whatever key theme.ts uses); `html,body{margin:0;background:var(--bg);color-scheme:light dark}`, `[data-theme=light]{color-scheme:light}`, `[data-theme=dark]{color-scheme:dark}`; make sure token selectors work when user picks light on a dark OS.
D3. LiveScreen: visible "Exit projector mode (Esc)" SecondaryButton in projector mode; Esc ONLY exits projector mode (no longer leaves the screen); leaving requires the BackLink click. Update tests.
D4. Scatter2D: roving tabindex — chart is ONE tab stop, ArrowLeft/Right move by round (ordered by round then side), Enter/Space select; R{n} text labels aria-hidden; larger transparent hit circle r=12 carrying role/handlers; focus ring via stroke (see #16). Apply the same keyboard pattern to OfferChart points if it has onClick (svg role group when interactive).
D5. DataTable: use aria-current="true" for selected row instead of aria-selected (invalid on plain table); remove dead `.nr-table-row-clickable:focus-visible`.
D6. .nr-link-back,.nr-link-table{min-height:24px;padding:2px 0}.
D7. .nr-live-corner-back opacity .6, outside scaled canvas; reduced-motion: transition none.
D8. Card: `level` prop (default 3) for title heading; page titles h2 (with .nr-heading-lg).
D9. Theme toggle: fixed label + aria-pressed; follow OS changes via matchMedia change listener only when no stored choice.
