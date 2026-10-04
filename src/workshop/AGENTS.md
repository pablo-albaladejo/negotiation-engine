# src/workshop/ — El Taller

El Taller (`POST /api/taller {assets: [a, b, c]}`) exchanges three duplicates of one rarity for a random card of the next. The result is visible, but it **never scores**: it gives no `neg_points` or ladder. It only gains whatever the new card is worth to us, and a missing page card is worth much more than a duplicate.

## Files

- **`workshop.ts`**:
  - **`buildWorkshop`** builds `GameState.workshop`.
    - Duplicates by rarity, with the same guardrails as a sale: never the last free copy, nothing in an open thread or offer, and never a hidden or keepsake card (`isKeepsake`; Pablo's rule: hidden cards are not sold).
    - **Duplicates go to the teams first** (Pablo, 4 Oct; the same criterion as the dealers): no copy is used of a card we offer to teams (open offer in El Rastro, in a venue or targeted at a team, `teamOfferedAssets`) nor of a card that an introduction in the last 6 h gives us as holders (`introDemand` of [`src/intros/`](../intros/AGENTS.md)), nor of a card that a rival lacks to close a page (`nearPageDemand`: one missing). In addition, arbitrage discards the craft if another route sells or lists that copy or that card in the same tick (`ref:` locks against `sell:`); origin case: on 4 Oct, at 10:48, a craft took three copies that El Rastro was about to list. El Taller never cancels a listing. If our offers cannot be read, there is nothing to convert (`blocked`: fails closed).
    - Cost of each duplicate: the maximum between losing the copy at our value (`loseCopy`) and the best bid for it right now.
    - Expected value: the mean of what one more copy adds (`nextCopy`) across the published, non-hidden cards of the next rarity.
    - Decision per rarity:
      - `craft` if the expected value exceeds the cost by ≥ max(2 P, 10% of the cost);
      - `hold` otherwise;
      - `short` if duplicates are missing.
    - It also keeps the feed's «taller.crafted» entries and the cards held back for teams (`demand`).
  - **`proposeWorkshop`**: at most one `craft` intent per tick, the one with the highest net, with the assets as locks. Without `--workshop` there is no intent, only the note «would craft …», so it does not take the locks away from the listings of those copies.
  - **`executeWorkshop`**: live only, with `--confirm` and `--workshop`. It re-reads `/api/me`, the threads and the offers, checks all the guardrails (team demand included) and only then makes the POST. If something changed, it aborts.
  - **ASSUMPTIONS** (`WORKSHOP_ASSUMPTIONS`): the card comes out uniformly among those of the next rarity (the real distribution is not published), and El Taller does not spend the acceptance quota (unverified).

It is read by the coordinator (`workshop` route, see [`src/coordinator/`](../coordinator/AGENTS.md)) and the viewer (cards of the «Cards» tab and «The Workshop» panel).

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`state/`](../state/AGENTS.md)
- → [`coordinator/`](../coordinator/AGENTS.md)
