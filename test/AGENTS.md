# test/ — Tests de guardarraíles

Hackathon: solo se testea lo que no se negocia (decisión del equipo, 3 oct 2026). El resto se prueba con `--dry-run`.

- **`guardrails.test.ts`** — `enforceGuardrails` (propiedades con fast-check): nunca cruza el límite y es monótona; generadores en `engine/arbitraries.ts`.
- **`bazaar/messages.test.ts`** — la única cifra del texto es la decidida (`textMatchesPrice`).
- **`bazaar/offer-structure.test.ts`** — forma de la oferta (`checkStructure`).
- **`bazaar/asset-locks.test.ts`** — un activo en un solo sitio.
- **`bazaar/caps.test.ts`**, **`bazaar/spend.test.ts`** — topes de gasto y caja mínima.
- **`bazaar/menu-guard.test.ts`** — no se pide lo que el menú del dealer no ofrece.
- **`bazaar/coordinator.test.ts`** — cupos de `clock.limits` (aceptaciones, mensajes por conversación, hilos, altas), un activo en un solo sitio entre rutas, y duelos v2: nunca aceptar fuera del límite, nunca dos concesiones sin contraoferta, siempre `days` si el duelo los negocia.
- **`bazaar/flags.test.ts`** — el detector de flags nunca marca cuando texto y estructura coinciden ni sin una contradicción estructural (solo tono, sin oferta).
- **`bazaar/packs.test.ts`** — la ruta de sobres nunca lista un sobre cerrado por debajo de nuestro valor ni propone comprar a un dealer a la apertura o por encima, ni bajo el suelo de caja.
- **[`fixtures/`](fixtures/AGENTS.md)** — fichas reales de dealers e hilo 56 (referencia).

```bash
pnpm test
```

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
