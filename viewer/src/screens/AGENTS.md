# viewer/src/screens/ — Screens

- **`BazaarScreen.tsx`** — the Bazaar cockpit and its tabs (Now, Cockpit, Cards, Model, Venues, Forex, Market test, Eggs, News, Duels, Goals, Teams, Dealers), with short labels with an icon and a sentence under the tabs saying what each answers; drawer for each conversation with the curve and the planned path.
- **[`now/`](now/AGENTS.md)** — the "Now" tab: what is happening right now (tick, tick plan, live conversations, our offers, what changed).
- **[`market-test/`](market-test/AGENTS.md)** — the "Market test" tab: our bench sessions on auto (v04) versus board (v26), with the book tick by tick and our matches.
- **[`profile/`](profile/AGENTS.md)** — our profile under the scoreboard: the easter eggs we have found (probe and prize) and those of each persona.
- **[`venues/`](venues/AGENTS.md)** — the "Venues" tab: the book of all open venues, each offer marked against our hand and our values (NEG as the acceptor, dup, last copy), with filters.
- **[`forex/`](forex/AGENTS.md)** — the "Forex" tab: the A → B → C chains of `bazaar:play` (buy, hold, sell) with the current step highlighted, net margin and worst case.
- **[`news/`](news/AGENTS.md)** — the "News" tab: news signals and Radio Rastro.
- **[`goals/`](goals/AGENTS.md)** — the "Goals" tab: goals, proposals and strategy registry from `GameState.goals` (display only).
- **[`nav/`](nav/AGENTS.md)** — links between tabs: any "tN" opens the "Tick N" drawer, a team its profile in Teams and a dealer its row in Dealers.
- **[`teams/`](teams/AGENTS.md)** — the "Teams" tab: everything we know about each team; any team name in the viewer opens this tab on that team.
- **[`album/`](album/AGENTS.md)** — the "Cards" tab: the album as trading cards, like the game's /cards: a band per set and a card per card (those we have and those missing), with value, print run and shinies.
- **`DealerEstimates.tsx`** — "Dealer estimates" panel of the Model view: per persona, parameters (value, interval, n and their convergence), limits per band (mark *fewSamples*); the dealer side only.
- **`Rivals.tsx`** — what each team has and asks for according to public structure (`GameState.rivals`): the "Opportunities" panel of the Teams tab (our cards that another team asks for or that leave it within ≤ 2 of a page), `rivalCells` (score evolution, closest page, what they ask for and duplicates of each row of the Teams table) and `TeamDetail` (score, rank and album over time; each card seen with the tick at which `/api/cards` confirmed it is still theirs) for the profile. Read only.
- **`DealerFitStrip.tsx`** — `PersonaStrategy` (inside the drawer's "Strategy" card: the persona's parameters according to today's model, band limit with its book, `welcome`) and the drawer's "Dealer fit" strip, next to the offers table: β, max_rounds, markup, mirror and withdrawal round of that persona (interval and n), measured limit of that band (*fewSamples*) and, if it is the first conversation with that dealer, the `welcome` mark ("limit only, not the curve").
- **`NewsSignals.tsx`** — "News signals" card of the News tab (`GameState.news`): tick and age, source, headline, direction (demand, supply, event, unknown), mentions by type, the "unverified" mark and the LLM summary. A hint, never a figure.
- **`ScoreTree.tsx`** — score tree in the "Score" card (value, Δ day, Δ tick; MARKET only our venue) and `ComponentChip`, the colored chip with the part each action feeds (the "Feeds" column of the history and the deal detail).
- **`TeamDesk.tsx`** — "Team desk" card of the cockpit, under "Right now": per team, each offer made to us (to-me) → our sell counter-offer and its drops → outcome, with a NEG chip (`negIfFilled`, or `negDelta` once filled), color by status (would, sent, filled, expired…) and total neg earned per team. Floor and server value only as secondary text ("local only"). Read only.
- **`Workshop.tsx`** — "The Workshop" (El Taller) card of the cockpit, under "Our agents": free duplicates by rarity versus the 3 needed (`ready → <next>`), occupied copies that do not count, the public "taller.crafted" and a "Strategy" line per rarity with the decision from `GameState.workshop` (craft, hold or short, and why). Read only: the POST `/api/taller` comes from `bazaar:play --workshop --confirm`.
- **`ModelView.tsx`** — the Model view (environment → state → decision, timeline, coordinator, goals, markets, venues and packs) and `ConversationModelPanel`; it also exports the cards used by other tabs: `Hints` (hints: chips per dealer, labels for why it is a candidate and full text) and `EggsAndFlags` (probe plan as cards, eggs and flags one under the other) for Eggs, `Personas` for Dealers and `Prices` for Cards.

Plain text only: no injected HTML.

## Links

- ↑ [`viewer/src/`](../AGENTS.md)
- ↓ [`now/`](now/AGENTS.md)
- ↓ [`venues/`](venues/AGENTS.md)
- ↓ [`profile/`](profile/AGENTS.md)
- ↓ [`market-test/`](market-test/AGENTS.md)
- ↓ [`album/`](album/AGENTS.md)
- ↓ [`news/`](news/AGENTS.md)
- ↓ [`goals/`](goals/AGENTS.md)
- ↓ [`nav/`](nav/AGENTS.md)
- ↓ [`teams/`](teams/AGENTS.md)
- ↓ [`forex/`](forex/AGENTS.md)
- → Logic: [`model/`](../model/AGENTS.md) · Pieces: [`ui/`](../ui/AGENTS.md)
