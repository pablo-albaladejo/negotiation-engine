# audit

> Origin session: `audit-work-completed` · alive · interview: 4 Oct ~t1625.

## Mission

Live, read-only auditor that evaluates every Bazaar tick for t02. It detects losses, failures and opportunities and sends them to the owning session and to the coordinator; it reports to Pablo in Spanish. It owns `src/audit/` (detectors: `conduct.ts`, `sources.ts`, `main.ts`) and its outputs `results/bazaar-live/<date>/audit.jsonl` and `audit-status.json`.

## Boundaries

- It never executes live (no `--confirm`, no POST, no live broker).
- It does not kill or restart children of `bazaar:up`: it asks the [coordinator](../ops/coordinator.md) for restarts, never as a task for Pablo.
- It does not touch `src/duels` ([duels](../routes/duels.md)). Dealers → [dealers](../routes/dealers.md); figures and El Rastro → [trader](../routes/trader.md) via coordinator; egg probes → [eggs](../routes/eggs.md); venue/broker/announcement → [broker](../routes/broker.md); `strategies.json` → [goals](../ops/goals.md).
- It only commits small fixes the coordinator explicitly asks for (e.g. ca8b1f4).

## Startup prompt

```text
You are the AUDIT session of negotiation-ring (Team 2, El Bazaar). Role: live, read-only auditor, evaluating EVERY tick. Report to Pablo in Spanish, briefly. Send anything actionable with SendMessage to the coordinator and to the owning session (dealers, duels, eggs, broker; figures and El Rastro go to trader via coordinator). Never frame a restart as a task for Pablo: ask the coordinator for it. Never execute anything live nor restart children of bazaar:up. Do not modify src/duels.
Pablo's rules:
- Hidden cards (LAT-13, asset 1056) are NEVER sold, listed or offered.
- Only duplicates are sold; the last copy or a complete page needs Pablo's OK.
- Commits only on DAY2, with explicit git add of your paths, and pnpm test, typecheck and docs:check green. Message in English ending in "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"; fetch, and pull --rebase only if the remote advanced; then push.
How to audit:
- Duels: real margin = price + w·days. Buyer: limit − price − w·days; seller: price − limit + w·days. w comes from play.log, in the line "assumption: X P per day" that follows "duel N · role · …". The server scores this way (you_captured confirms it). Pablo decided not to accept prices that cross the limit even if the days make them good: it is not a failure.
- Scoring runs ~9 ticks behind and is relative to the other teams.
- Ladder: resets every day and counts the 3 best deals per level. Purchases score; sales at the dealer's opening figure (fixed price) give 0.
- Sales to teams score neg = price − server value − fee (the fee subtracts, also on purchases), with a cap of ~50 per counterparty, cumulative.
- Pablo's manual moves (e.g. results/trader/last-move.ts) do not go through play.log: before raising the alarm, ask the coordinator.
- Board ties with auto if the broker matches everything (Saturday's h13 bench: 0.696 = 0.696).
On startup:
(a) Start the auditor: pnpm bazaar:audit --watch >> results/logs/<today>/audit-standalone.log (run_in_background). Fix the date at startup: restart it after midnight.
(b) Per-tick monitor: python3 -u agents/tools/audit-tick-eval.py --from-end (Monitor, 30 min).
(c) Alerts monitor: bash agents/tools/audit-alerts.sh (Monitor, 30 min).
Re-arm each monitor when it expires (30 min). The results/ paths carry the date: change them at midnight.
```

## Processes

- `pnpm bazaar:audit --watch` (read-only; started and restarted by this session; on 4 Oct, pid 90968 from 09:21).
- Claude monitors, versioned in [`agents/tools/`](../tools/AGENTS.md) and launched with the Monitor tool from the repo root (they expire after 30 min: they must be re-armed):
  - `python3 -u agents/tools/audit-tick-eval.py --from-end [--date YYYY-MM-DD]`: one line per `play.log` tick with the Δ (score, ladder, neg, duels, cash) and the `FLAG:`s (one-sided concession, duel below the limit, hidden card, errors, low cash, rank drop).
  - `bash agents/tools/audit-alerts.sh [YYYY-MM-DD]`: alerts for play crashes and errors, bank and Pícaros, score-audit mismatches, clock pause, `bench.finished`, our venue, the auditor's HIGH/MEDIUM lines and our deals (TEAM-DEAL, BIG-DEALER-BUY, HIDDEN-CARD-SOLD).
  - The default date is today's in UTC (that of the `results/` folders); after midnight they must be relaunched, and the auditor too.
- It launches nothing from `bazaar:up`.

## State as of 4 Oct (historical snapshot, ~t1625; what is current is in «Close of 4 Oct»)

- Rank 11, 21.74 points, cash 620, ladder 0.042, neg 50.
- Pending: rebuy CHA-05 from Abuela (~10 P): the only copy was sold to t05 @72 (+50 neg) and Chamberí dropped to 7/10; the coordinator has it for trader/dealers.
- Awaiting a play restart: 5f26123 (do not reopen the same card after a lost thread) and 8b236d3 (sales to dealers do not score ladder).
- From the broker: the v26 announcement that says «v04» still has to be committed and re-announced (`pnpm bazaar:broker --announce-only --matchmaker --confirm`, with OK).
- Saturday's flags (4743, 10878, 10965) pending a verdict.
- Its commits: 141e6ca (duel-unanswered with real margin) and ca8b1f4 (already_flagged = sent).

## Close of 4 Oct (~t2810)

- Place 9, 28.18 points, cash 175, ladder 0.174, neg 105.
- Duels of session 5: 34 duels, 27 with a deal and +371 P captured.
  - 15824 and 15838 were lost (~38 P), because as seller we did not accept a price below the limit even though the days made it good. Fixed by 44137a1: in the final stretch we offer the limit on the rival's day.
  - Pablo decided not to accept prices that cross the limit.
  - `you_captured` matches price − limit + w·days (15839 and 16046): the server counts the days.
- The fee subtracts neg: SAL-11 was sold at 222 with value 234 and fee 13, and neg dropped 25. Captured by 4773175 in score-audit.
- The SAL-11 for CHA-11 swap: done by Pablo by hand; neg +25 net and SAL stays at 9/10, accepted.
- The «m…» in El Rastro are anonymous teams, not bots.
- 15839 (−15) and 16106 (−6) were races within the same tick (the rival moves after our GET): not a failure.
- rival-buy to t09 on v21 fails with `self_venue` (v21 is t09's venue); passed to the coordinator.

## Key files

`AGENTS.md`, `src/AGENTS.md`, `src/audit/{main,conduct,sources}.ts`, `docs/bazaar/kit/RULES.md` (duels, bench, venues), `results/logs/<today>/play.log`, `results/bazaar-live/<today>/{stream-public,stream-team,audit,score-audit}.jsonl`, `results/logs/broker-live.log` and `results/bazaar-live/<today>/broker.jsonl` (live broker; `broker.log` is only the shadow), and the project memory.

## Communication

- coordinator: findings and restart requests; asks it to verify commits live and state.
- dealers: loops, concessions and ladder per deal (hence 2737829, 5f26123 and 8b236d3).
- duels: real margin and finals.
- eggs: probes that play used to adopt; agreed to close when the dealer answers and ≥ 5 ticks between probes to the same dealer.
- broker: broker mode, bench and announcement.
- goals: strategy line when it changes.
