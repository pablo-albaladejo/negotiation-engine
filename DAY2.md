# Day 2 — Runbook: start, watch, stop

One command starts everything; another checks beforehand that it will work. Script details: [`scripts/ops/AGENTS.md`](scripts/ops/AGENTS.md). State and data of the day: [`DAY1.md`](DAY1.md).

## Start

```bash
pnpm bazaar:doctor          # ✓/✗ for everything; --fast skips typecheck, test and docs:check
pnpm bazaar:up              # doctor + the four processes, in DRY RUN (no POST)
pnpm bazaar:up --fast --detach   # same, in the background with nohup
pnpm bazaar:down            # stops what was started with --detach (or from another terminal)
```

In the foreground, **Ctrl-C stops all processes**. The doctor exits with 1 if anything fails (`bazaar:up` starts nothing) and with 3 if only `.env.broker` is missing (it starts without the shadow broker).

| Process | What it does | Where it writes |
|---|---|---|
| `recorder` | `pnpm bazaar:record`: records the stream (team and public). The only thing that keeps the whole feed. | `results/bazaar-live/<date>/stream-*.jsonl` |
| `viewer` | `pnpm viewer` at http://127.0.0.1:5199/#bazaar. If a viewer is already on 5199 it is reused; if another process holds the port, it uses the next free one. | — |
| `play` | `pnpm bazaar:play` in a loop, **dry-run**: state, agenda, triggers, intents and arbitrage every tick. In dry-run it waits while the gates are closed or the clock is paused (`--no-gate` to run it anyway). | hint corpus, value cache and per-persona posterior in `results/bazaar-live/` |
| `broker` | `pnpm bazaar:broker --shadow --poll-ms 5000` in a loop: **shadow broker** for the Market Test. `--shadow` = `--dry-run --no-announce`; always, also with `--live`, except `--broker-live` (see below). | — |
| `news` | `pnpm bazaar:news`: Radio Rastro news (recorder stream and `GET /api/news` every 30 s) and a summary (LLM or rules) for the «Radio Rastro» panel in Now. Display only. | `results/bazaar-live/<date>/news.jsonl` and `news-summary.json` |

- **Logs:** `results/logs/<date>/<process>.log` (timestamped) and `up-events.log` (starts, crashes, restarts). With `--detach`, up's output goes to `up.log`.
- **Heartbeat:** `results/logs/up-status.json` every 10 s: pid, mode, viewer, state and restarts of each process, last tick seen, clock.
- **Crashes:** a process that crashes is restarted with growing backoff (2 s → 60 s), at most 5 times in 10 min; after that it stays `failed` in the heartbeat and in `up-events.log`.
- **Live traces:** `results/bazaar-live/<UTC date>/` (`decisions.jsonl`, `thread-N.jsonl`, `conversations.json`, `personas.json`, `triggers.json`, `flags.json`).

## Going live (only with team approval)

```bash
pnpm bazaar:up --live --confirm     # big warning and you must type LIVE; anything else cancels
```

Without `--live --confirm` it is never live. With `--detach` you confirm in the terminal before it goes to the background. The shadow broker stays in dry-run even when live.

`--broker-live` swaps the shadow broker for a live one (`pnpm bazaar:broker --confirm --poll-ms 5000`, matches offers for real): it is only valid together with `--live --confirm`; without them it warns and leaves the broker on `--shadow`. When live with `--broker-live` there is only one broker (the shadow one is not launched as well). By default nothing changes.

**Before going live:**

1. `pnpm bazaar:doctor` all ✓ (without `--fast`).
2. One dry-run cycle with the gates open: the intents in `play.log` make sense (figure, counterparty, asset) and there is no `route … failed`.
3. Cash and floor: `--cash-floor` (20 by default), `--max-spend-hour` (60) and `--max-spend` (150) of `bazaar:play` are the agreed ones; change them with `--play-args "--max-spend 100"`.
4. Nobody else plays with the same key (neither `pnpm bazaar --serious` nor another `bazaar:up`): two processes would step on each other's one-acceptance-per-tick quota.
5. Recorder connected (`[team] conectado` in `recorder.log`); the limit is 6 streams per key.

**What to look at in the viewer (Now tab):** tick and gates advance; cash and the hour's spend within the caps; open conversations (≤ 6) with no stuck threads; that each acceptance respects the value; warnings, strikes or cooloff from a dealer. If anything looks odd: `pnpm bazaar:down` (or Ctrl-C) and back to dry-run.

## Market Test

- The venue stays on **auto**: in the Market Test, auto gives **half the points**.
- The shadow broker (`broker` in `bazaar:up`) measures in dry-run what our broker would have matched against the bench, to compare with auto. It sends nothing.
- Switch to board only if **the code recommends it** (`decideMechanism` in `src/venue/mechanism.ts`: ≥ 2 measured sessions, ratio ≥ 1.10, worst session ≥ 0.95 and enough cash) **and Pablo approves**: `pnpm bazaar:play --confirm --allow-venue-switch` (`venueSwitchGate`, `src/venue/route.ts`). Today `executeVenueMechanism` only prints the steps: closing the kit's venue is untested.

**Decision (Saturday, tick 630, markets deep-dive):** we stay on **auto with v04 open until the close** and accept the minimum of 7.5. Cash is 27 P against the ≥ 290 P the switch requires. Gathering it would force us to stop surplus purchases on every route, and we would gain about +2 to +5 market points. Besides, a board with a weak broker drops below 7.5 (t13 5.49, t03 3.61). v04 is not closed: without an open venue the bench gives 0. The scanner and rival-page stay as they are: without cash they do not buy, and the scanner already values duplicates well after `86f086e`. The runbook below remains as reference only. Trace: `.omc/specs/deep-dive-trace-como-de-bien-o-mal.md`.

### Runbook: switch v04 to board after the Market Test (needs Pablo's OK)

Why (tick 479, `GET /api/leaderboard` and `/api/venues`): the market score above 7.5 comes from the **value created between other teams in our venue** (RULES: you cannot trade in your own venue), not from the mechanism. t14 and t17 (auto, with 1 deal) get 11.86 and 10.26; t13 and t03 (board, 0 deals) get 5.49 and 3.61. The board leaders (t10, t12) match **«any copy»** bids (`want.cards`), which the auto stall does not do. That is the reason to switch. A board that only matches by quote equals auto (half the bench) and, if it fails, drops below 7.5.

1. **When:** after the Market Test of tick ~681 (sessions every 2 h: 201, 441, 681…). If a session has no open venue, it scores 0. So, do not close v04 in the 20 ticks before a session.
2. **Cash:** opening costs a 250 P deposit + 20 P; v04's deposit comes back after a waiting period of unknown length. **≥ 290 P** free are needed (270 + floor of 20). At tick 479 there were **201 P** (89 short). The only duplicates (LAT-04, SAL-03) are worth less than 4 P: they do not cover the gap. We must stop spending at El Rastro until we have it (this clashes with raising `--max-spend` to 250), never by selling single page copies.
3. **Before:** check in `broker.log` (shadow) that the «any copy» matching finds pairs in the real book.
4. **Steps** (each with an OK):
   - `pnpm bazaar:venue --replace --mechanism board --dry-run`: prints the plan and checks cash (≥ 290), mechanism and bench window (≥ 20 ticks). Tested at tick 630: rejects on cash (27 P).
   - With the OK, the same with `--confirm` instead of `--dry-run`: closes v04, checks it closed and opens the board venue with the description «any copy, 0 fee». Stores the new key in `.env.broker`.
   - Stop the shadow broker and launch `pnpm bazaar:broker --confirm`, or restart `bazaar:up --live --confirm --broker-live` (coordinated by the session that handles restarts).
5. **Monitor:** `broker.log` (matches per tick), `mm_points` and `market` in `/api/leaderboard`. If the broker goes down, the venue does not match: restart it before the next session.

## Where learning happens each tick

| Learning | Inside `bazaar:play`? | Notes |
|---|---|---|
| Hint corpus (`results/bazaar-live/hints.jsonl`) | Yes, every tick, also in dry-run | Append-only. Never enters a figure. |
| Price sheet and private value cache (`values.json`) | Yes, every tick (≤ 4 value GETs), also in dry-run | |
| Per-persona posterior (`persona-posterior.json`, `src/dealers/history/persona-fit.ts`) | Yes, every tick, also in dry-run | Curve, mirror and limit per band for each dealer. |
| Agenda cursor and triggers (`triggers.json`) | Yes; on disk only when live | In dry-run it lives in memory: if `play` restarts, the triggers fire again (only printed). |
| Memory of conversations, personas and flags | Yes, live only | |
| Lessons (`docs/bazaar/lessons.json`) | Yes: live they are recorded; in dry-run it only prints «would append» | Same functions as `--serious` (`PendingLessons`, `appendLesson`). |
| Measured patience (`PatienceLog`) | Yes, per conversation | Goes to the trace only when live. |
| Cards for new dealers (triggers) | Yes, live only | In dry-run it only says what it would write. |
| Full stream of the day | No: separate process | `recorder` in `bazaar:up`. |

**Gaps (they do not run on their own):**

- **Classifying hints** (hint, egg-clue or voice): the corpus stores the classification as null; the LLM step does not exist yet.
- **Day dump** (`pnpm bazaar:dump`, ~600 requests): by hand at the close of the day; it is not in `bazaar:up` so as not to spend API quota.

## Assumptions to verify live

- Accepting a duel does **not** spend the team's acceptance quota (official duels PDF); one per duel and tick (`DUEL_ACCEPT_QUOTA_ASSUMPTION`).
- neg_points adds the value won at private value, with no cap and without subtracting the fee (measured on Saturday, a single aggregate; verify with an isolated Δ after the next deal): [`docs/bazaar/neg-points-formula.md`](docs/bazaar/neg-points-formula.md). It replaces the assumption `dealerCap = min(value, book)`.
- In dry-run `play` waits with the gates closed; live, `bazaar:play` waits by itself (`clockGate`). Check at opening (09:00) that `play` starts by itself (`up-events.log`: «puertas abiertas», i.e. gates open).
- Recorder + `bazaar:play` + shadow broker + viewer do not exceed the request limit: watch for `rate_limited` in `play.log` and `broker.log` (in the test `board v04: rate_limited` showed up with the doctor and the loop at the same time).
- With `--detach`, `pnpm bazaar:down` finds the pid in the heartbeat; if `results/logs/` is deleted, you have to stop by hand.

## Verify live on Saturday

- [ ] **Market Test, after the first bench:** in `results/bazaar-live/bench-sessions.json`, `pairsAuto` > 0 and `autoUnknown` false. If not, fix the shape of `recent` from `/api/broker/book` in `parseRecentBenchFills` (`src/broker`).
- [ ] The broker key reads `/api/schedule`.
- [ ] Venue close endpoint and its deposit cooldown, **before** any switch.
- [ ] Cash: 40 P tonight. Switching requires 250 + 20 + floor; the 150 P grant arrives at 09:05.
- [ ] Dealers: welcome-counter with a new dealer; egg probes; pressure flags (only with approval); how far the prediction deviates from the curve fit; courtesy.
- [ ] Does accepting a duel share the team's acceptance quota? Does opening a pack use it? Does the auto venue cross without our acceptance?

## With each dealer

- **New dealer:** our first conversation must be **selling** it something. Abuela's welcome bought a common at 13, ~2.2× her normal ceiling (~5.8). That conversation measures her welcome limit and is left out of the curve fit.
- **Chato:** big, constant steps, and patience (he copies the step we take, he does not move until r ≈ 2–3). `bazaar:play` already turns on the first big concession by itself against him.
- Abuela and Chato estimates: [`docs/bazaar/dealer-fit-2026-10-03.md`](docs/bazaar/dealer-fit-2026-10-03.md).
