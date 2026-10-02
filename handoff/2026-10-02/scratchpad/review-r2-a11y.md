# Deep review R2 — a11y/UX (range 51859c9..a172cad). R1 a11y verified 14/16; M1/M2 (focus) are being fixed in the logic task (C1).

## Major
A1. App.tsx:247-253 + LiveScreen.tsx:86 — InvalidLogBanner on Live is painted under the fixed full-screen canvas. Render it in a fixed dark Root overlay (left/right/bottom 16px, z-index above the canvas) — use a DS class, not inline magic numbers where possible.

## Minor
A2. Scatter2D.tsx:95,233 + OfferChart.tsx:133,253 — roving tab stop: clamp activeIndex to the points length; accept optional `selectedRound` prop so the tab stop starts at the selected round and `aria-pressed` marks it. Pass selectedRound from TwoIssue/ArenaReplay/Tournament.
A3. DecisionPanel.tsx:81-86 — disabling the focused Prev/Next drops focus. Use aria-disabled + ignore click; DS CSS `.nr-btn-secondary[aria-disabled=true]{opacity:.5;cursor:not-allowed}` (Button component may accept aria-disabled already via spread).
A4. LiveScreen.tsx:102-114 — one stable toggle button with aria-pressed and changing label ("Projector mode" / "Exit projector mode (Esc)") instead of swapping elements.
A5. Live should force dark on <html> while on the live screen: `document.documentElement.dataset.theme = route.screen === "live" ? "dark" : theme`.
A6. MatchesScreen.tsx:160-166 — one always-mounted sr-only role=status live region: "No matches for these filters" or the count text. Remove aria-live from the page indicator (avoid double announcements).
A7. ArenaReplayScreen.tsx:99, TournamentReplayScreen.tsx:116 — sticky chart only ≥900px: DS `@media (min-width:900px){.nr-sticky-wide{position:sticky;top:var(--space-4)}}`; remove inline sticky.
A8. Charts touch target on mobile: hit radius scales with rendered width (min 12 viewBox units, ≥24px rendered) or rely on DecisionPanel buttons — implement the scaling if simple (ResizeObserver/clientWidth), else document.
A9. App.tsx:101,137,138,191,213 — "not available"/fetch failure shows an endless LoadingCard. Show EmptyStateCard / WarningBanner with the literal missing file instead; LoadingCard only while actually loading.
A10. Filters.tsx:57,74 + Tabs.tsx:14 — toggle groups use role=tablist without tabpanels: use `role="group" aria-label="Role"/"Outcome"` + `aria-pressed` on buttons; header navigation: `<nav aria-label="Viewer">` with aria-current="page". DS change → update DS tests and previews/conventions.
A11. LiveScreen — add `<h1 className="nr-sr-only">Live match</h1>`.

## Nit
A12. DecisionPanel.tsx:63,99 wording → "No trace logged for this match (…)"; "no reason logged" ok → keep consistent "not logged".
A13. GateScreen sentence-case "Not logged (gate.json v1)." is fine as a full sentence (keep).
