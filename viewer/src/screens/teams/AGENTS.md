# viewer/src/screens/teams/ — Teams

- **`TeamsView.tsx`** — the «Teams» tab: everything we know about each team in one place. A single table works as the selector: the ranking (score, negotiation, market, album, pages, deals) next to what is seen of each team (score evolution, closest page, what it asks for and duplicates); for the chosen team, its score parts (rank, score, negotiation, market, album, pages, level, deals) and their evolution, what we have done with it (deals, offers and duels: each opens its conversation), its deals with other teams, the eggs it has found and its collection according to the public structure; below, the opportunities: cards of ours that others ask for (`Rivals`, which used to live in «Model»).
- **`TeamLink.tsx`** — `TeamName`: a team's name as a link that opens «Teams» on that team from any tab (context from `viewer/src/screens/nav/Links.tsx`); ours goes with the «us» color and a dealer's id is drawn as `DealerName`.

Read-only: from the rival only structure is shown, never their text; nothing here sends.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
