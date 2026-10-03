# test/ — Tests de guardarraíles

Hackathon: solo se testea lo que no se negocia (decisión del equipo, 3 oct 2026). El resto se prueba con `--dry-run`.

- **`guardrails.test.ts`** — `enforceGuardrails` (propiedades con fast-check): nunca cruza el límite y es monótona; generadores en `engine/arbitraries.ts`.
- **`venue-switch.test.ts`** — el cambio de mecanismo del venue nunca se ejecuta sin `--confirm` y `--allow-venue-switch`, nunca se propone a menos de N ticks de un bench y sale como mucho uno por tick.
- **[`bazaar/`](bazaar/AGENTS.md)** — guardarraíles del agente: cifra = texto, forma de la oferta, un activo en un sitio, topes, menú, coordinador, flags y sobres.
- **[`engine/`](engine/AGENTS.md)** — generadores de fast-check del motor.
- **[`fixtures/`](fixtures/AGENTS.md)** — fichas reales de dealers e hilo 56 (referencia).

```bash
pnpm test
```

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
