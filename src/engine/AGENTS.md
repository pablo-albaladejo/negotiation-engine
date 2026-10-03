# src/engine/ — Núcleo numérico

Funciones puras que usan `../dealers/negotiation/negotiator.ts` (`concession`, `enforceGuardrails`), `../duels/duels.ts` y `../packs/packs.ts` (`enforceGuardrails`). Sin LLM ni red.

## Archivos

- **`config.ts`** — `IssueSchema`: un issue negociable (nombre, mín., máx., dirección, peso).
- **`issues.ts`** — Utilidad: `utility`, orientación comprador/vendedor, redondeo a favor y reserva.
- **`offer.ts`** — `concession`: fracción cedida t^(1/β) (Boulware); `generateOffer`: propuesta Boulware multi-issue con reciprocidad.
- **`acceptance.ts`** — `decideAcceptance`: AC_next, AC_time y AC_combi.
- **`guardrails.ts`** — `enforceGuardrails` (precio único) y `enforceOfferGuardrails` (multi-issue): la oferta no cruza el mandato y concede de forma monótona.
- **`rng.ts`** — `createRng`: aleatoriedad con semilla reproducible.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`dealers/`](../dealers/AGENTS.md) y [`duels/`](../duels/AGENTS.md) — quien lo usa
- → [`test/engine/`](../../test/engine/AGENTS.md) — tests y propiedades (fast-check)
