# src/engine/ — Núcleo numérico

Funciones puras que usa el Bazaar (`../dealers/negotiation/negotiator.ts` y `../duels/duels.ts`). Sin LLM ni red.

## Archivos

- **`config.ts`** — `IssueSchema`: un issue negociable (nombre, mín., máx., dirección, peso).
- **`issues.ts`** — Utilidad: `utility`, orientación comprador/vendedor, redondeo a favor y reserva.
- **`offer.ts`** — `concession`: curva Boulware (β) entre apertura y reserva.
- **`acceptance.ts`** — `decideAcceptance`: AC_next, AC_time y AC_combi.
- **`guardrails.ts`** — `enforceGuardrails`: la oferta no cruza el mandato y concede de forma monótona.
- **`rng.ts`** — `createRng`: aleatoriedad con semilla reproducible.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`dealers/`](../dealers/AGENTS.md) y [`duels/`](../duels/AGENTS.md) — quien lo usa
- → [`test/engine/`](../../test/engine/AGENTS.md) — tests y propiedades (fast-check)
