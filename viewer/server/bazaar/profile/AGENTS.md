# viewer/server/bazaar/profile/ — Our profile data

- **`eggs.ts`** — `eggsOf` builds `board.eggs`, the easter eggs:
  - Ours: each "egg.found" with our team. Its prize is the "egg.given" of that tick or the next (cards, P, packs) plus the badge ("badge.awarded") of the same moment. The phrase that triggered it is our last probe to that persona in the previous 6 ticks (`results/bazaar-live/<date>/personas.json` of all days, without duplicates: probes are stored per day).
  - Per persona: all findings (team and tick) and the summary of our probes (sent, hit, miss, the last one).
  - Our badges ("badge.awarded") and gifts ("gift.given") with their cards and what we were doing with that persona when it arrived: the thread, our offer of that tick (structure, no text) and the deal of the following ticks. Also, each persona's gifts to the whole field (how many, to how many teams and how many to us).
  - It comes from the public stream saved by the recorder plus the feed, without duplicates by id. Structure only: never a dealer's text. Cards are completed with the catalog (name, rarity, print run, hidden).
- **`egg-flow.ts`** — the whole flow of each of our eggs (`OurEgg.flow`): the thread where it fired (what we opened with which dealer: "buy pack sobre_barrio"), each message up to the egg (our text and offer; the dealer's offer and text only at the egg's tick, the reply that gives away the hint: the approved egg-hint exception, never a figure) and how it ended (deal at X P or closed with no deal). `readOurThreadEvents` reads from the team stream (`stream-team.jsonl`, the only one with our text) only the lines of our threads and settlements, cached by file size and date. Those messages also give the status of the probe plan.
- **`grants.ts`** — `grantsOf` builds `board.grants`: the organization's grants to our team ("admin.grant" from the team stream, `results/bazaar-live/<date>/stream-team.jsonl`), with P, packs, cards, who (schedule, news, system) and the reason. It lets a cash jump (the daily allowance, today's +400 P or tomorrow's +150 P) appear labeled as a grant and not as a deal or an error. Only lines that name the event are read and each file is re-read only if its size changes.

## Links

- ↑ [`viewer/server/bazaar/`](../AGENTS.md)
- → Screen: [`viewer/src/screens/profile/`](../../../src/screens/profile/AGENTS.md)
