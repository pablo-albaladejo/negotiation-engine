# viewer/server/bazaar/venues/ — Books of all venues

- **`venue-books.ts`** — `venueBooksOf` builds `board.venue_books` for the «Venues» tab from three files:
  - `results/bazaar-live/<date>/venue-books.json`: written by `bazaar:play` each tick (`buildGameState` in [`src/state/`](../../../../src/state/AGENTS.md)) with the same GETs it already does for the price sheet, so the viewer adds no calls with the shared key;
  - `results/bazaar-live/values.json`: `hand` (our copies) and `values` (`your_value`);
  - `results/bazaar-live/rivals.json`: which teams ask for or hold each card.

  Each offer is classified as ask, bid or swap and flagged: ours, lack, spare, last, keep, dup or none. «keep» is a bid for a card we never sell (hidden or `isKeepsake` from `src/shared/asset-locks.ts`, Pablo's rule of 3 Oct): it carries no figure and is never a sales hint. It carries its fee and the NEG at our values as one who accepts: on a bid, price − value − fee; on an ask for a card we lack, value − price − fee; on a dup, no figure. `OFF_LIMITS` (v01, v02, v07, v14) are the venues where we do not operate, by the team's decision of 3 Oct. Pure and read-only.

- **`offer-origins.ts`** — `offerOriginsOf` builds `board.offer_origins`: where each of our open offers comes from. It reads today's `plan.jsonl` (written by `bazaar:play`) and takes only the listing-type intentions that were executed (ok, and not «would»). It joins them to the offer by structure: a sale by the asset it gives (`assetIds`), a bid by the card it asks for and the team it goes to.
  - Route: trades, rival-page, rival-buy, rival-swap or team-desk.
  - Chain from its last «new», with restocks at the same price grouped.
  - The neg if it fills (the intention's `ev`) and the ticks it has left.
- **`directed-offers.ts`** — `directedOffersOf` builds `board.directed`: the directed offers between OTHER teams in the last ~60 ticks, which never appear in the books. They come from the «offer.listed» events with `to` in the public stream that the recorder saves. Structure only (cards, figure, teams, ticks), never their text. The state is cancelled («offer.cancelled»), filled (a settlement between the same teams with the same card and the same price), expired or open. It flags whether the card is a duplicate of ours (`hand` ≥ 2 in values.json).

## Links

- ↑ [`viewer/server/bazaar/`](../AGENTS.md)
- → Screen: [`viewer/src/screens/venues/`](../../../src/screens/venues/AGENTS.md)
