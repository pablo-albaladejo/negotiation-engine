# Deep review R1 — viewer logic fixes (correctness + a11y-in-viewer), range 51859c9..ee156a9

## Correctness (major)
L1. viewer/src/ui/labels.ts:24-26 — protocol-violation always "Opponent error" but protocolViolation.by can be "agent". resultLabel(endReason, violationBy?): rival → "Opponent protocol violation", agent → "Our protocol violation", unknown → "Protocol violation". Callers pass line.protocolViolation?.by ?? metrics.protocolViolation. Result filter must not show two options with same label.
L2. src/arena/metrics.ts:168 — injectionSuspected must be OMITTED (not 0) when game.records is empty (e.g. --agent-url); count distinct ROUNDS (Set of r.round) not parser records. Viewer hasInjectionData then correct. Tests.
L3. TournamentReplayScreen.tsx:54-58 — "Result" uses last decision.action (engine move). Derive outcome in the adapter (model/tournamentReplay.ts / rounds.ts) from the logged `binding` record kind (agreement → "Deal", walk → "Opponent walked"), else "not logged". "Final offer" must be the agreed price when agreement is logged. If keeping engine action, label it "Last engine action". Tests.

## Correctness (minor/nit)
L4. Tournament/DecisionPanel: use actual round numbers list (may start at 0 / skip) for prev/next and "R{n} / {last}", not rounds.length.
L5. DecisionPanel.tsx:63 — hasTrace && !panel → "R{n}: not logged." instead of empty table.
L6. MatchesScreen.tsx:62 — no side effects inside setState updater: compute next, setFiltersState(next), onFiltersChange(next), setPage(0).
L7. App.tsx MatchesContainer key = `${runId}?${query}` (replaceState does not change route so typing doesn't remount).
L8. MatchesScreen.tsx:140 count when paginated: "Showing {start+1}–{end} of {filtered}" + " (filtered from {total})" when filtered.
L9. model/matches.ts:111 — validate result/rival from URL against known values/options; drop unknown.
L10. Champion marking: compare config path too (e.g. path === "config/champion.json" && version === championVersion) or have /api/champion return path; mark a single run family, not every equal version across kinds. Keep server exposure minimal (version + path name only).
L11. App.tsx:47 — /api/champion errors: show InvalidLogBanner on Runs when champion.json is invalid (absent = nothing).
L12. GateScreen.tsx:39 — don't hard-code better/worse from sign; use direction from gate.json if logged, else no tone (just Δ).
L13. LiveScreen.tsx:64 — don't show sessionId as rival: waiting → "next opponent", otherwise rival only if logged, else "not logged".
L14. replay-header.tsx:30 / ArenaReplayContainer — MatchSelector list must respect the carried Matches filters (same predicate as matchesModel).
L15. viewer/server/api.ts:13,115 — update module comment (champion.json read) and restore scenarioRef doc comment.
L16. GateScreen.tsx:93 — mounted ref so scheduleReset after unmount does nothing.
L17. TournamentReplayScreen.tsx:9 — dedupe ModeBadge import, consistent hook imports.
L18. Surplus/ZOPA format: one format everywhere (decimal per INBOX §3 for KPIs; make tables consistent — decimal).
L19. TwoIssueScreen — compute resultLabel once.

## A11y/UX in viewer
L20. GateScreen copy: add `role="status" aria-live="polite"` sr-only message ("Command copied" / "Copy failed, select the command manually"); code box `user-select:all`.
L21. ui/states.tsx:23-27 progressbar: aria-labelledby label; aria-valuenow/min/max only when determinate; wrap in role="status".
L22. RunsScreen.tsx:40,52 — drop the duplicate "Open" TableLink column (id link + row click already open the run), or give it aria-label `Open ${runId}` and make the id plain text. Pick one tab stop per row.
L23. MatchesScreen: aria-live="polite" on the count and page indicator.
L24. MatchesScreen.tsx:135 — after Clear filters, move focus to the results count (tabIndex=-1).
L25. DecisionPanel.tsx:71,77-78 — "Round {n} of {total}" aria-live polite; disable Prev at first, Next at last (DS `.nr-btn-secondary:disabled` style).
L26. DecisionPanel.tsx:83 copy: "Select a point on the chart, or use Previous / Next round, to switch rounds."
L27. App.tsx route change: set document.title per screen ("… · Arena viewer") and move focus to the page h2 (tabIndex=-1).
L28. "not logged" wording: lowercase "not logged" in cells; full sentence only for whole-card empty states; replace "n/a", "?" , "—" placeholders for missing data (Live waiting "—" for rounds is spec'd — keep).
L29. Sentence case: "Show all (+N)", "Hide 0 ms steps", "With fallback", "With injection".

## Question (do NOT change; report to user)
Q1. /api/scenario-ref serves our mandate.reservation from config/ to the local browser (P4 exception: only when local scenario matches name+hash). Spec ajuste 2 says mandate not served. Leave as is; ask user.
