# viewer/src/screens/forex/ — "Forex" tab

The A → B → C chains that `bazaar:play` finds every tick: buy at A, hold the copy and sell at B, net of fees. Header with tick, time, deals in the window and cards scanned.

- **`Forex.tsx`** — the screen. Each chain is a horizontal flow "Buy at A" → "Hold card" → "Sell to B" → net margin (and worst case); each node with its expected value, price range (lo–hi, n, fee if any) and `maxBuy`/`minSell`. The current step is highlighted; at rest, the next one (the first) is dotted. It shows the status, those done today and whether it is "automated" (executed by the dealers agent) or "shown only". On narrow screens the flow stacks vertically. Each step is clickable and carries a counter ("2 threads", "1 spare"): it opens below the chain its conversations of today, from the most recent to the oldest, with status, price ladder her → us, outcome and rule, and the flags; the thread number opens the conversation drawer that already exists (row `thread:<id>` of the board). In the hold step, the spare copies. Without threads: "No conversations for this step today".

Data: `board.forex` from `/api/bazaar/board` (see [`viewer/server/bazaar/forex/`](../../../server/bazaar/forex/AGENTS.md)). Read only: nothing is sent.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
