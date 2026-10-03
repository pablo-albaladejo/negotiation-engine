# viewer/server/bazaar/venues/ — Libros de todos los venues

- **`venue-books.ts`** — `venueBooksOf` arma `board.venue_books` para la pestaña «Venues» a partir de tres ficheros:
  - `results/bazaar-live/<fecha>/venue-books.json`: lo escribe `bazaar:play` cada tick (`buildGameState` en [`src/state/`](../../../../src/state/AGENTS.md)) con los mismos GET que ya hace para la hoja de precios, así que el visor no añade llamadas con la clave compartida;
  - `values.json`: `hand` (nuestras copias) y `values` (`your_value`);
  - `rivals.json`: qué equipos piden o tienen cada carta.

  Cada oferta se clasifica en ask, bid o cambio y se marca: ours, lack, spare, last, dup o none. Lleva su comisión y el NEG a nuestros valores como quien acepta: en un bid, precio − valor − comisión; en un ask de una carta que nos falta, valor − precio − comisión; en un dup, sin cifra. `OFF_LIMITS` (v01, v02, v07, v14) son los venues donde no operamos, por decisión del equipo del 3 oct. Puro y de solo lectura.

## Links

- ↑ [`viewer/server/bazaar/`](../AGENTS.md)
- → Pantalla: [`viewer/src/screens/venues/`](../../../src/screens/venues/AGENTS.md)
