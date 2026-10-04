# test/bazaar/ — Agent guardrails

One file per guardrail; none calls the API (in-memory fake clients).

- **`messages.test.ts`** — the only figure in the text is the decided one (`textMatchesPrice`), also with an egg probe (no digits); every dealer and duel template is friendly and free of blacklisted phrases; never two messages without an offer in a row.
- **`offer-structure.test.ts`** — offer shape (`checkStructure`); in a rarity+set purchase, the card it names that we already have is never accepted or offered above its duplicate value (thread 493, `named-card-revalue`).
- **`asset-locks.test.ts`** — an asset in one place only; El Rastro never lists a locked asset or the last free copy (the album's).
- **`caps.test.ts`**, **`spend.test.ts`** — spending caps and minimum cash.
- **`menu-guard.test.ts`** — we never ask for what the dealer's menu does not offer.
- **`coordinator.test.ts`** — `clock.limits` quotas (accepts, messages per conversation, threads, sign-ups), an asset in one place only across routes (and a single sale of each card per tick: the markets bid beats the El Rastro listing), and duels v2: never accept outside the limit, never two concessions without a counteroffer, always `days` if the duel negotiates them.
- **`flags.test.ts`** — the flag detector never flags when text and structure agree, nor without a structural contradiction (tone only, no offer); never for a card from a different set than the one offered, nor for a card name the dealer repeats from our probe or from an egg phrase (message 4743); a pressure phrase only with a match from the closed list plus a counteroffer, and the detector never returns a number.
- **`packs.test.ts`** — the packs route never lists a sealed pack below our value nor proposes buying from a dealer at the opening price or above, nor below the cash floor.

## Links

- ↑ [`test/`](../AGENTS.md)
- → [`src/`](../../src/AGENTS.md) — what is tested
