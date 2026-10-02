# Review of design-alignment (c83d348..5eaab05) — correctness + tests

## Major
X1. Utility uses the wrong field: live.ts:73, twoIssue.ts:105, TournamentReplayScreen.tsx:82, TwoIssueScreen.tsx:74 read last explain.uOffer (= ourNextUtility, src/engine/engine.ts:181), not the deal's utility. Derive in the model from who closed: we accepted their offer → uRival of that round; they accepted ours → uOffer of the round we made that offer; not found → null ("not logged"); walk → "—". Affects Live utility, "Deal at X · utility Y", tournament/two-dim Utility KPIs, "→ 0.63" marker.
X2. Tournament "Price" (TournamentReplayScreen.tsx:79/~131) falls back to our last offer on a walk. Price only when outcome is agreement (else "—"; unknown outcome → "not logged").
X3. "AC_next" hardcoded for every accept (chat-flags.ts:16, ArenaReplayScreen.tsx:65, TournamentReplayScreen.tsx:93, TwoIssueScreen.tsx:70,:74, LiveScreen.tsx:73). Use the logged decision.rule (e.g. acTime); when the RIVAL accepted our offer, label "deal at {price}" without a rule.
X4. find.ts:40,:64 — stale remembered arena/two-issue match never validated; validate run exists and game exists, else fall back.
X5. App.tsx:378 — Two dimensions tab redirects to an arena-replay route so aria-current/title land on "Replay · arena" (and vice versa). Carry `view=two-issue` (or similar) so the active tab follows the tab chosen / the game type.
X6. App.tsx:331 FindContainer and :284 tournament Promise.all — no .catch: failed fetch = loading forever; summary fetch failure hides a good trace. Add catches → empty/error state; summary failure → summary null.

## Minor
X7. find.ts:39-48,:63-72 — avoid downloading every run per tab click: try lastViewed.run() first; cap N runs.
X8. find.ts:33 — Matches must skip tournament runs / runs with no summary.
X9. find.ts:56 — most recent session numeric-aware sort (s-10 > s-9) or by header timestamp.
X10. LiveScreen.tsx:78 utility on a walk "—"; TwoIssueScreen.tsx:94 Within mandate "—" when not an agreement.
X11. GateScreen.tsx:145 "same seeds" hardcoded — derive from gate.json seeds; per-side game counts ("each") in gateModel; "not logged" when missing.
X12. DecisionPanel.tsx:47-50 AC_next "Engine log" hardcoded "not logged" while Status shows acNext — show logged uRival vs uOffer − acceptMargin, or "—".
X13. chat-flags.ts:19 target raw float — format 1 decimal (formatNumber en).
X14. TournamentReplayScreen.tsx:126 restore `config v{configVersion}` in the cfg line; remove unused required onBack prop.
X15. TwoIssueScreen.tsx:90 roleLabel ("Seller") not raw role.

## Missing tests (add real assertions)
1-3 chat-flags.test.ts: agent counter flags (target/est. reserve/rule), accept with rule acTime + price, rival injection → [injection, quarantined]; p3 renders "quarantined".
4 chart.test.ts arenaChartCaption cases (normal / empty ZOPA / not logged).
5 p3 arena KPIs Price (deal/walk "—"), Role · reserve, Injections count + walk tone.
6 end-marker labels arena + tournament (deal at / R{n} · walk / none).
7 decision-panel Status column flags; no "Rule" row.
8 models.test twoIssue mandateLine, withinMandate true/false/null, utility null without explain.
9 p5 Within mandate Yes/No/not logged, region label, deal label, cfg mandate.
10 models.test matchesModel agreement/zopaEmpty/injectionSuspected, kpis emptyZopaCorrect null, durationMs.
11 p2 Price "—", Outcome Flag, Incidents Flags (no "clean"), KPIs Empty ZOPA detected/Duration, cfg line.
12 labels.test formatRunDate(null/garbage), configParamsLine(undefined), matchConfigLine missing parts, priceLabel(null).
13 find.test stale arena/two-issue/run fallbacks.
14 app.test Two dimensions keeps aria-current.
15 app.test find redirect history (replace, back works), PageTitle focus, failed runs fetch → error/empty state.
16 tournament summary null / rejected → still renders; no ZOPA/Their reserve.
17 live.test outcomeOf utility on accept of rival offer = that round's uRival.
18 viewer arena legend lists Injection and Close (+ persona if logged).

## Fidelity/a11y review (47/52 verified)
F1 [major] Sticky header hides focused elements (WCAG 2.4.11): add `html{scroll-padding-top: <header height + space-2>}` in DS styles (or measured CSS var), handle wrapped header on narrow screens.
F2 roleLabel for raw role in TwoIssue KPI (TwoIssueScreen.tsx:110), sub line (:90) and Live headline (LiveScreen.tsx:95).
F3 States "Run with no matches": wrap EmptyStateCard in a Card titled "Run with no matches" with inner h3 (StatesScreen.tsx:69).
F4 S7: pass skippedMatchId to the real InvalidLogBanner (RunsScreen.tsx:74 etc.) if ApiError can carry it; otherwise leave.
F5 Arena legend conditional: only items the chart draws (reserves logged, ZOPA, injections present, end marker present) (ArenaReplayScreen.tsx:143-154).
F6 Chat highlight by round AND side of the clicked point (Arena :173, Tournament :198); design d:618 selSide.
F7 DecisionPanel round counter: visible "R5 / 8" aria-hidden + sr-only "Round 5 of 8" inside the live region (DecisionPanel.tsx:101).
F8 Layout max-width 1400px and main padding `var(--space-5) var(--gutter) 48px` (App.tsx:387,408; d:24,35).
F9 Gate heatmap title without "· {phase}" (GateScreen.tsx:162).
F10 States: single determinate Loading card (StatesScreen.tsx:70-71).
F11 Matches title row flexWrap wrap; champion Pill per design (`verdict` look — our `champion` kind is already green like verdict; keep kind but ensure identical look).
