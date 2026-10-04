# viewer/src/model/ — Pure logic of the viewer

Pure functions without React: they read tolerant JSON and return what the screen draws.

- **`bazaarBoard.ts`** — unified list, filters and timeline of the board.
- **`bazaar.ts`** — history of the figure.
- **`bazaarConversations.ts`** — conversations of the board.
- **`cockpit.ts`** — cockpit: standing, what is open now, who is who (`partyOf`, `teamLabel`), curve (`offerCurve`, `niceScale`) and rarity colours. `originOf`: the «Posted by» column of «Right now» (route, «posted 6 P (t1079) → reprice 8 P (t1093)», neg if it fills and ticks remaining).
- **`gameModel.ts`** — our internal model (`/api/bazaar/model`): time, personas, hints, prices, venues, packs, flags and expected path (`withPlannedPath`).
- **`dealerFit.ts`** — curve fit per persona (dealer side only): `predictionOf`, `withPrediction` (its expected path with band, its limit and the withdrawal round on the curve), `predictionCaption`, `predictionLines`, `dealerFitStrip` (drawer strip: persona and band of the conversation, `welcome` if the fit flags it) and `dealerEstimates` (parameters, limits per band and history per persona).
- **`personaModel.ts`** — what TODAY's model knows about the persona of a conversation (even an old or closed one): `personas[].model` if present, otherwise `estimates`/`fit`. `strategyLines` («value [lo–hi] · n · source» or «unknown»), `bandView` (measured floor/ceiling of its band with book), `herWalkText`, `sideLabel` («we sell · she buys») and `currentPrediction` (its curve with the fit formula when the server brings no *prediction*).
- **`scoreTree.ts`** — what feeds each action: `componentOf` (dealer → LADDER with level, share and whether it makes the top 3 if the model is loaded; duel → DUEL; deal with another team outside our venue → NEG; deal between OTHER teams in our venue → MARKET; open offers, packs, El Taller, album, gifts → no score) and `scoreTree` (ladder/duel/neg → NEGOTIATING /30, bench/organic → MARKET /30 → SCORE → rank, with Δ of the day and of the tick from `board.score_parts`).
- **`index.ts`** — re-exports the above.

## Links

- ↑ [`viewer/src/`](../AGENTS.md)
