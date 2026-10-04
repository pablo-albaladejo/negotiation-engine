# src/flags/ — Flags

Bad-faith detector. A narrow exception to «only the rival's structure is read»: comparing text with structure, and pressure phrases from a closed list in counteroffers; never for a figure.

## Files

- **`flags.ts`** — `detectFlag`: compares the text of a dealer message with the structure of the attached offer (card, rarity, quantity; catalog for name → id → rarity with `indexCatalog`). A candidate exists only with a verifiable contradiction (verifiable); an announced gift does not count. A card switch only counts if the named card is **from the same set** as the offered one (the trickster binds the lower rarity of the same set while the text names the good one, site-map § 7.6), and a card name inside a phrase the dealer repeats does not count: the keywords of our probes in that thread («Do you know about X?», `flagCandidateOf` in [`state/`](../state/AGENTS.md)) and `EGG_ECHO_PHRASES` («chulapa dorada», «golden chulapa»). Message 4743 (tick 506): the reply to the «la chulapa dorada» egg was flagged as LAT-06 versus RET-02, a wrong flag.
- **`detectPressure`** / **`pressureTactic`** — pressure phrases from the closed list `PRESSURE_PATTERNS` (site-map § 9.4): `fake_deadline` (*decide now*, *we close in a minute*), `fake_rival` (another bidder *offered more*) and `false_scarcity` (*the last one anywhere*). It needs the match AND the message to be a dealer counteroffer (with an offer, not its first message); an announced gift does not count. It returns only the tactic, never a number. The candidate is not verifiable: `FlagsRoute` ([coordinator](../coordinator/AGENTS.md)) only sends it with approval (`--approve-flags <ids>` or `--flag-pressure`), and in dry-run it lists it.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`coordinator/`](../coordinator/AGENTS.md)
- → [`test/`](../../test/AGENTS.md)
