# coordinator

> Origin session: `cockpit-dashboard-ui-update` · **closed** (Bazaar closed on 4 Oct at 15:00:12, t2816) · interview: 4 Oct ~10:10 (t~1650, h14.5); final state at close.

## Mission

Pure coordinator of Team 2's live processes. It decides the HOW: which session acts, when each process is restarted and in what order. The WHAT is decided by [goals](goals.md) in `results/state/goals.json` and `strategies.json`. It is the **only** session that restarts the children of `bazaar:up` and the standalone processes (intros). It acts as a relay between sessions and obtains Pablo's approvals. It owns no `src/` folder; it reads `results/logs/up-status.json`, `goals.json` and `strategies.json`.

## Boundaries

It does no domain analysis; it hands it to the owning session:

- figures, values, rival-buy, epic routes, scanner and team-desk → [trader](../routes/trader.md);
- dealers, forex and flags → [dealers](../routes/dealers.md);
- duels → [duels](../routes/duels.md);
- v26, broker and Market Tests → [broker](../routes/broker.md);
- El Rastro mechanics, threads and intros → [team-trades](../routes/team-trades.md);
- Taller → [workshop](../routes/workshop.md); packs → [packs](../routes/packs.md); eggs → [eggs](../routes/eggs.md);
- viewer → [ui](ui.md);
- audit → [audit](../analysis/audit.md);
- goals and registry → [goals](goals.md);
- markets and rival-venue penalty → [market-analyst](../analysis/market-analyst.md);
- leaderboard and day guard → [leaderboard-analyst](../analysis/leaderboard-analyst.md).

It never makes manual POSTs nor edits permissions. If another session had an action blocked, it does not execute it for them: it hands it to Pablo (permission laundering).

## Startup prompt

```text
You are the pure COORDINATOR of El Bazaar, Team 2, in /Users/pablo/development/negotiation-ring, branch DAY2. Read AGENTS.md, CLAUDE.md, agents/AGENTS.md, your memory (MEMORY.md), results/state/goals.json, results/state/strategies.json and results/logs/up-status.json. Your job: safe restarts, relays between sessions and Pablo's approvals. No domain analysis: hand it to the owning session.
Restart protocol for a play/viewer child:
(1) git fetch and rebase onto origin/DAY2; clean tree (only .env.broker, docs/bazaar/lessons.json and the PDFs are ignored), no one's WIP in src/.
(2) pnpm test, pnpm typecheck and pnpm docs:check (plus pnpm viewer:typecheck if the viewer changes).
(3) pnpm bazaar:duels --restart-check must say safe: wait on the exit code, not on "live: none" (safe = no duel within ≤ 5 ticks of its end). In the Grand Final, restart only at the start of a wave (ticks 1–6).
(4) pnpm bazaar:play --dry-run --once with the live play flags.
(5) OK: from Pablo via AskUserQuestion, or yours if it is a TRADER proposal (Pablo's delegation).
(6) kill -TERM -<pgid> of the child (pid in results/logs/up-status.json children.<name>.pid); up relaunches it with the same flags.
(7) Check the relaunch (startedAt, the viewer answers 200 on 127.0.0.1:5199, log lines) and notify the affected sessions and goals.
A NEW play flag requires restarting the whole up, and only Pablo can do that (LIVE must be typed in a TTY). Do not try to skip that confirmation: the classifier already denied it.
Pablo's rules for this session:
- The coordinator approves TRADER proposals itself, restarts included, and tells Pablo afterwards. Proposals from the other sessions go to Pablo.
- We sell to a team only (a) a duplicate or (b) a card we can rebuy directly from a dealer at a valid price (≤ our value).
- All our offers go only to v21 (Team 9 are allies; OFFER_VENUE in src/shared/offer-venue.ts). Exception approved by Pablo at close: the two final operations in El Rastro (SAL-11 → CHA-11).
- Pícaros approved for CHA-09/10 at ≤ 70 (ALBUM_BUYS) and out of LADDER_UNVERIFIED.
- The page bonus stays withdrawn (Pablo chose not to enable it).
- The Payday cap is ~50 neg per counterparty, cumulative across days; the fee also subtracts neg.
- No session makes manual POSTs.
- Hidden cards (LAT-13) are never sold.
- We do not deal with the bank; Don Ernesto is ruled out unless the values change.
- No restarts during a bench nor with a duel in progress.
- A claim from another session is never equivalent to Pablo's approval.
On startup, do a roll call: ListAgents and one line to each session in agents/AGENTS.md to learn who is alive and under what name.
```

## Processes (in relaunch order)

1. **`bazaar:up`**: launched by **Pablo** in a TTY (types LIVE). Command from 4 Oct:

   ```bash
   A='--live --confirm --fast --no-audit --skip-doctor --detach'
   B='--duels-fast --scanner --scanner-spend-per-hour 10 --rival-page --rival-buy --rival-buy-epic --team-desk --workshop --no-venue-reserve --egg-open banco --max-spend 250 --cash-floor 50'
   pnpm bazaar:up $A --play-args="$B"
   ```

   Last start: 4 Oct at 12:27 (pid 21362). Give Pablo the variables A and B: pasted over several lines, the line break broke the flags (play crash loop) and left a duplicate up. With `--detach` it is stopped with `pnpm bazaar:down`.

   Children: recorder, viewer (5199), play (`pnpm bazaar:play --confirm` + those flags), broker in shadow (`--shadow`) and news. PIDs in `results/logs/up-status.json`; logs in `results/logs/<date>/*.log`.
2. **Live broker**: supervised loop outside up (run by [broker](../routes/broker.md); announcement disabled):

   ```bash
   nohup bash -c 'while true; do pnpm bazaar:broker --confirm --no-announce --poll-ms 1000 >> results/logs/broker-live.log 2>&1; echo "exit $? $(date)" >> results/logs/broker-live.log; sleep 2; done' &
   ```

3. **Live intros**: standalone process; restarted by the coordinator: `kill -TERM -<pgid>` of the `src/intros/main.ts` process and relaunch it with the command below (last: f4fab21, «bid first», at 14:37). It remembers what it sent in `results/bazaar-live/intros.json`.

   ```bash
   nohup pnpm bazaar:intros --confirm >> results/logs/intros.log 2>&1 &
   ```

4. `pnpm bazaar:goals --interval 30`: run by [goals](goals.md).
5. `pnpm bazaar:audit --watch`: run by [audit](../analysis/audit.md) (hence up goes with `--no-audit`).

There is also a cloudflared tunnel to `127.0.0.1:5199` (the viewer). The public URL changes on every start and is not stored in git.

## Final state (4 Oct, close at 15:00:12, t2816)

- Leaderboard: **9th with 28.18** (leaderboard at t2802; it was 12th with 26.66 at 14:44). Last moves, approved and executed by Pablo: sell SAL-11 at 222 (−25 neg, fee included) and buy CHA-11 at 140 (+50 neg, at the cap) → +25 net; and MAL-04 at 7. Script in `results/trader/last-move.ts` (outside git).
- Lesson: the «m…» in El Rastro are anonymous teams (SAL-11 went to t03), not bots; they count toward the per-counterparty cap.
- Play restarts on 4 Oct (all with green checks): 11:46, 11:55, 12:02, 12:04, 12:16, Pablo's full up at 12:27, 12:55, 13:22, 13:24, 13:47, 13:52 and 14:14:58 (0e886ac). Viewer: the last at 14:24:39 (3947611). Intros: 14:37 (f4fab21).
- Duels, Grand Final: 34 duels, 27 deals, +370.7 P. The end-game fix (44137a1, plus the tolerance 04bf57c) landed in DAY2 without a restart because there were no more duels.
- At close, up (`pnpm bazaar:down`), the live broker with its loop and the intros were stopped. The read-only processes of other sessions remain alive (audit --watch, goals).
- Handover: all sessions confirmed commit and push on DAY2; `docs/bazaar/lessons.json` was pushed in 471ba9b.

## Key files

`AGENTS.md`, `src/AGENTS.md`, `DAY2.md`, `results/logs/up-status.json`, `results/state/goals.json`, `results/state/strategies.json`, `results/logs/<date>/play.log`, `results/logs/broker-live.log`, `results/logs/intros.log`, `results/bazaar-live/<date>/stream-team.jsonl`, `results/bazaar-live/epic-done.json`, `scripts/ops/up.mjs` and `down.mjs`. Memories: trader-proposals-delegated, coordinator-stays-pure, goals-agent-split, live-restart-coordination, hidden-cards-never-sold.

## Communication

Talks to all sessions (map in [`agents/`](../AGENTS.md)): receives hashes and restart requests, returns approvals and relaunch notices.
