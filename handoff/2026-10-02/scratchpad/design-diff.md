# Design vs viewer — code-level diff (docs/design/arena-viewer.dc.html, "d:" = design line)

Global rules for every fix: data the logs don't have → "not logged" (never invent); only DS components / var(--*) / nr-*; no hex/zoom/raw <button>/dangerouslySetInnerHTML; English UI; UI never computes metric values (derive in model adapters from logged fields). Keep deliberate decisions: surplus decimal, no "Team 2", Compare only with gate.json, Esc only exits projector, protocol-violation attribution, no isoLines/utility name/estimate method, no "vs rival" in tournament h2.

## G1 — Header / Runs / Matches
H1 [minor] Header sticky (top 0, z 5, background var(--bg), border-bottom var(--line)) (d:23; App.tsx:384).
H2 [minor] Theme button in the h1 row top-right; Tabs full width on the row below (d:25-32).
H3 [minor] RunsScreen header row align-items:flex-end + flex-wrap (d:40; RunsScreen.tsx:69).
H4 [minor] Runs empty state text: "Run `pnpm arena` and the viewer will pick up the JSONL logs automatically." (d:56) — EmptyStateCard supports text after the command.
M1 [major] Matches h2 + `.nr-cfg` line: run id · matches · duration · β, openingMargin, acceptMargin, acTimeThreshold, noise, horizon (d:71) — "not logged" per missing field; Pill champion as sibling of h2 (gap space-3), not inside it.
M2 [major] Price column (agreement offer, else "—") between Outcome and Surplus (d:668).
M3 [major] Outcome as DS Flag (decision for deal; walk for walk/error) (d:602).
M4 [major] Incidents as a row of Flags (injection ×N, template, empty ZOPA…), empty when none; drop "clean" (d:575, d:603).
M5 [major] KPI strip: Matches, Agreement (no tone), Avg. surplus, Violations, Leaks, Empty ZOPA detected, Duration (d:660) — "not logged" if missing.
M6 [minor] Rounds "9/10" (no spaces) in Matches and replay KPIs.
M7 [minor] Checkboxes: "with injection" first, then "with fallback", lowercase (d:665).
M8 [minor] Count row margin-bottom space-2.

## G2 — Replay · arena (+ DecisionPanel, DS Legend) and Two dimensions
A1 [major] Back label "← Matches in {runId}" (arena and two-dimensions).
A2 [major] ReplayHeader: `sub` slot (.nr-muted, baseline-aligned with h2: "Seller · price · T=10 · run r-1001") and `cfg` slot (.nr-cfg config line) (d:89-93). No ModeBadge on arena header (keep on tournament); header gap space-1; MatchSelector as its own section item.
A3 [major] Arena KPIs: Outcome, Price, Surplus / ZOPA, Rounds (n/T), Role · reserve, Injections (walk tone if >0) (d:411); drop the separate "ZOPA" KPI.
A4 [major] Offers chart caption: "ZOPA {a}–{b} (arena: the opponent's reserve is revealed afterwards). Click a point to highlight its message." from logged reserves (d:98).
A5 [major] Legend 9 items incl. "Injection" and "Close" markers, "Target curve ({persona/strategy})" only if logged (d:102-112). Add DS LegendItem kinds `injection` and `end` (DS change + test + preview + conventions → re-sync).
A6 [major] Chat flags: ours `target N`, `est. reserve N`, `rule: …`; theirs `injection`/`quarantined`; accept `AC_next · accepts N` — from logged explain/parser/decision (d:413-428).
A7 [major] DecisionPanel: 3 columns "Turn step | Engine log | Status"; Status holds Flags (engine, accept/no accept, applies/n/a/walk, injection/clean, ok/template) (d:609-617, d:675); AC_next as Flag in Status; remove extra "Rule" row if not in design.
A8 [minor] DecisionPanel text: counter "R5 / 8" (keep aria-live with an accessible label "Round 5 of 8"), target 1 decimal, "ok · 1 attempt", short footer per design; header row flex-wrap + margin-bottom space-2.
A9 [minor] End marker label "AC_next → deal at {price}" / "R{n} · walk" (d:409).
A10 [minor] Offers card not sticky (design) — remove nr-sticky-wide on arena.
T1 [major] Two-dim KPIs: Outcome, Agreement, Utility (last logged uOffer), Rounds, Role, Within mandate (deal tone; "not logged" if not derivable from logged mandate+agreement) (d:681).
T2 [minor] Two-dim header sub inline with h2 (baseline); mandate text "discount ≤ 6%, day ≤ 60" format (d:188-191).
T3 [minor] Scatter labels: axis "payment day"/"discount %" from issue metadata if logged; mandate label "region allowed by our mandate"; deal label "AC_next → deal at 3.5% · day 40" (d:199, d:625-626).
T4 [minor] Logged offers table: column "Their offer"; cell "3.5% · day 40"; Agreement KPI "—" when none (d:628, d:682).
T5 [minor] Utility chart end label "AC_next → 0.63" (d:680).

## G3 — Tournament, Champion vs candidate, Live, States
R1 [major] Tournament OfferChart gets injection-rounds and end; Legend has "Injection" (d:154, d:162).
R2 [major] Tournament KPIs: Outcome, Price, Utility, Estimated opponent reserve, Rounds "n/T", Role · reserve, Injections (d:502) — "not logged" when missing.
R3 [minor] Tournament header: ModeBadge + h2 + .nr-muted in one row ("Seller · price · T=10 · qualifying round 2" = role · issue · T · phase, "not logged" parts); no back link per design — keep a BackLink only if needed for navigation? Design has none: remove it (tabs exist now).
R4 [minor] Config line: full logged config params + " · tournament mode".
R5 [minor] Remove the extra "Our reserve: not available" line.
R6 [minor] Final-estimate caption per design ("final estimate · the opponent closed at N, …") only if close is logged.
R7 [minor] Chart x-axis = round limit T when logged.
G1g [minor] Gate: keep phase Tabs (real data) but drop "· {phase}" title suffix and the Metrics caption; drop "← Runs" back link (tabs exist).
G2g [minor] Gate config line: "{champion} vs {candidate} · {N} matches each · same seeds · only change: …" with "not logged" parts.
G3g [minor] Verdict pill text: "candidate vN becomes champion" / "rejected · {reason}" (d:231-234).
G4g [minor] Metric labels: "Avg. surplus / ZOPA", "Avg. rounds", "Empty ZOPA detected"; remove extra "Games" row (d:686-693). Keep the unit note somewhere unobtrusive (caption under the table) since Δ is pp.
G5g [minor] Diff sign: true minus "−" (U+2212) as INBOX §6 and design say; heatmap caption "Candidate v{n} · …".
L1 [major] Live waiting: "Next: vs {team} · {role} · {issues}" muted line (or "Next: not logged") between title and "Last:"; "Last:" includes "· utility N" when logged (d:284-285).
L2 [minor] Live final stats: first stat utility in var(--ok) when logged; template stat plain count (d:647).
L3 [minor] Scoreboard full width; `us` label from config/env if available else "Us"; ModeBadge/projector button below or aside per design (d:280).
L4 [minor] Headline "Match {id} · {role}"; chat flag "attack blocked"; decision flag "AC_next · accepts" (d:543, d:548, d:641).
L5 [minor] LiveScreen duplicate consumePageFocus effect — delete one (if not already fixed).
S1 [major] States "Opponent breaks protocol" card: .nr-cfg "m-0356 · vs text-only · seller · R3", ChatMessage with Flag "breaks protocol · no offer", KpiStrip (Outcome "Opponent error" walk, Rounds 3/10, Our last offer 127) (d:340-348).
S2 [major] Loading card: one card with progress bar + skeleton blocks (4×44px KPI placeholders + 120px block) (d:378-390) — add skeleton to LoadingCard (respect reduced motion).
S3 [minor] "Empty ZOPA → walk" card: caption per design; chart only (remove banner/legend there) (d:350-354).
S4 [minor] "LLM down · everything on template" title; chat starts with opponent's R4 message (d:356, d:365).
S5 [minor] "Run with no matches" Card title, inner h3 16px, padding 32px (d:371-375).
S6 [minor] States grid repeat(2, minmax(0,1fr)) (collapses <900px).
S7 [minor] Invalid log banner adds "Match {id} is skipped until the log is fixed." when known (d:335).
