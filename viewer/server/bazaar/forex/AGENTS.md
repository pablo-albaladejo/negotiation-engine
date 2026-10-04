# viewer/server/bazaar/forex/ — Forex chains

- **`forex.ts`** — `forexOf` builds `board.forex` for the «Forex» tab from `results/bazaar-live/<date>/forex.json`, which `bazaar:play` writes every tick (`writeForex` in [`src/forex/`](../../../../src/forex/AGENTS.md)). Each A → B → C chain: buy a card in one place, hold the copy and sell it in another, net of commissions; with its steps (`current` = current step, −1 at rest), margin and worst case, price range per leg (lo–hi, n, commission), `automated` (executed by the dealers agent) or just displayed, `maxBuy`/`minSell`, status and done today. It validates defensively: a malformed chain is discarded, a malformed file gives null; it never throws or sends.
- **`forex-threads.ts`** — `forexThreadsOf` fills `step_threads` of each chain (aligned with its steps): the conversations behind each step, with data the board already reads and no new GETs. Sources: our traces from today (`decisions.jsonl` and `thread-<id>.jsonl`, no dry-run), the summaries of `docs/bazaar/lessons.json`, today's flags.json and our assets from `/api/me`.
  - Buy: threads with the dealer of `buy.at` whose goal is `buy:<card>`.
  - Sell: threads with `sell.at` that sell an asset of that card (id → card by our assets, lessons or the closing summary).
  - Hold: the ids of the card's assets we hold besides the first.
  - Per thread: status (open, deal, closed), outcome and rule, opening and closing ticks, her prices and ours (and the last of each side), deal price and flags. A flag is assigned by persona and tick (up to `FLAG_LAG` ticks after the close); if it names a card, it has to be the thread's.

## Links

- ↑ [`viewer/server/bazaar/`](../AGENTS.md)
- → Screen: [`viewer/src/screens/forex/`](../../../src/screens/forex/AGENTS.md)
