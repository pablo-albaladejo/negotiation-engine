# test/ — Tests

Unitarios y de propiedades (fast-check). Espejo de `src/`.

- **`bazaar/`** — cliente, negociador, planificadores, duelos, trades, broker, venue, guardarraíles y bucle.
- **`engine/`** — utilidad, concesión, aceptación y RNG; `guardrails.test.ts` en la raíz.
- **[`fixtures/`](fixtures/AGENTS.md)** — fichas reales de dealers e hilos para los tests.

```bash
pnpm test              # todos
pnpm test test/bazaar/ # un módulo
pnpm test:watch
```

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
