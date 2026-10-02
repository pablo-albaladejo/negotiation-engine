# Deep review R2 — correctness/tests (range 51859c9..a172cad). R1 verified 40/41.

## Major
C1. viewer/src/App.tsx:311-322 — L27 focus effect runs on [hash]; replaceRoute (T2) calls setHash, so every filter/page change moves focus to the h2, and it cancels L24 (Clear filters focus). Split: document.title effect on [route.screen]; focus effect only on real navigations (navKey from hashchange/navigate, skip first paint); focus the h2 once the screen has rendered (screen-level is sturdier if h2 appears after data loads). Add App-level test: click Buyer tab → focus stays on it; Clear filters → focus on the count.
C2. Tournament Result: binding records only the OPPONENT's move. When our engine accepts/walks, there's no binding. Adapter (model/tournamentReplay.ts ~579): outcome = last logged binding outcome ?? (last decision.action === "accept" → {kind:"agreement", by:"agent", offer: last.rivalOffer}) ?? ("walk" → {kind:"walk", by:"agent"}) ?? null. Screen: agreement → "Deal"; walk by agent → "We walked", by rival → "Opponent walked". Final offer on our accept = the opponent's logged offer. Tests for our accept and our walk.
C3. TournamentReplayScreen.tsx:81 — `us: offerValue(p.ourOffer) ?? "accept"` invents data. Use decision.action accept/walk when logged, else "not logged".

## Minor
C4. App.tsx:262-277 — after T9 cache, one render pairs new game with previous trace. Store trace with its gameId ({gameId, data}); show LoadingCard until trace.gameId === gameId (and games belong to current runId).
C5. MatchesScreen.tsx:397-399 — T8 cleanup goes through setFilters → resets page to 0 and triggers replaceRoute. Strip `injection` in the container before mounting (when games arrive) so `p=` is kept.
C6. DecisionPanel.tsx:812-814 — if selectedRound isn't in the rounds list, indexOf = -1 disables both buttons. prev = last round < selected; next = first round > selected.
C7. ui/match-selector.tsx — use `game.protocolViolation?.by ?? game.metrics?.protocolViolation ?? null` like the table/KPI.
C8. GateScreen.tsx:90 — mixed units (decimal share vs "+3.00 pp"): name the unit in the row label/caption, e.g. "Avg. surplus / ZOPA (share; change in pp)". Don't convert values.

## Nit
C9. LiveScreen.tsx:253,265 — "3/not logged" and "Session not logged": show `${round}/${limit}` only when limit known, else just round; drop the session part of the headline when sessionId is null.
C10. viewer/test/ui/app.test.tsx:126 — remove manual HashChangeEvent dispatch (jsdom fires it).
C11. Add a top-level error boundary in App.tsx rendering the DS error state (EmptyStateCard/WarningBanner) instead of a blank page on render errors.
