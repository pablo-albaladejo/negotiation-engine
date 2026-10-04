# viewer/src/ — React app

A single screen: the Bazaar tab (`#/bazaar`, filters in the hash query).

- **`App.tsx`** — header (light/dark theme) and `BazaarScreen`; catches render errors.
- **`route.ts`** — `parseRoute` / `routeTo.bazaar`.
- **`api.ts`** (`fetchApi`: always `{ data, errors }`), **`theme.ts`** (theme saved in localStorage or, if none, the system's) and **`focus.ts`** (title focus when navigating).
- **`bazaarBoardLive.ts`** — `useBazaarBoard`: reads `/api/bazaar/board` and `/api/bazaar/score` once per tick.
- **`bazaarModelLive.ts`** — `useBazaarModel`: reads `/api/bazaar/model` with the Now tab, the Model view or an open drawer; if the server is rebuilding, it shows the last build and asks again after 10 s.
- **`model/gameModel.ts`** — tolerant model types and pure functions: time summary, timeline, personas, hints (filters), prices, venues, packs, flags, planned path over the curve (`withPlannedPath`, `modelCurve`).
- **`model/dealerFit.ts`** — per-persona fit: the dealer's prediction over the curve and per-persona estimates.
- **`screens/ModelView.tsx`** — the Model view and `ConversationModelPanel` (state and strategy in the drawer).
- **`model/`** — `model/bazaarBoard.ts` (unified list, filters, timeline), `model/bazaar.ts` (history of the figure), `model/bazaarConversations.ts`, `model/cockpit.ts` (post, what is open now, deals that moved the figure, agents, calendar, history and who is who: `partyOf`, `teamLabel`, `bookMakerLabel`; negotiation curve: `offerCurve`, `niceScale`, `curveRoundLines`).
- **`screens/now/`** — the «Now» tab (first): what is happening right now.
- **`screens/BazaarScreen.tsx`** — the cockpit (figure, upcoming appointments, now, album, Δ of the figure, agents, history and market folded).
- **`ui/`** — small pieces (titles, empty states, buttons, grid).

## Links

- ↑ [`viewer/`](../AGENTS.md)
- ↓ [`model/`](model/AGENTS.md) · [`screens/`](screens/AGENTS.md) · [`ui/`](ui/AGENTS.md)
- → Design system: [`design-system/`](../../design-system/AGENTS.md)
