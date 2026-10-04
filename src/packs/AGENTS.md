# src/packs/ — Packs

State of the packs and the PACKS route: open, sell sealed and buy (paused). Every figure through `enforceGuardrails`.

## Files

- **`packs.ts`** — `buildPacks` (`GameState.packs`): our sealed packs (id, type, `your_value`) and, per type, catalog slots adjusted to supply with `adjustSlots` (if a rarity reaches its print run, `PRINT_RUNS`, the slot falls to the lower one), expected book, our estimated value (card by card: average per rarity of our values, and a card we already have at the value of the next copy with `nextCopyValue`), dealers that sell it (list and opening), best ask and bid at El Rastro and last deal from the feed. `proposePacks`: BUYING from a dealer is **paused** (blind buy: what comes out of a pack scores as *luck*, RULES.md:122; decision of 3 Oct): it only leaves a note with the expected deal and the negotiator's path through `enforceGuardrails`, and the dealers agent only proposes `{buy: {pack}}` with `blindBuys`, which `bazaar:play` does not pass (see [`src/dealers/`](../dealers/AGENTS.md)); OPEN each sealed pack unless selling it sealed wins; SELL sealed at El Rastro when the best bid exceeds our value (never below). Packs from the agenda's grant_all and from the unlock prize are announced to be opened on arrival. `executePacks` (live only with --confirm): open with `POST /api/packs/{id}/open` and list. **ASSUMPTIONS** (`PACK_ASSUMPTIONS`): `/api/me/value` does not accept packs (verified: unknown_card), so the value of someone else's pack is an average per rarity (it still carries the page bonus of the missing cards: an upper bound, not a buying figure); opening does not spend the acceptance quota (unverified).

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`coordinator/`](../coordinator/AGENTS.md)
- → [`test/`](../../test/AGENTS.md)

**Venue (Pablo, 4 Oct):** the sale of a sealed pack is posted only at v21 (`OFFER_VENUE`, from [`src/shared/offer-venue.ts`](../shared/AGENTS.md)), which has a 0 % fee. The price still comes from the code, never below our value.
