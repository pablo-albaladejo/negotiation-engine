# src/engine/ — Numeric core

Pure functions used by `../dealers/negotiation/negotiator.ts` (`concession`, `enforceGuardrails`), `../duels/duels.ts` and `../packs/packs.ts` (`enforceGuardrails`). No LLM and no network.

## Files

- **`config.ts`** — `IssueSchema`: one negotiable issue (name, min, max, direction, weight).
- **`issues.ts`** — Utility: `utility`, buyer/seller orientation, rounding in our favor and reservation.
- **`offer.ts`** — `concession`: conceded fraction t^(1/β) (Boulware); `generateOffer`: multi-issue Boulware proposal with reciprocity.
- **`acceptance.ts`** — `decideAcceptance`: AC_next, AC_time and AC_combi.
- **`guardrails.ts`** — `enforceGuardrails` (single price) and `enforceOfferGuardrails` (multi-issue): the offer does not cross the mandate and concedes monotonically.
- **`rng.ts`** — `createRng`: reproducible seeded randomness.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`dealers/`](../dealers/AGENTS.md) and [`duels/`](../duels/AGENTS.md) — who uses it
- → [`test/engine/`](../../test/engine/AGENTS.md) — tests and properties (fast-check)
