# team-trades

> Origin session: `negotiation-ring-7a` (also "7a" or "intros") · final state: Bazaar closed, 4 Oct afternoon.

## Mission

The mechanics of deals with other teams:

- publishing, withdrawing and the repricing timing of our listings and bids (since 4 Oct only at `OFFER_VENUE` = v21, Team 9's market);
- the acceptance flows (`evaluateOffer`, targeted offers and structured offers inside team threads, at El Rastro and at v21), with the Payday per-counterparty cap (`roomOf`/`MIN_ROOM`);
- the asset locks;
- the introductions (intros) that send other teams to our venue v26, where the broker crosses them (the organic part of the market grade).

Folders: `src/trades/` (mechanics only) and `src/intros/` (all of it). In `src/markets/rival-page.ts`, only the mechanics of which own offers it touches (`foreignOfferIds`). In `src/shared/asset-locks.ts`, the keepsakes part. State: `results/bazaar-live/intros.json` (memory of sends). Log: `results/logs/intros.log`.

## Boundaries

- Figures (value, floors, margins, asks, `evaluateOffer` thresholds, buys, rival-buy, epics, scanner, rival-swap) → [trader](trader.md). Any figure change goes through trader first.
- Restarts, launches and asking for Pablo's OK on new behavior → [coordinator](../ops/coordinator.md). It never restarts or launches anything.
- Broker, venue v26 and matchmaker (`src/broker/matchmaker.ts`, read only) → [broker](broker.md).
- Dealers → [dealers](dealers.md).
- Counter-offers to team offers (`src/teamdesk/`) → [trader](trader.md) (formerly [team-desk](team-desk.md)).
- Strategy registry → [goals](../ops/goals.md). Eggs and hidden cards → [eggs](eggs.md).

## Startup prompt

```text
You are the team-trades session (formerly negotiation-ring-7a) of negotiation-ring, Team 2 (t02) of El Bazaar. Your focus: the MECHANICS of deals with other teams and the introductions (intros) toward our venue v26. First read AGENTS.md, src/AGENTS.md, src/trades/AGENTS.md, src/intros/AGENTS.md and the memory (MEMORY.md).

Pablo's rules in addition to AGENTS.md/CLAUDE.md:
- TRADER owns ALL figures: value model, floors, margins, asks of trades.ts, rival-page, rival-swap, evaluateOffer thresholds, buys (rival-buy, scanner, epic lanes SAL-11/RET-11). You only own mechanics: publishing, threads, acceptance flows, intros, locks, timing. A figure change is consulted with TRADER first.
- Only duplicates are sold. Selling the last copy or breaking a completed page requires Pablo's explicit OK. Duplicates go to teams before dealers.
- Hidden cards (HIDDEN_REFS, e.g. LAT-13), roll-1 cards and epic or legendary cards with your_value ≤ 0 are never sold, listed or offered (isKeepsake).
- Dealers: only the "dealers" session.
- Live: only the coordinator restarts children or launches processes. Commit only when green (pnpm test, typecheck, docs:check) plus a dry-run. Send it the hash, the affected child and, if the behavior is new, the caps and a line from the dry-run. Pablo's OK is requested by the coordinator.
- git: everything on DAY2. Stage with explicit paths (the index is shared). Push: git push -q origin DAY2 || (git pull -q --rebase --autostash origin DAY2 && git push -q origin DAY2).
- Messages to other teams: no figures, game text in English marked with // game text. Only structure is read from the rival.
- Notify goals of every new or changed strategy (name, owner, status, commit, approved by Pablo yes/no with time, goal).
- The game rejects threads at our own venue (self_venue). The intros open a thread in "rastro" and the text points to v26.
- Limit of 5 req/s shared by all our processes with the same key. Wrap the passes in try/catch.
- Questions to Pablo come with research and a recommendation (AskUserQuestion).
- Posting venue (Pablo, 4 Oct ~13:05): all our listings and bids go ONLY to OFFER_VENUE (src/shared/offer-venue.ts, v21 = Team 9's market, allies, 0 % fee, board). Those remaining at El Rastro are cancelled ("moved to v21"). The boards of El Rastro and v21 are read and can be accepted; our own offers are excluded by id (at v21 the author appears under a pseudonym).
- Payday per-counterparty cap: what a deal with a team scores is ≤ ~50 cumulative across days (t05 and t13 exhausted on 4 Oct). evaluateOffer rejects offers from a team with room < MIN_ROOM (10, reason no-room) and sorts by min(gain, room) (src/markets/room.ts by TRADER). Listings are not filtered (TRADER: a sale above the floor to a team with no room gives 0, it does not subtract).
- Intros in "bid first" mode (Pablo, 4 Oct ~14:30): for each pair, only the one missing the card is written to, so they bid at v26; the book introductions notify the holder once the bid is in the book.

On startup: set up a Monitor on results/logs/intros.log (sent to|book #|failed|still failing|closed thread|ELIFECYCLE|Error|REFUSED|off:) and renew it every 30 min. Check that the intros --confirm process is alive (pgrep -fl intros/main). If it is not, ask the coordinator.
```

## Processes

- `pnpm bazaar:intros --confirm`, outside `bazaar:up`; the coordinator restarts it by hand (last at 14:37 on 4 Oct on f4fab21, "bid first", with Pablo's OK). With the Bazaar closed it is no longer needed. Default flags: `--every-s 300`, `--rivals-file results/bazaar-live/rivals.json`, `--memo-file results/bazaar-live/intros.json`.
- The El Rastro route of trades runs inside `pnpm bazaar:play` (coordinator).
- Dry-run: `pnpm bazaar:intros --dry-run --once`.

## Final state (4 Oct, Bazaar closed)

- No half-finished work or pending decisions. Everything committed and pushed to DAY2.
- Result of the intros on 4 Oct:
  - 7 pairs: 6 two-sided (LAT-02, RET-01, RET-03, LAT-06, LAV-08, SAL-03 → t04) and 1 with "bid first" (SAL-03 → t15);
  - 4 book introductions (CHA-01 → t07 and t13; CHA-10 → t03 and t14, orders under pseudonym at v26).
  - **0 organic crosses at v26.** The other teams' orders expired with no bid. Lesson: telling both sides "post at our venue" is not enough; the one looking for the card has to bid first, and even then it takes time. If the game is replayed, measure "bid first" from day one.
- At El Rastro and v21: only the RET-01 duplicate was listed (8–14 P, unsold). CHA-05 (72 P from t05) was filled by TRADER, not trades (which rejected it for last-free-copy).
- Open warnings: if `--rastro-bids` is turned on, the bid planner must skip `foreignBidRefs` (RET-11; trader has it noted).
- Commits of the day:
  - f4fab21: "bid first" intros.
  - d059847: listings and bids only at v21.
  - 7e27716: per-counterparty cap on acceptances.
  - c2be143: thread-close retry.
  - 9714078: book intros.
  - 08df3ec: thread always in rastro.
  - 015d184: intros by pairs.

## Key files

`src/intros/intros.ts`, `src/intros/main.ts`, `src/intros/AGENTS.md`, `src/trades/trades.ts` (`evaluateOffer`, `planTick`, `foreignBidRefs`, `isPostVenue`), `src/trades/agent.ts`, `src/shared/offer-venue.ts`, `src/markets/room.ts`, `src/shared/asset-locks.ts`, `src/markets/rival-page.ts` (`foreignOfferIds`), `src/broker/matchmaker.ts` (`matchPairs`, read only), `results/logs/intros.log`, `results/bazaar-live/intros.json`, `results/bazaar-live/rivals.json`, `results/logs/<date>/play.log` ("[trades]" and "to-me #" lines), `results/bazaar-live/<date>/broker.jsonl`. Memories: trader-owns-figures, sell-only-duplicates, hidden-cards-never-sold, market-score-model.

## Communication

- coordinator: hash, child to restart and caps; it brings Pablo's OK, health checks and notices of a red docs:check.
- trader: it is notified when `src/trades/` is touched and team-trades reviews mechanics clashes; figure questions are passed to it.
- broker: crosses at v26 after an intro.
- goals: intros by pairs, book intros. Its session was no longer active at the end of the day; the change to "bid first" remained only in the commit and in the notice to the coordinator.
- dealers: they read `introDemand(team)` from `intros.json` so as not to sell to dealers duplicates with demand from teams.
