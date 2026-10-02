# test/ — Tests de guardarraíles

Hackathon: solo se testea lo que no se negocia (decisión del equipo, 3 oct 2026). El resto se prueba con `--dry-run`.

- **`guardrails.test.ts`** — `enforceGuardrails` (propiedades con fast-check): nunca cruza el límite y es monótona; generadores en `engine/arbitraries.ts`.
- **`bazaar/messages.test.ts`** — la única cifra del texto es la decidida (`textMatchesPrice`).
- **`bazaar/offer-structure.test.ts`** — forma de la oferta (`checkStructure`).
- **`bazaar/asset-locks.test.ts`** — un activo en un solo sitio.
- **`bazaar/caps.test.ts`**, **`bazaar/spend.test.ts`** — topes de gasto y caja mínima.
- **`bazaar/menu-guard.test.ts`** — no se pide lo que el menú del dealer no ofrece.
- **[`fixtures/`](fixtures/AGENTS.md)** — fichas reales de dealers e hilo 56 (referencia).

```bash
pnpm test
```

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
