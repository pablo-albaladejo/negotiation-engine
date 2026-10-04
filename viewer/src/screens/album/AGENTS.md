# viewer/src/screens/album/ — The album as trading cards

The «Cards» tab (the «Album» card, outside the cockpit), looking like the game's /cards page:

- **Chips on top:** all pages or just one (set color and have/of), and the «only missing» filter.
- **Per set:** a band with its color and its catalog theme, have/of and a progress bar.
- **One sticker for each card on the page:**
  - the ones we have, in full color, with a border of their rarity and «×N» if there are duplicates;
  - the missing ones, in gray with a dashed border, with no values on top;
  - below each sticker: the copies in circulation versus the print run (`minted`/`print_run`) and the book price; and on another line the API's value («API», `your_value`: that of the copy we hold or that of `/api/me/value` for the first copy) versus ours, read from `GameState.valuation` (`src/state/valuation.ts`): if we have it, «lose» (what losing a copy costs, with the page risk) and «+1» (what another copy adds); if it is missing, «+1» (with the page bonus if it completes it) and «~» if the base is estimated. On hover: API, base and its origin, +1 and lose.
- **Each set's band:** the page bonus («page bonus N · ours» if complete, «at stake» if not).
- **El Taller:** each sticker with duplicates in El Taller carries «⚒ N spare · decision», or «⚒ craft N → rarity» if the strategy hands them in this tick; on top, one line per rarity and the cards held back for teams («kept for teams»). It comes from `GameState.workshop` ([`src/workshop/`](../../../../src/workshop/AGENTS.md)).
- **Shinies:** the cards outside the page go separately. Hidden ones only appear if we have them, and then with the label «never sold».

The artwork is ours: a sun and a skyline derived from the card's reference. The game's art is not copied.

- **`AlbumCards.tsx`** — the card.
- **`CardsView.tsx`** — the «Cards» tab: the album and, below, the «Prices» table (`Prices` from `viewer/src/screens/ModelView.tsx`, output of «Model»): book, market, our value, «Next copy» (what one more copy adds) and the gaps (buy edge = next copy − ask).

Data: `board.album.pages[].cards` and `.shinies`, from `albumOf` in [`viewer/server/bazaar/`](../../../server/bazaar/AGENTS.md). Read-only; no figure is computed here.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
