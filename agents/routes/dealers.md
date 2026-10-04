# dealers

> Origin session: `dealers` · Bazaar closed · final state: 4 Oct (end of day 2).

## Mission

Sole owner of trading with dealers (Abuela, El Chato, Pilar, Pícaros and Don Ernesto/banco) and of the flag detector. It owns:

- `src/dealers/` (`negotiation/`, `planning/`, `history/`);
- `src/forex/` (chain detector, buying switched off);
- `src/flags/`;
- the dealer routes in `src/coordinator/routes.ts` (`EGG_PARAMS`, ladder, `ownsThread`, `teamDemand`, `pastNoDeals`);
- the "buy from dealer" leg of the CHA route and the approved album purchases (`ALBUM_BUYS`).

It feeds `results/bazaar-live/<day>/`: `dealer-trades.json`, `forex.json`, `team-received.json`, `flags.json`, `thread-*.jsonl`, and `docs/bazaar/lessons.json`.

## Boundaries

- It does not restart processes → [coordinator](../ops/coordinator.md) (hash + child).
- Figures for sales and purchases between teams, El Rastro and the team-side CHA route → [trader](trader.md).
- Questions and eggs to dealers → [eggs](eggs.md) (egg phrases are coordinated with them).
- Goals and strategy → [goals](../ops/goals.md): notify of every change.
- Duels → [duels](duels.md). Viewer → [ui](../ops/ui.md).
- It does not touch `src/markets/`, `src/trades/`, `src/duels/` or `viewer/`.

## Startup prompt

```text
You are the "dealers" session of negotiation-ring (branch DAY2, main folder, no branches, worktrees or PRs). You are the ONLY owner of trading with dealers (src/dealers/, src/forex/, dealer routes of src/coordinator/routes.ts) and of the flags (src/flags/). Read AGENTS.md, src/AGENTS.md, src/dealers/AGENTS.md, src/forex/AGENTS.md, src/flags/AGENTS.md and the memory (MEMORY.md).

Pablo's rules in addition to AGENTS.md/memory:
(1) Payday, slide 7: a deal scores added value − price paid + price collected. With a dealer, the gain only counts in the ladder and the loss counts IN FULL. So never sell to a dealer below your_value, and buying from a dealer adds no neg.
(2) Only duplicates are sold; the last copy needs Pablo's OK. Hidden cards (LAT-13, asset 1056) are never sold.
(3) A card received from another team today (team-received.json), or offered or demanded by teams (open offers with venue or to=tNN, intros.json ≤ 6 h), is never offered to a dealer (teams first).
(4) Forex: buying switched off (FOREX_AUTOMATED=false); it is shown, not executed. The ladder chain (Pícaros epic → banco) was WITHDRAWN: do not reapply it.
(5) Don Ernesto: Pablo decided not to deal with him (floor ≈ 730 > value of any legendary; RET-12 720). Revisit only if a legendary goes above ~730 of your_value or his menu changes.
(6) Ladder: a NEGOTIATED sale or purchase with a dealer that has room does score ladder (Pilar MAL-08 @19: +0.040; Pícaros CHA-09 @59: +0.045); one closed at its fixed opening price (span 0) scores 0 with any dealer. LADDER_UNVERIFIED is empty (167df38: Pícaros left it). LADDER_SALES_UNSCORED=true still holds: no ladder bonus on sales when arbitrating (proposal to reactivate it pending the coordinator's OK), and the ladder discount on the minimum sale price stays at 0 always (loss with a dealer = full).
(7) Threads: the dealers agent only continues threads opened by play (ownsThread reads "action":"open" in thread-<id>.jsonl); the rest → idle · rule foreign-thread.
(8) After 1 no-deal whose best price never reached our limit: 60 min cooldown (HOPELESS_COOLDOWN_MS).
(9) Flags: do not approve Chato's pressure 2819. 10878/10965 (Pícaros) are correctly flagged and their already_flagged on restart is harmless; 4743 is a known false positive. Pressure phrases are only sent with --approve-flags and Pablo's OK.
(10) CHA route (approved by Pablo via coordinator): to a team we sell (a) a duplicate or (b) a card rebuyable from a dealer at ≤ our value. The sales gate belongs to TRADER in team-desk: dealerBuyQuotes non-empty and quote.hi ≤ floor(value × safety), min(price − value, roomOf(team)) ≥ 20 and roomOf ≥ MIN_ROOM (src/markets/room.ts; the Payday cap is ~50 per counterparty, cumulative). Your leg has no code of its own: the album planner rebuys the missing card at ≤ value × safety. dealerBuyQuotes excludes the dealers in CHA_REBUY_OFF (Pícaros) until Pablo approves P2.
(12) No dealer buys a card for which we have an open bid (ourBidRefs in src/shared/asset-locks.ts; if reading offers fails, it does not buy: fails closed).
(13) ALBUM_BUYS (src/dealers/agent.ts): album purchases approved by Pablo, outside the hourly cap, with their own cap and cash floor; one per card and only if we do not have it nor is there a bid of ours. The only entry (CHA-09/10 from Pícaros, ≤ 70, cash ≥ 50) is already fulfilled: Chamberí 10/10. A new entry needs Pablo's OK via coordinator.
(11) Chato's egg mid-deal: GREETINGS[2] contains the literal substring of the egg (personas.md:233); do not rewrite it.
Before each commit: pnpm test, pnpm typecheck and pnpm docs:check green; push right after (fetch and pull --rebase if the remote advanced; do not stash .env.broker, it belongs to another session). Never prettier --write. Co-authorship: "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>". Questions to Pablo come with research and a recommendation. Watch results/logs/<day>/play.log with a Monitor ([dealers] without "idle · rule no-target", [flags], rate_limited, foreign-thread). Foreign-thread entries are usually manual egg probes: confirm with them, do not touch. play.log starts with --max-spend-hour 60 (default): a dealer purchase with a list price > 60 has no room except through ALBUM_BUYS or by changing the flag with a full up from Pablo.
```

## Processes

- It launches none: its routes run inside `pnpm bazaar:play` (live, launched by `bazaar:up --live --confirm`), which only the coordinator restarts.
- Monitor on `play.log` (30 min, re-armed).

## Final state (4 Oct, Bazaar closed)

- Chamberí complete (10/10): CHA-09 @59 (thread 3009) and CHA-10 @60 (thread 3044) from Pícaros through `ALBUM_BUYS`; cash 130. The CHA-05 sold to t05 @72 (+50 neg) was rebought from Abuela @10 (thread 2569).
- Pilar: duplicate MAL-08 sold @19 (thread 2689), ladder +0.040.
- Ladder at close: L1 abuela 3/3 · L3 pilar 1/3 · L4 pícaros 1/3 · L2 chato and L5 banco 0/3.
- Don Ernesto: no deals (Pablo's decision). Forex: detector only.
- Flags: no new ones; 10878/10965 already reported.
- Pending (not urgent): ladder bonus on negotiated sales in arbitration (`LADDER_SALES_UNSCORED` → false only for the bonus), proposed to the coordinator with no answer.
- Day 2 commits: 167df38 (Pícaros out of `LADDER_UNVERIFIED`), 5600408 (`ALBUM_BUYS`), 44f3f6b (`ourBidRefs`), ba0ca48 (`CHA_REBUY_OFF`), 095ad4d (`dealerBuyQuotes`), 5f26123 (hopeless cooldown), 17737e2 (teams first), 76dc0ce (foreign-thread), 203c5ef (Chato's egg phrase), 2013780 (forex off), 8b236d3 (dealShare span 0), 4faf36f (duplicates only + team-received).

## Key files

`src/dealers/AGENTS.md`, `src/dealers/agent.ts` (`adoptOpenThread`, `notForDealers`, hopeless), `src/dealers/planning/plan.ts` (`rankCandidates`), `src/coordinator/routes.ts`, `src/forex/chains.ts`, `src/forex/ledger.ts`, `src/flags/flags.ts`, `src/shared/asset-locks.ts` (`teamOfferedAssets`, `ourBidRefs`), `src/markets/room.ts` (room per counterparty, from trader), `src/dealers/history/team-received.ts`, «The Bazaar - Payday.pdf» (slides 7–8). Memories: dealer-sale-below-value-costs, banco-sunday-plan, sell-only-duplicates, ladder-scoring-measured, hidden-cards-never-sold, payday-cap-per-counterparty, team-buy-high-value-scores.

## Communication

- coordinator: restarts (hash + child); asks it for health checks and Pablo's approvals.
- trader: CHA route (sales gate in team-desk), room per counterparty, album purchases versus bids (notify when each card is closed).
- eggs: questions and eggs to dealers; the banco's profile.
- goals: strategy changes.
