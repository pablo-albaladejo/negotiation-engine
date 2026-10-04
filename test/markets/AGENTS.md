# test/markets/ — Guardrails for the market routes

- **`rival-buy-epic.test.ts`** — rival-buy epic lane test (`EPIC_BUY_PARAMS`, `--rival-buy-epic`; approved by Pablo on 4 Oct for SAL-11). With random cash, open bids, values and holders, it checks that every bid:
  - never exceeds the ceiling;
  - only goes to teams on the list;
  - leaves cash above the floor;
  - is the only open epic bid at a time.
  - with the commission included, never exceeds `--max-spend`.

  If we already own the card or its value is below the ceiling, no new bid is produced. The price steps are start, midpoint and ceiling. With several lanes (`EPIC_BUY_LANES`: SAL-11 and RET-11), each bid respects the ceiling and the list of its lane, at most one is open per card, and all those left open together keep cash above the floor. The open lane (RET-11) posts a single bid without `to` at the ceiling, never above it, and El Rastro does not cancel it (without the exemption it would).

- **`cha-lane.test.ts`** — team-desk CHA lane (`src/teamdesk/counter.ts`). Measured case: with one copy of value 11, an offer of 72 and a rebuy at 10, a counteroffer at 72 is produced. With random copies, values, offers, margin and rebuy, the last copy only goes out if there is a rebuy ≤ value, if the capped gain is ≥ 20 and if it is sold at the team's price, ≥ value + 20. With the page complete, none goes out.

- **`room.test.ts`** — Payday cap per counterparty (`src/markets/room.ts`). With the measured case (t05: +50 and then 0), the room stays at 0. With random records, the room is always between 0 and 50. An epic lane never bids to a team with room < `MIN_ROOM`, and cancels any bid it already had with it. The scanner's edge never exceeds the room left with the counterparty.

- **`workshop.test.ts`** — El Taller (`src/workshop/workshop.ts`). With random hands (free copies, in one of our listings, in a thread or in another venue), it checks that the Workshop:
  - never hands over the last free copy, a locked copy or a hidden one;
  - never mixes rarities;
  - only cancels our listings of the copies it hands over;
  - proposes at most one per tick;
  - without `send`, never calls the API;
  - live, if in the new read a chosen copy is locked, is no longer ours or would be the last free one, it cancels nothing and makes no POST.

## Links

- ↑ [`test/`](../AGENTS.md)
- `room.test.ts` also checks the rival-buy page lane: no bid exceeds `/api/me/value` − `pageLaneEdge`, none leaves cash below the floor and all go to `OFFER_VENUE`.
