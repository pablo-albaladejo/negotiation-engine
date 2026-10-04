# viewer/src/screens/market-test/ — «Market test» tab

- **`MarketTest.tsx`** — the «Market test (auto vs board)» tab:
  - a «now» band with the latest line from the live broker (if a bench is running);
  - a «vs auto» line: how many finished sessions were better, equal or worse than their own auto baseline (if the API's baseline always matches our efficiency, it says so: we are at the auto level, half the bench score);
  - the sessions table: when (real day and time in the browser's time, plus the game time and the tick), mode (auto v04 or board v26), hard, efficiency, auto baseline, «vs auto» (better in green, worse in red, = auto), the % of the optimum in hindsight (board only), official pairings and ours (sent and rejected);
  - the detail of the chosen session: the official efficiency against the auto baseline, separately; «ours against the optimum» in quotation surplus (pairs, surplus, captured X/Y in %, provisional or final; in auto «not comparable», no %), with the «Missed» table (optimal pairs we did not make) and «Suboptimal» (our pairs outside the optimum); the book tick by tick in an SVG chart (one line per operator; asks in red, bids in green; style according to the temper) with our pairings #n and the optimal pairs as On ghosts (dashed and hollow, with a checkbox to hide them), and the table of ours.

Data: `board.market_test`, from `marketTestOf` in [`viewer/server/bazaar/market-test/`](../../../server/bazaar/market-test/AGENTS.md). Read-only; no figure is computed here.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
