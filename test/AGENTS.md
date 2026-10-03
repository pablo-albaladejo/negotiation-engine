# test/ — Tests de guardarraíles

Hackathon: solo se testea lo que no se negocia (decisión del equipo, 3 oct 2026). El resto se prueba con `--dry-run`.

- **`guardrails.test.ts`** — `enforceGuardrails` y `enforceOfferGuardrails` (multi-asunto) con fast-check: nunca cruzan el límite, son monótonas, rechazan valores no finitos; con un asunto coinciden con el 1D; generadores en `engine/arbitraries.ts`.
- **`venue-switch.test.ts`** — el cambio de mecanismo del venue nunca se ejecuta sin `--confirm` y `--allow-venue-switch` (ni en dry-run), nunca se propone a menos de N ticks de un bench, sale como mucho uno por tick, y `decideMechanism` solo recomienda `switch-to-board` con sesiones, ratio, caja, tiempo y heartbeat en verde.
- **`rival-page.test.ts`** — ventas dirigidas a un rival (`src/markets/rival-page.ts`): precio ≥ suelo y neto ≥ margen tras comisión; nunca de un set objetivo, una página casi nuestra ni un activo bloqueado, reservado u ocupado; κ 0 cuando sus páginas completas piden más cartas no vistas de las que tiene; nada sin rivales o con datos viejos; reprecios monótonos y nunca bajo el suelo; `planTick` nunca cancela una oferta con `to`.
- **`broker-any-copy.test.ts`** — broker de nuestro venue (`planAnyCopy`, `planPublic`) con libros aleatorios de forma real: nunca casa cartas distintas, nunca ask > bid (con comisión), nunca reutiliza una oferta ni un activo y respeta el tope por tick.
- **`news-signals.test.ts`** — `readNewsSignals` nunca lanza con cualquier contenido y no da más números que id, tick y `ageTicks`; ningún fichero de `coordinator/`, `dealers/`, `duels/`, `trades/`, `broker/` ni `engine/` lee `.news` ni importa de `src/news/`.
- **`scanner.test.ts`** — escáner de dispersión (`src/markets/scanner.ts`, `proposeMarkets`): con copias, valores y precios aleatorios nunca compra por encima del valor marginal − comisión − margen ni vende por debajo del valor marginal + comisión + margen; el tope de gasto por hora de juego y el suelo de caja se cumplen aunque se ejecuten todas las compras propuestas; como mucho N tratos por contraparte y hora; nunca vende una carta con venta dirigida de rival-page activa.
- **`duels-micro-step.test.ts`** — duelos: si el rival se mueve cada ronda, nuestras ofertas nunca se repiten mientras quede ≥ 1 P de margen y nunca cruzan el límite (micro-concesión de 1 P, texto = cifra).
- **[`bazaar/`](bazaar/AGENTS.md)** — guardarraíles del agente: cifra = texto, forma de la oferta, un activo en un sitio, topes, menú, coordinador, flags y sobres.
- **[`engine/`](engine/AGENTS.md)** — generadores de fast-check del motor.
- **[`fixtures/`](fixtures/AGENTS.md)** — fichas reales de dealers e hilo 56 (referencia).

```bash
pnpm test
```

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
