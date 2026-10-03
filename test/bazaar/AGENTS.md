# test/bazaar/ — Guardarraíles del agente

Un fichero por guardarraíl; ninguno llama a la API (clientes falsos en memoria).

- **`messages.test.ts`** — la única cifra del texto es la decidida (`textMatchesPrice`).
- **`offer-structure.test.ts`** — forma de la oferta (`checkStructure`).
- **`asset-locks.test.ts`** — un activo en un solo sitio.
- **`caps.test.ts`**, **`spend.test.ts`** — topes de gasto y caja mínima.
- **`menu-guard.test.ts`** — no se pide lo que el menú del dealer no ofrece.
- **`coordinator.test.ts`** — cupos de `clock.limits` (aceptaciones, mensajes por conversación, hilos, altas), un activo en un solo sitio entre rutas, y duelos v2: nunca aceptar fuera del límite, nunca dos concesiones sin contraoferta, siempre `days` si el duelo los negocia.
- **`flags.test.ts`** — el detector de flags nunca marca cuando texto y estructura coinciden ni sin una contradicción estructural (solo tono, sin oferta).
- **`packs.test.ts`** — la ruta de sobres nunca lista un sobre cerrado por debajo de nuestro valor ni propone comprar a un dealer a la apertura o por encima, ni bajo el suelo de caja.

## Links

- ↑ [`test/`](../AGENTS.md)
- → [`src/`](../../src/AGENTS.md) — lo que se prueba
