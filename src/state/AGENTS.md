# src/state/ — Estado del juego

Un `GameState` por tick, solo con GET y tolerante (lo que falla va a `missing`). Lo leen el coordinador y el visor.

## Archivos

- **`game-state.ts`** — `buildGameState` y `formatGameState`: nuestro, entorno, tiempo, personas, eggs, flags, pistas, precios y sobres.
- **`conversation.ts`** — `Conversation`: una por hilo con dealer, duelo u oferta en El Rastro; estrategia por código, paciencia y candidato a flag.
- **`world.ts`** — Personas dinámicas (`buildPersonas`), eggs, regalos, badges y flags (`worldFromFeed`); `personas.json` y `flags.json`.
- **`time.ts`** — `buildTime`: hora de juego, ronda y peso, ticks que quedan hoy, deriva y cambio de calendario.
- **`prices.ts`** — `buildPriceSheet` y `buildVenues`: hoja de precios por carta y venue, huecos y tabla de venues.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`coordinator/`](../coordinator/AGENTS.md)
- → [`hints/`](../hints/AGENTS.md)
- → [`flags/`](../flags/AGENTS.md)
