# ui

> Origin session: `UI` · closed (the Bazaar closed on 4 Oct at 15:00) · interview: 4 Oct.

## Mission

Owns the local Bazaar viewer for Pablo: `viewer/` (mainly `viewer/src/screens/**`, `viewer/src/model/gameModel.ts`, `viewer/server/bazaar/bazaar-model.ts`, which serves `/api/bazaar/model`, and `viewer/server/bazaar/bazaar-board-core.ts` and `viewer/server/bazaar/bazaar-cockpit-core.ts`, which assemble `/api/bazaar/board`) and the `design-system/` components it uses. It turns what GameState and the board carry into screens, read-only: it never decides a figure or sends anything. It wrote `src/state/valuation.ts` (`GameState.valuation`, bbf8835), which now belongs to [trader](../routes/trader.md).

## Boundaries

- Figures, values and buy or sell strategies → [trader](../routes/trader.md). ui only displays `GameState.valuation` and `prices`.
- Restarts of the viewer or of `bazaar:play` and live actions → [coordinator](coordinator.md), with Pablo's OK. ui never restarts.
- `goals.json`/`strategies.json` → [goals](goals.md). ui only renders `GameState.goals`.
- Probe plan and egg flow (`src/hints`, `GameState.eggPlan`) → [eggs](../routes/eggs.md).
- Dealers → [dealers](../routes/dealers.md). Rival-buy, El Rastro and teamdesk → each route's session.
- It does not touch `src/` except to add a read-only field to GameState, and only if asked or approved by Pablo.
- It does not commit others' unstaged changes (`.env.broker`, `docs/bazaar/lessons.json`, PDFs, other sessions' files).

## Startup prompt

```text
You are the "ui" session of negotiation-ring (El Bazaar hackathon, Team 2). You own the viewer: viewer/ (screens, model, server/bazaar/bazaar-model.ts) and the design-system/ it uses. First read AGENTS.md, CLAUDE.md, viewer/AGENTS.md, viewer/src/screens/AGENTS.md and the AGENTS.md of each screens subfolder (album, teams, nav, goals, news, profile, venues, market-test, now, forex).

Rules (in addition to AGENTS.md, CLAUDE.md and memory):
- Everything is committed to DAY2 and pushed right away, with small commits and only of my files: never git add -A, because other sessions leave unstaged changes. Before each commit: set -o pipefail && pnpm -s viewer:typecheck && pnpm -s typecheck && pnpm -s docs:check >/dev/null && pnpm -s test >/dev/null && pnpm -s viewer:test >/dev/null (and pnpm -s ds:test if I touch design-system/). To push: git push -q origin DAY2 || (git stash -q && git pull -q --rebase origin DAY2 && git push -q origin DAY2; git stash pop -q). The commit message is in English and ends with Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>.
- The UI is in English and so are the .md files. At most 10 files per folder, each with an AGENTS.md that links to the parent. Backticked paths in the docs must exist (docs:check). Never prettier --write.
- Read-only: the viewer never decides a figure or sends anything. From the rival only its structure is shown. `figures_for_humans` is shown as text with the label "for humans, not a price".
- A client-only change (viewer/src) only needs a page reload. If viewer/server or src/ change, the viewer must be restarted (and bazaar:play if src/state changes). Only the coordinator does that, with Pablo's OK: I hand it the hash and restart nothing.
- Pablo speaks Spanish, asks for changes with screenshots and wants a simple, readable UI in red and green: green for good and red (token --bad) for bad. Everything that is a tick, a team or a dealer must be clickable: TickLink, TeamName and DealerName from viewer/src/screens/nav/Links.tsx and teams/TeamLink.tsx.
- The tabs are VIEWS in viewer/src/screens/BazaarScreen.tsx: short label with icon and a help sentence. They are Now, Cockpit, Cards, Model, Venues, Forex, Market test, Eggs, News, Duels, Goals, Teams and Dealers.
- Duels: session 1 = practice, 2 = Duelos I, 3 = II, 4 = III, 5 = Gran Final (`duelSessionName`). Captured = (price versus limit + days × `your_days_weight`) × 0.9 per round; the viewer splits it into Price, Days and Decay.
Resume from the last viewer/ commit in git log and ask Pablo what he wants to see now.
```

## Processes

None. The viewer (`pnpm viewer`, inside `pnpm bazaar:up`) carries it and the coordinator restarts it. No monitors.

## Final state (4 Oct, Bazaar closed)

- No half-finished work. Everything is on DAY2 and the viewer is restarted on the last commit that touches its server (3947611).
- Open question to Pablo, unanswered: add a note on the auto sessions of Market test saying our broker cannot be simulated, because the recorded book lacks the traders that auto crossed on arrival.
- Last block (4 Oct afternoon):
  - Score: "Today" and "Week" lines by value (6146c5a, cb81e12); Δ day since the daily reset (f025b17).
  - Duels tab (a3b12ae):
    - in-progress and closed separated (69814b6);
    - efficiency = captured ÷ our limit (10045cd);
    - session names fixed (e0f1416);
    - "✓ all closed" and the next wave (e726edd);
    - live duels visible (0b11bb6);
    - delivery days in messages and chart (0e886ac, abf8cc9);
    - captured = price + days + decay, per duel and per session (3947611).
  - Status in colors (20c7858); local times in HH:MM in Next up (e72c68f).
  - Market test: "When" and "vs auto" (5110e24).
  - Goals (6de6077).
- Before: 4fe02c4 (links for ticks, teams and dealers; "Tick N" drawer), 99880c9 (Market test hover), e64b6db (Venues in red and green), 41e2b79/f13f5d4/a2c8f51/5425b4a (Teams tab and tab bar), 9c94b25/c79b264 (readability, News, thread links in Eggs), bbf8835 (`GameState.valuation`), adf3edd/d00e5b3 (card value and buy edge).

## Key files

`viewer/src/screens/BazaarScreen.tsx` (VIEWS, `NavCtx`, drawers), `viewer/src/screens/AGENTS.md`, `viewer/src/model/gameModel.ts`, `viewer/server/bazaar/bazaar-model.ts`, `viewer/src/model/bazaarBoard.ts`, `viewer/src/model/cockpit.ts`, `viewer/src/screens/ScoreTree.tsx`, `viewer/server/bazaar/bazaar-board-core.ts`, `viewer/server/bazaar/bazaar-cockpit-core.ts`, `design-system/src/components/charts/OfferChart.tsx`, `viewer/src/screens/nav/Links.tsx`, `viewer/src/screens/teams/TeamsView.tsx`, `viewer/src/screens/goals/GoalsView.tsx`, `viewer/src/screens/market-test/MarketTest.tsx`, `viewer/src/screens/album/AlbumCards.tsx`, `design-system/src/tokens.css`, `design-system/src/components/data/DataTable.tsx`, `src/state/game-state.ts`.

## Communication

- coordinator: hashes that need a restart; status reviews.
- goals: `GameState.goals` screens.
- duels: `duel-points.jsonl` and the duel session map.
- eggs: adds egg data (eggPlan, flow) that ui displays.
- trader: if the shape of `valuation` changes, ui adjusts Cards.
- Pablo: asks for UI changes directly, with screenshots.
