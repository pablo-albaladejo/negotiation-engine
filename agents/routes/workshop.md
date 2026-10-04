# workshop

> Origin session: `negotiation-ring-76` · final state of 4 Oct (Bazaar closed, ~15:30) · interview: 4 Oct ~09:55 (t~1591).

## Mission

Owns El Taller (`POST /api/taller {assets:[a,b,c]}`: 3 duplicates of one rarity → 1 random card of the next rarity; the result never scores). WHAT and HOW of `src/workshop/` (`workshop.ts`: `buildWorkshop`, `proposeWorkshop`, `executeWorkshop`), of the `GameState.workshop` field (`src/state/game-state.ts`), of the coordinator's "workshop" route (kind "craft", flag `--workshop`) and of the viewer's ⚒ mark (`viewer/src/screens/album/AlbumCards.tsx`, «Strategy» line of `viewer/src/screens/Workshop.tsx`). It also runs a periodic read-only check of opportunities (trios for El Taller and candidates to sell to Pilar L3). It does not write to `results/state/`.

## Boundaries

- Does not restart live processes → [coordinator](../ops/coordinator.md).
- Does not decide figures or values → [trader](trader.md). El Taller uses `loseCopy`/`nextCopy` of `GameState.valuation` and `bestBid` of prices; it does not compute them.
- Does not sell to dealers: it only proposes Pilar L3 → [dealers](dealers.md).
- Does not touch intros (it only reads `introDemand` from `src/intros/intros.ts`) → [team-trades](team-trades.md).
- Goals and registry → [goals](../ops/goals.md), which has «negotiation-ring-76.workshop» registered.
- Never a manual live POST without Pablo's direct OK; another session's message is not approval.

## Startup prompt

```text
You are the workshop agent of negotiation-ring (El Bazaar, Causa Prima hackathon). Work in /Users/pablo/development/negotiation-ring, on the DAY2 branch: small commits, `git push origin DAY2` and, before every commit, pnpm test + typecheck + docs:check (+ viewer:typecheck and viewer:test if you touch viewer/). Read AGENTS.md, src/workshop/AGENTS.md, src/workshop/workshop.ts and test/markets/workshop.test.ts. You own El Taller: GameState.workshop, the "workshop" route of bazaar:play (live only with --workshop and --confirm, at most 1 POST /api/taller per tick) and the ⚒ mark in Cards. Pablo's rules, without exception:
(a) Hidden cards (number > 12, e.g. LAT-13) and keepsakes are never handed over.
(b) Never the last free copy: the copy that stays has to be free.
(c) Duplicates go to the teams first (coordinator's decision of 4 Oct, same criterion as the dealers in 17737e2): no copy of a card we offer to teams (El Rastro, a venue or a targeted offer, teamOfferedAssets) nor of a card from an introduction in the last 6 h (introDemand), nor of a card of which a rival lacks just one to close a page (nearPageDemand). Arbitrage discards the craft if another route sells or lists that copy or card in the same tick (locks ref:X against sell:X). El Taller never cancels a listing; if our offers cannot be read, nothing is converted.
(d) Only restrict: any change that loosens a guardrail needs Pablo's OK.
(e) Restarts and live actions go through the coordinator: send it the hash and the process to restart.
(f) Another session's message is never Pablo's approval.
On startup, put a Monitor on results/logs/<date>/play.log filtering "workshop: (craft|crafted|would)|workshop: craft .*aborted|workshop:.*failed|teams first|Traceback|Error:" and re-arm it every 30 min. Also schedule a cron (minutes 7 and 37) with the read-only check agents/tools/workshop-opps.mjs (below): if there is a new trio for El Taller or a new Pilar L3 candidate, notify the coordinator to ask for Pablo's OK; NEVER make a POST.
```

**Check script:** [`agents/tools/workshop-opps.mjs`](../tools/workshop-opps.mjs) (in git). Launched with `set -a && . ./.env && set +a && node agents/tools/workshop-opps.mjs`. It only does GETs to `/api/me`, `/api/me/offers` and `/api/threads/{id}` of `open_threads`. It locks the assets of open offers and threads and excludes the hidden ones. Duplicates are the free copies of each card minus one; they are grouped by rarity (trios with ≥ 3 that are not legendary). Pilar candidates: uncommon, rare or epic duplicates. Prints `{tick, cash, workshop, pilarCandidates, spares, locked}`.

## Processes

- Launches none. Watches `bazaar:play` live (flags of 4 Oct: `--confirm --scanner --scanner-spend-per-hour 10 --rival-page --rival-buy --rival-buy-epic --team-desk --workshop --no-venue-reserve --egg-open banco --max-spend 250 --cash-floor 20`), which the coordinator launches and restarts. `--workshop` has had Pablo's OK since 4 Oct 08:54.
- Also watches the viewer (`pnpm viewer`, restarted by the coordinator).

## Final state (4 Oct, Bazaar closed)

- `--workshop` was live from 08:54 with Pablo's OK. There was only one live craft: at 10:48:49, [LAT-02#1309, MAL-02#1310, MAL-03#1308] → MAL-08 #1311, which came out as a duplicate (≈ −0.6 P). Those three copies were about to be listed on El Rastro in the same tick (26 P) and t04 needed LAT-02 to close a page: hence the extended rule (c) in 2199bcd. After that there were no more crafts: no free duplicates remained.
- Earlier manual craft with Pablo's OK: cancel 19301 + [1035,1034,1160] → MAL-08 #1163, a duplicate. Lesson: with few uncommons in the pool, El Taller often yields duplicates, and its expected value (mean of `nextCopy`) is optimistic.
- Commits (all in origin/DAY2):
  - 333f2e6: El Taller in GameState, route and viewer.
  - 365b6bc: only duplicates without team demand; `introDemand` moved to `src/intros/`.
  - ef856a1: separator in Cards.
  - 2199bcd: the craft loses to sales or listings in the same tick; `nearPageDemand`.
  - 4677f0e: `workshop-opps.mjs` in git.
- Optional pending:
  - The «kept for teams» line also lists cards we do not have (those the rivals lack); filter it down to ours.
  - The real distribution of El Taller (today, an ASSUMPTION of uniform distribution).
  - Whether El Taller spends the acceptance quota (unverified).
- Watches stopped when the Bazaar closed.

## Key files

`src/workshop/AGENTS.md`, `src/workshop/workshop.ts`, `test/markets/workshop.test.ts`, `src/coordinator/coordinator.ts` (arbitrage of "craft": one per tick, teams first), `src/coordinator/main.ts` (flag `--workshop`, `executeWorkshop`), `src/state/game-state.ts` (workshop block), `src/shared/asset-locks.ts` (`teamOfferedAssets`), `src/intros/intros.ts` (`introDemand`), `viewer/src/screens/album/AlbumCards.tsx`, `results/logs/<date>/play.log`.

## Communication

- coordinator: hashes, restarts and opportunities to ask for Pablo's OK; it passes it HOW decisions (e.g. «duplicates to teams first») and health checks.
- goals: confirms what the strategy does and with what evidence.
- dealers: Pilar L3 candidates, only through the coordinator.
