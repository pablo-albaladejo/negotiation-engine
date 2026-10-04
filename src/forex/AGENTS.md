# src/forex/ — Forex chains (A → B → C)

Each tick it looks for inefficiencies between dealers and venues (Pablo's decision, 3 Oct): buy a card where it is cheap (A), hold the copy (B) and sell it where it pays more (C). The chains go in `GameState.forex`; the viewer draws them with the step we are on and the expected value of each step. Structure only (settlement and offer prices), never a dealer's text.

## Files

- **`ledger.ts`** — `updateDealerLedger(dir, events, tick)`: all public card-for-money deals with a dealer today (any team), from each tick's feed and, the first time, from the recorder's `stream-public.jsonl`. It is stored in dealer-trades.json in the day's folder (survives a restart). `dealerTradeOf` turns a settlement into a `DealerTrade` (`side` from the dealer's point of view: `sells` = a team bought from it, `buys` = a team sold to it). `dealerBuyQuotes(trades, ref, value, tick, window)`: where we could rebuy a card from a dealer (median and maximum of its recent sales), only if the maximum is ≤ our value; it is the dealer leg of the CHA route (sell to a team only what we rebuy at ≤ value and against a bid ≥ value + 20; never to the dealers in `CHA_REBUY_OFF`, Pícaros until Pablo approves P2; not yet used).
- **`chains.ts`** — `findChains(input)`: per card, each cheap side (a dealer that sells, with at least `FOREX_MIN_SAMPLES` deals in the last `FOREX_WINDOW_TICKS`, or a live ask on a venue) against each expensive side (a dealer that buys or a live bid), with median and quartiles. Net margin = sale − purchase − fees: dealers charge nothing (fee 0 in all of today's settlements), El Rastro `rastroFee` (≈ 2 P + 4 %, rounded up) and each venue its `fee_bps` and `fee_per_card`. Only a chain with margin ≥ `FOREX_MIN_MARGIN` remains; never a hidden card. Each `ForexChain` carries three steps (buy, hold, sell) with their expected value, the worst case, `maxBuy`/`minSell` for the planner, `current` (the step we are on: buy thread with A, held copy beyond the first, sell thread with C; −1 stopped) and `doneToday`. `writeForex` leaves forex.json in the day's folder for the viewer.

Only chains with both sides on dealers and for a card we already have (`automated`; a bought copy of a card we are missing would stay in the album unsold) are executed by the dealers agent ([`dealers/planning/`](../dealers/planning/AGENTS.md) (forex.ts)): the coordinator passes them to it each tick with `setForexRoutes`. Those with one side on a venue are only displayed.

**Buying switched off (Pablo, 3 Oct):** `FOREX_AUTOMATED = false`. According to the «Payday» deck (slide 7), with a dealer a loss counts in full and a gain only on the ladder; buying a spare copy (worth ~¼, slide 8) subtracts neg and reselling it adds barely anything. The detector and the viewer still show the chains; `forexBuyRoute` returns no route, and only a spare copy we already hold is resold above its value.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`state/`](../state/AGENTS.md) (`GameState.forex`) · [`coordinator/`](../coordinator/AGENTS.md)
