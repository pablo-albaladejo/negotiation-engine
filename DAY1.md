# El Bazaar — Week 1, Saturday 3 October

**Entry point for day 2** — summary of where we are, how to play and what comes next. Details in [`handoff/2026-10-02/HANDOFF.md`](handoff/2026-10-02/HANDOFF.md).

## Status

- **Team 2:** rank **17 of 18**, score **6.84** (all of it in negotiation; market 0, duels 0, ladder 0.047).
- **Portfolio:** cash 40, level 2, 7 deals done, album 19/40 (0 complete pages).
- **Urgency:** the SAL page needs only **SAL-09** (rare, value ~177). The 3 leaders already have complete pages.

## How it is played

El Bazaar is a trading-card tournament set in Madrid. We negotiate with dealers (Abuela Carmen, El Chato) to buy missing cards and sell duplicates. One agent per dealer (code, HTTP); 1-on-1 duels against other teams (price and delivery dates). Decisions come from the engine (numbers), the text is a template. The private valuation is never revealed.

- **Dealers:** each has patience, a price limit and a menu of cards it buys/sells. We negotiate until we close.
- **Duels:** message + offer per tick, one acceptance per tick. The numbers play on surplus (how much we gain vs. the rival).
- **Scoring:** relative to the field, refreshed every 5 ticks. There are neg_points (comparison against a market reference), ladder points (level, cards) and market points if we open one.

## The game tomorrow (Saturday)

| Time | Event |
|---|---|
| **4.0** | Round 2: cash carries over, the El Retiro set is released |
| **4.05** | **+150 P for every team** (spend on SAL-09) |
| 6.5 | Duels I (price only) |
| 13.0 | Duels II (price + dates) |
| 18.0 | Round 3 and the Chamberi set |
| 20.0 | Duels III |
| 23.0 | Grand Final |
| 24.0 | Freeze |

**Tick:** Saturday 30 s, Sunday 15 s. Limits per tick: 1 acceptance, 1 message per thread, 6 open threads, 30 offers and 12 new ones.

## How to start on Saturday morning

On a new machine:
```bash
git clone https://github.com/pablo-albaladejo/negotiation-ring.git && cd negotiation-ring
pnpm i --frozen-lockfile
pnpm test            # expect 314/314
```

Before 09:00 (Madrid time), start **everything** (the game was paused):
```bash
pnpm bazaar:duels                                    # duels
pnpm bazaar:trades --confirm --min-margin 3 --max-spend 40 --max-offers 8   # El Rastro
pnpm bazaar --serious --cash-floor 20 --dry-run --once   # review the plan
pnpm bazaar --serious --cash-floor 20                    # dealers, if the plan is correct
set -a && . ./.env && set +a && VIEWER_RESULTS_DIR="$PWD/results/eval-dummy" pnpm viewer   # http://127.0.0.1:5199/#bazaar
```

To watch the conversations live:
```bash
set -a && . ./.env && set +a && pnpm bazaar:feed   # read-only
```

## Changes today (Friday)

The duels were fixed (read `from`, not just `sender`), safety guardrails were added (offer structure, asset locks, real price), El Chato's traits were measured (patience 8, maximum step 1 P, anchor ~22 for uncommons), and the planner was improved:
- Never sell the only copy of a card on a page that is ≥ 70 % complete.
- Sale anchor capped at 1.3× the dealer's list price.
- New: "opening-last-chance" rule to negotiate until the end.

The viewer is unified in the `#bazaar` tab with `/api/bazaar/board`.

## Saturday priorities

1. At **4.05**, with the **+150 P**, buy **SAL-09**. Sell duplicates at El Rastro.
2. Duels: from the first tick that scores (Duels I, hour 6.5). Verify that acceptances and matches go through.
3. **Market v04:** decide whether we switch to `board` so the broker captures value in the Market Test.
4. Serious mode: El Chato only where it improves the ladder; everything else to El Rastro.
5. Monitor: reduce disk usage, verify ≤ 300 feed events per cycle.

## Measured data (dealers)

- **Abuela:** list common 10, uncommon 25, pack 26; falls to list price in 1–3 messages; leaves if we repeat a price.
- **El Chato:** only uncommons and rares; uncommon 13→16 P in 3–5 messages; rare 39→46 P; sells uncommons at 28–32, rares at 82–93.
- **El Rastro:** uncommons at 18–21, fee 5 % + 1 P. It pays more for our duplicates.

## Where everything is

- **Plans and traces:** `results/bazaar-live/2026-10-02/` (decisions.jsonl, thread-*.jsonl, score.jsonl, duels-state.json).
- **Day 1 handoff:** `handoff/2026-10-02/HANDOFF.md` (sessions and scratchpad only on Pablo's machine, outside git).
- **Code:** `src/` (dealers, duels, trades, broker, venue…).
- **Lessons:** `docs/bazaar/lessons.json`, updated after every thread.
- **Bazaar original:** `docs/bazaar/kit/`.

## Open problems

- Feed event dedupe (the sniffer is no longer in this tree; it runs on the old Mac).
- Decide whether v04 moves to `board` (then the broker wins).
- Make sure El Rastro does not fall below the 300 req/s limit.

---

**Next step:** `pnpm test && pnpm docs:check` to verify that the tree is clean. Then continue with duels, traders and the serious agent.

For the full architecture context, read [`AGENTS.md`](AGENTS.md) and [`src/AGENTS.md`](src/AGENTS.md).

## API scan (Saturday 00:11, game paused, tick 159)

`pnpm bazaar:scan` (with `.env` and `.env.broker` loaded) makes a GET to every endpoint and saves the responses in `results/bazaar-live/<date>/api-scan-HHMM.json`. First scans: `results/bazaar-live/2026-10-03/api-scan-0011.json` and `results/bazaar-live/2026-10-02/api-scan-0016.json`. All endpoints return 200.

- **`/api/cards/{id}`** wants the asset's **numeric id** (e.g. `/api/cards/438` → SAL-07 with its history), not the ref: `/api/cards/SAL-09` returns 422. For a ref's value use `/api/me/value?card=SAL-09`.
- **`/api/flags`** only accepts POST (GET returns 404). **`/api/broker/book`** wants `X-Broker-Key` (with the team key it returns 401): it returns `offers`, `bench_offers` and `recent`.
- **`/api/dealers`** returns the list under the key `personas`.
- **Market Test at hour 3, before round 2:** the same synthetic book for all venues (10 traders, 16 ticks). An `auto` venue gets half the points; for full points you need `board` and an active broker.
- **Hour 4.05:** everyone receives an El Retiro pack and 150 P.
- **Set affinity:** RET 1.6 · SAL 1.3 · CHA 1.1 · MAL 0.9 · LAT 0.7 · LAV 0.5. El Retiro is the set most valuable to us.
- **Value rules (`/api/catalog`):** the 2nd copy is worth 25 % and the 3rd 10 %; complete page +25 %; all versions of a card +10 %. There is a **gold pack** (expected value 410).
- **SAL-09:** at El Rastro there are only buy offers (7 and 8 P). Nobody sells it and no rare is for sale.
- **Duels live during the pause:** 177 (we sell, limit 66), 178 (we buy, limit 78), 300 (we buy, limit 116; the rival asks 119).

## Venue v04: it cannot be switched to `board`

- `PATCH /api/venues/v04` only changes fees. Without `fee_bps` it returns 400 ("send fee_bps"). With `fee_bps` it returns 200, but it **ignores `rules`**: v04 stays `auto`. (A fee change 0 → 0, effective at tick 161, was announced, with no effect.)
- **It can only be done by reopening:** close v04 and open another venue with `{"rules": {"mechanism": "board"}}`. It costs 250 deposit (refunded) + 20 P. v04's deposit only comes back after a waiting period, and each Market Test counts only the venue open during the session.
- **Pending decision for Saturday:** with 40 P of cash we cannot afford it. For the hour-3 test we stay on `auto` (safe half). Afterwards, with the +150 from hour 4.05 and duplicate sales, choose between buying **SAL-09** and opening a **`board`** venue with the broker (`pnpm bazaar:broker --confirm`). If the new one is opened, close v04 afterwards, never before.
