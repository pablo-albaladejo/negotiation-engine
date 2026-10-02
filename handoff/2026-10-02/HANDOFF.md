# Handoff: end of day 1 (Friday 2026-10-02, 23:45 Madrid)

Everything from day 1 is in this repo, so you can carry on from another machine. The game is paused at tick 159 (game hour 2.65) and opens again on **Saturday at 09:00 Madrid**, with 30 s ticks.

## 1. Where we stand
- **Team 2:** rank **17 of 18**, score **6.84**. All of it is negotiating; market 0, duels 0, ladder 0.047. neg_points **-14.9**, all from the bad buy in thread 178.
- **Holdings:** cash 40, level 2, 7 deals, album 19/40, **0 complete pages**.
- **The SAL page is 9/10.** The only card missing is **SAL-09** (rare, our value about 177). The top 3 teams each have one complete page.
- **Leaders:** t13 30.0 · t12 27.87 · t17 22.08.
- Friday's duels were practice and score 0.

## 2. Schedule (game hours, from /api/schedule)
| Hour | Event |
|---|---|
| 4.0 | Round 2 starts: holdings carry over, El Retiro set released |
| 4.05 | **+150 P for every team** (use it to go for SAL-09) |
| every 2 h | Bench ("Market Test") for venues; hard bench at 16.0 |
| 6.5 | Duels I (price only) |
| 13.0 | Duels II (price and delivery day) |
| 18.0 | Round 3 and the Chamberi set |
| 20.0 | Duels III |
| 23.0 | Grand Final |
| 24.0 | Freeze |

Tick length: Saturday 30 s, Sunday 15 s. Per tick: 1 accept, 1 message per conversation, at most 6 open threads, 30 open offers and 12 new offers.

## 3. Setting up the new machine
```bash
git clone https://github.com/pablo-albaladejo/negotiation-ring.git && cd negotiation-ring
pnpm i --frozen-lockfile
# .env and .env.broker are committed (private repo): BAZAAR_URL, BAZAAR_KEY, broker key
pnpm test            # expect 1209/1209
```
Live processes. All of them were stopped at the end of day 1; start them on Saturday before 09:00:
```bash
pnpm bazaar:duels                                    # duels (fixed: reads `from`, not only `sender`)
pnpm bazaar:trades --confirm --min-margin 3 --max-spend 40 --max-offers 8   # El Rastro
pnpm bazaar --serious --cash-floor 20 --dry-run --once   # review the plan first
pnpm bazaar --serious --cash-floor 20                    # dealers (Abuela + Chato), when the dry-run looks right
set -a && . ./.env && set +a && VIEWER_RESULTS_DIR="$PWD/results/eval-dummy" pnpm viewer   # http://127.0.0.1:5199/#bazaar
# venue broker, only if we switch v04 to board: pnpm bazaar:broker --confirm
```
To follow the conversations live, run `handoff/2026-10-02/scratchpad/convo-feed.mjs` with node, after loading .env.

## 4. What changed today (main)
- **Duels:**
  - `1a9e78c`: accept fallback.
  - `cef83fc`: match a stale rival offer.
  - **`2bd74ab` (the root cause):** the live API marks message authors with `from`. Reading only `sender` made our own price look like the rival's offer, so every accept returned no_offer.
- **Safety:**
  - `cac835e`: message templates don't name a dealer.
  - `6c4b301`: check an offer's structure before accepting.
  - `506646e`: dealer menu guard.
  - `01553c6` and `26e6fb6`: one asset, one place, across dealer threads and El Rastro.
  - `c268a1a`: real price of every buy; `--cash-floor`.
- **El Chato** (`dae9d8b`), per-dealer overrides measured from the feed:
  - patience 8, max step 1 P, never repeat a price, sell anchor about 22 for an uncommon;
  - new rule "opening-last-chance" for every dealer;
  - Chato persona in the simulator.
- **Planner** (`f285b9a`):
  - never sell the only copy of a card on a page that is at least 70% complete;
  - only copies elsewhere need +5 P;
  - sell anchor capped at 1.3x the dealer's list price, in the dry-run and in live runs.
- **Viewer** (`afd06fe`, `8b705ce`): unified Bazaar tab at :5199/#bazaar.
- **Lessons:** `docs/bazaar/lessons.json`, which is updated after every conversation.

## 5. Dealer facts (measured)
- **Abuela:**
  - lists common 10, uncommon 25, pack 26 (opening ask 30); 8 deals per team per hour;
  - drops to her list price in 1-3 messages, and walks if you repeat a price.
- **El Chato** (feed: 16 settlements and 44 threads across 9 teams):
  - buys only uncommons and rares; 6 deals per team per hour;
  - uncommon: holds 13 for 3-5 messages, then +1 per message; the best seen is 16;
  - rare: 39 rising to 46;
  - sells uncommons at 28-32 and rares at 82-93; silver pack list 150, opening ask 188;
  - 8 messages and 16 P are the highest values seen, not his limits.
- **El Rastro:** uncommons settle at 18-21, common asks around 9, fee 500 bps + 1 per card. It pays more for our duplicates than either dealer.
- **Scoring (hypotheses):**
  - The score is relative to the field and refreshes every 5 ticks.
  - A deal can lower it: t08 went from 24.99 to 23.05.
  - neg_points probably compares the price with a market reference.

## 6. Saturday priorities
1. At hour 4.05 (+150 P), **buy SAL-09** to complete the SAL page. Sell duplicates on El Rastro to fund it.
2. Run duels from the first scoring tick (Duels I at 6.5) and watch that accepts and matches go through.
3. **Venue v04** (El Rastro Express, auto, zero fees): decide whether to switch to `board` so the broker can capture value for Market Test. The broker is ready.
4. Serious mode, using El Chato only where he improves the ladder; everything else goes to El Rastro.
5. Monitor (see 7): cut its disk use and check the feed rate against limit 300.

## 7. Handovers received
### From `bazaar-threads` (UI and threads session)
- A second UI, written in Python, at `handoff/2026-10-02/causa-prima/bazaar-ui/` (`python3 bazaar-ui/server.py`, port 5310/5311). It duplicates :5199. Pablo still has to choose one.
- Its value precedence: decisions.jsonl summary.ourValue for sales and specific-card buys, then non-zero dneg_points for random buys, then /api/me/value.
- The open items it handed over are resolved:
  - Thread 260 is closed.
  - The opening-last-chance rule is in main.
  - t13's 70 P offer for SAL-10 has gone; it was below our value of 91 anyway.

### From `causa-prima-ec` (API monitor session)
- **What runs:**
  - The sniffer runs as launchd job `ai.causaprima.bazaar-sniff` on the old Mac. It GETs 7 endpoints every 10 s.
  - The dashboard is launchd job `ai.causaprima.bazaar-serve` at http://localhost:8787/dashboard.html.
- **Code:** `handoff/2026-10-02/causa-prima/bazaar-sim/monitor/` (start.sh, stop.sh, README.md). `cookie.txt` is the browser cookie; refresh it from the browser if 3 polls in a row fail.
- **Data:**
  - `monitor/data/snapshots.jsonl.gz` is a snapshot from 23:45. The live file keeps growing on the old Mac.
  - `data/feed_backfill.jsonl` holds 500 older feed events.
  - **Always dedupe feed events by id.**
- **Still to do:**
  - poll the feed less often while the game is paused;
  - dedupe at write time or rotate the file per day (about 30 MB per hour now);
  - on Saturday morning, check that new events per cycle stay well below 300.

## 8. What else is in this folder
- `scratchpad/`: every working script and note from the session: convo-feed.mjs, overnight-state.md, bazaar-kit-summary.md, inbox/INBOX.md, chato-model.txt, duels-live.log, trades-live.log, and more. `arena/`, `r/` and `res/` are tar.gz files.
- `task-outputs/`: raw output of every background process: duels, trades, viewer, monitors.
- `claude-sessions/`: Claude Code transcripts for the 4 sessions, as tar.gz. Subagent transcripts are included.
- `docs/bazaar/kit/`: the original Bazaar kit (it was in ~/Downloads/bazaar-kit).
- `results/`: all traces: bazaar-live/2026-10-02 (decisions, threads, duels-state.json, score) and earlier evaluations.
