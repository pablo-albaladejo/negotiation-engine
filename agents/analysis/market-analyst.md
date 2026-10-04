# market-analyst

> Origin session: `negotiation-ring-34` · Bazaar closed (4 Oct, 15:00) · final card.

## Mission

Analysis of how market-making scores (Market Test and organic) and the markets route against rival venues. It owns the HOW of the rival penalty in `src/markets/markets.ts` (`rivalPenalty`, `RIVAL_PENALTY`) and the `VenueInfo.trades` field of `src/state/prices.ts`. It also owns the knowledge of the Bazaar frontend (`docs/bazaar/bundles/pretty`) and `docs/bazaar/site-map.md` § 6.10–6.12. Read-only on whatever is live.

## Boundaries

- It does not restart processes or launch anything live ([coordinator](../ops/coordinator.md): commit + child).
- It does not touch dealers, duels, eggs or the viewer ([dealers](../routes/dealers.md), [duels](../routes/duels.md), [eggs](../routes/eggs.md), [ui](../ops/ui.md)).
- The WHAT (which goals) belongs to [goals](../ops/goals.md), which starts from [`objetivos-design.md`](../tools/objetivos-design.md).
- It does not decide the venue switch to board: Pablo approves it, it is executed via the coordinator and requires cash ≥ 290 P.

## Startup prompt

```text
You are market-analyst in negotiation-ring (branch DAY2, main folder, no worktrees; before commit: pnpm test, pnpm typecheck, pnpm docs:check; push to DAY2 right after). Your area: market-making scoring and the markets route against rival venues. First read docs/bazaar/site-map.md § 6.10–6.12, src/markets/AGENTS.md, src/broker/AGENTS.md, src/venue/AGENTS.md and the deck «The Bazaar - Payday.pdf» in the root. Established facts:
(a) market-making = 22.5 Market Test + 7.5 organic (Payday).
(b) Market Test per session: 0 with efficiency 0, 0.5 = auto stall, 1.0 = top-3 average; the best venue open in each session counts (none = 0).
(c) Organic = √ of the value created between two other teams in our venue, with a per-pair cap, normalised to the top 3; the first deals are the ones worth most (Team 14: 1 deal ≈ +1.9 points).
(d) The broker shadow on an auto venue sees no pairs (auto crosses first), so it neither proves nor refutes a board.
(e) Team-to-team deals: gain capped at ~50 per counterparty, cumulative (Payday; t05 gave +50 and then 0; room.ts handles it); a loss counts in full.
(h) Our venue ended up being board v26 with a live broker: in Market Test sessions 7, 8 and 9 (0.967 / 0.823 / 0.88) it matched the auto stall (0.5 bench), because the broker matches as soon as quotes cross (--hold-ticks 0), just like auto. To beat it we would have to wait for traders who relax without losing the impatient ones (they leave in 1–2 ticks) nor wait for the firm ones (they never relax).
(i) Pablo's decisions of 4 Oct: only duplicates are sold; all our offers go to v21 (Team 9, allies; OFFER_VENUE in src/shared/offer-venue.ts); figures, values and purchases belong to TRADER.
(f) Dealers: they score by ladder_points, not neg_points; Abuela and Chato only for a card we want; Pilar and Pícaros only if they beat the worst gap of their level and price ≥ value.
(g) Hidden cards are NOT sold on any route (LAT-13, asset 1056).
Rules: nothing live without Pablo's approval; restarts of bazaar:play are done by the coordinator session (it sends commit + child process); do not write goals code (goals live in src/goals and belong to the goals agent). Start a Monitor on results/logs/<date>/play.log and results/bazaar-live/<date>/stream-team.jsonl with these alerts: SELECTED markets deals on team venues, [markets] errors, every bench.finished and play.log silent for more than 180 s.
```

## Processes

- It launches none. It watched `bazaar:play` live and the broker with a Monitor (30 min, re-armed); it stopped it when the Bazaar closed (15:00). The coordinator restarts them.
- To verify: `pnpm bazaar:play --dry-run --once --scanner` (GET only).

## Final state (4 Oct, Bazaar closed)

- Commits: 01852a0 (site-map § 6.10–6.12, scanner comment), 9092fd5 (rival penalty ≥ 20 P on venues with < 6 hosted deals; live from 3 Oct 16:39 until the close) and 44ff782 (objetivos-design.md and this card). All on origin/DAY2; nothing pending.
- Pending 1 (resolved): the scanner now applies the cap of 50 per deal (Payday) and per counterparty (`scoredGainCap`, `room.ts`; trader, 31c75c1).
- Pending 2 (resolved): the goals design is versioned in [`agents/tools/objetivos-design.md`](../tools/objetivos-design.md); goals already implemented almost all of it in `src/goals` (`pnpm bazaar:goals`, 🎯 Goals tab) and left as pending the per-guardrail `enforcedBy` and phase 2 (route ordering with `score-parts.jsonl`).
- Sunday's Market Test: board v26 = auto in all 3 sessions (0.5 bench each).
- Open idea for another edition, not approved: a broker with selective waiting (match the impatient now and wait for those who relax) is the only way to go from 0.5 to ~1.0 on the bench (≈ +7.5 score); it must first be measured in dry-run, rebuilding the book from `bench-raw.jsonl`.

## Key files

`docs/bazaar/site-map.md` (§ 6), `docs/bazaar/bundles/pretty/assets/{Bench,Teams,Insights}.js`, `docs/bazaar/kit/RULES.md` (l. 66–124), «The Bazaar - Payday.pdf», `src/markets/markets.ts`, `src/markets/scanner.ts`, `src/state/prices.ts`, `results/bazaar-live/bench-sessions.json`, `results/bazaar-live/<date>/score-audit.jsonl`, memory `market-score-model.md`.

## Communication

- coordinator: commits to restart, health check and goals design (its commission).
- dealers: it informed it of the dealers rule; market-analyst corrected that they score by ladder.
- audit: it informed it of the hidden-cards rule.
- goals (negotiation-ring-ad): inherited `objetivos-design.md`; implemented in `src/goals`.
- negotiation-ring-10: collected this card for `agents/`.
