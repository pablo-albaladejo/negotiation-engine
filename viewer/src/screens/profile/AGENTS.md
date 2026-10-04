# viewer/src/screens/profile/ — Our profile

Cards for our team, under the scoreboard («We are Team 2»):

- **`Eggs.tsx`** — «Our easter eggs», grouped by dealer (one block per persona with its eggs and gifts per tick and its summary: everyone's finds, our probes, gifts to the field):
  - each egg we have found: persona, tick, the rank among that persona's finds, our probe phrase that triggered it and the prize (named cards, rarity, roll and whether it is hidden, P, packs and that tick's badge);
  - our badges and the hidden cards we hold (never sold);
  - the gifts, one per block: persona, tick, card and the negotiation it arrived in (thread, our offer, deal), and how many each persona gives to the whole field;
  - per persona, all the finds (team and tick, ours highlighted), those remaining (assuming 15 per persona) and our probes (sent, hit, miss and the latest).

Viewer tabs of their own (split out of «Model» to avoid repetition):

- **`EggsView.tsx`** — «Eggs» tab: this card, the flags sent and the hint corpus (`Hints`, never a figure). With no model loaded it shows only the eggs.
- **`PersonasView.tsx`** — «Personas» tab: the personas we model (`Personas`) and the per-dealer estimates (`DealerEstimates`).

Data: `board.eggs`, from `eggsOf` in [`viewer/server/bazaar/profile/`](../../../server/bazaar/profile/AGENTS.md). Read-only; no figure is computed here.

The «thread #N» labels and the ticks in each egg's flow (and each gift's thread) are links: they open that conversation's drawer, like the history.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
