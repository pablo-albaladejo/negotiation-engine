# viewer/server/bazaar/profile/ — Datos de nuestro perfil

- **`eggs.ts`** — `eggsOf` arma `board.eggs`, los easter eggs:
  - Nuestros: cada «egg.found» con nuestro equipo. Su premio es el «egg.given» de ese tick o del siguiente (cartas, P, sobres) más la insignia («badge.awarded») del mismo momento. La frase que lo disparó es nuestro último sondeo a esa persona en los 6 ticks anteriores (`personas.json`).
  - Por persona: todos los hallazgos (equipo y tick) y el resumen de nuestros sondeos (enviados, acierto, fallo, el último).
  - Sale del stream público que guarda el recorder más el feed, sin duplicados por id. Solo estructura: nunca el texto de un dealer. Las cartas se completan con el catálogo (nombre, rareza, tirada, oculta).

## Links

- ↑ [`viewer/server/bazaar/`](../AGENTS.md)
- → Pantalla: [`viewer/src/screens/profile/`](../../../src/screens/profile/AGENTS.md)
