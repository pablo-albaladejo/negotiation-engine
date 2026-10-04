# viewer/src/screens/venues/ — «Venues» tab

All open venues with their book, in a Bazaar tab: El Rastro first and then by depth. For each venue, owner, commission and mechanism, with the «off-limits» badge on v01, v02, v07 and v14 (we do not operate there: it would raise a rival's market) and «ours» on ours. Below, asks (selling) and bids (buying) sorted by price, and separately the swaps and the mixed offers.

Each offer is marked against us with the NEG at our values as the one who accepts (commission included). It is a guide, never an agent figure:

- **Bid for a card we have**: price − value − commission. Green only if positive and it is a duplicate (hand ≥ 2); with a single copy, «our last copy». Hidden cards are never sold: a bid for one of them shows as «never sold (hidden/keepsake)» and without a figure.
- **Ask for a card we lack**: value − price − commission.
- **Ask for a card we already have**: «dup», without a figure (a second copy is worth ~3–4, not our value).
- **Offers targeted at us**: highlighted (they also appear in «Team desk»).

Filters: only cards we lack, only bids for our cards, only NEG > 0, hide off-limits and search for a card.

- **`VenueBooks.tsx`** — the screen.
- **`DirectedOffers.tsx`** — the «Between other teams» section, above the books: targeted offers between other teams (who → to whom, side, cards, price, status), the most active pairs and, in green, the cards we hold as duplicates, with the filter «only cards we hold as spares». Structure only.
- **`venuesModel.ts`** — pure functions (`filterVenues`, `keepRow`, `markLabel`, `summaryOf`).

Data: `board.venue_books` from `/api/bazaar/board` (built by the server, see [`viewer/server/bazaar/venues/`](../../../server/bazaar/venues/AGENTS.md)). Read-only: nothing is sent.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
