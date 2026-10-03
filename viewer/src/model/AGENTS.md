# viewer/src/model/ — Lógica pura del visor

Funciones puras sin React: leen JSON tolerante y devuelven lo que pinta la pantalla.

- **`bazaarBoard.ts`** — lista unificada, filtros y línea temporal del tablero.
- **`bazaar.ts`** — historia de la cifra.
- **`bazaarConversations.ts`** — conversaciones del tablero.
- **`cockpit.ts`** — cabina: puesto, lo abierto ahora, quién es quién (`partyOf`, `teamLabel`), curva (`offerCurve`, `niceScale`) y colores de rareza.
- **`gameModel.ts`** — nuestro modelo interno (`/api/bazaar/model`): tiempo, personas, pistas, precios, venues, sobres, flags y camino previsto (`withPlannedPath`).
- **`index.ts`** — reexporta lo anterior.

## Links

- ↑ [`viewer/src/`](../AGENTS.md)
