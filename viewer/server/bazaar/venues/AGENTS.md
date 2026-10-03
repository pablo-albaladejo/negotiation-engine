# viewer/server/bazaar/venues/ — Libros de todos los venues

- **`venue-books.ts`** — `venueBooksOf` arma `board.venue_books` para la pestaña «Venues» a partir de tres ficheros:
  - `results/bazaar-live/<fecha>/venue-books.json`: lo escribe `bazaar:play` cada tick (`buildGameState` en [`src/state/`](../../../../src/state/AGENTS.md)) con los mismos GET que ya hace para la hoja de precios, así que el visor no añade llamadas con la clave compartida;
  - `results/bazaar-live/values.json`: `hand` (nuestras copias) y `values` (`your_value`);
  - `results/bazaar-live/rivals.json`: qué equipos piden o tienen cada carta.

  Cada oferta se clasifica en ask, bid o cambio y se marca: ours, lack, spare, last, keep, dup o none. «keep» es un bid por una carta que nunca vendemos (oculta o `isKeepsake` de `src/shared/asset-locks.ts`, regla de Pablo del 3 oct): va sin cifra y nunca como pista de venta. Lleva su comisión y el NEG a nuestros valores como quien acepta: en un bid, precio − valor − comisión; en un ask de una carta que nos falta, valor − precio − comisión; en un dup, sin cifra. `OFF_LIMITS` (v01, v02, v07, v14) son los venues donde no operamos, por decisión del equipo del 3 oct. Puro y de solo lectura.

- **`offer-origins.ts`** — `offerOriginsOf` arma `board.offer_origins`: de dónde sale cada oferta abierta nuestra. Lee el `plan.jsonl` de hoy (lo escribe `bazaar:play`) y toma solo las intenciones de tipo listing que se ejecutaron (ok, y no «would»). Las une a la oferta por estructura: una venta por el activo que da (`assetIds`), una puja por la carta que pide y el equipo al que va.
  - Ruta: trades, rival-page, rival-buy, rival-swap o team-desk.
  - Cadena desde su último «new», con las reposiciones al mismo precio agrupadas.
  - El neg si se llena (el `ev` de la intención) y los ticks que le quedan.
- **`directed-offers.ts`** — `directedOffersOf` arma `board.directed`: las ofertas dirigidas entre OTROS equipos de los últimos ~60 ticks, que nunca salen en los libros. Salen de los «offer.listed» con `to` del stream público que guarda el recorder. Solo estructura (cartas, cifra, equipos, ticks), nunca su texto. El estado es cancelled («offer.cancelled»), filled (una liquidación entre los mismos equipos con la misma carta y el mismo precio), expired u open. Marca si la carta es una repetida nuestra (`hand` ≥ 2 en values.json).

## Links

- ↑ [`viewer/server/bazaar/`](../AGENTS.md)
- → Pantalla: [`viewer/src/screens/venues/`](../../../src/screens/venues/AGENTS.md)
