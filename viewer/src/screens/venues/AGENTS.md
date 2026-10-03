# viewer/src/screens/venues/ — Pestaña «Venues»

Todos los venues abiertos con su libro, en una pestaña del Bazaar: El Rastro primero y luego por profundidad. Por venue, dueño, comisión y mecanismo, con la insignia «off-limits» en v01, v02, v07 y v14 (no operamos ahí: sube el mercado de un rival) y «ours» en el nuestro. Debajo, asks (venden) y bids (compran) ordenados por precio, y aparte los cambios y las ofertas mixtas.

Cada oferta va marcada frente a nosotros con NEG a nuestros valores como quien acepta (comisión incluida). Es una guía, nunca una cifra del agente:

- **Bid por una carta que tenemos**: precio − valor − comisión. Solo en verde si es positivo y es repetida (mano ≥ 2); con una sola copia, «our last copy». Las cartas ocultas nunca se venden: un bid por una de ellas sale como «never sold (hidden/keepsake)» y sin cifra.
- **Ask por una carta que nos falta**: valor − precio − comisión.
- **Ask por una carta que ya tenemos**: «dup», sin cifra (una segunda copia vale ~3–4, no nuestro valor).
- **Ofertas dirigidas a nosotros**: resaltadas (también salen en «Team desk»).

Filtros: solo cartas que nos faltan, solo bids por nuestras cartas, solo NEG > 0, ocultar off-limits y buscar una carta.

- **`VenueBooks.tsx`** — la pantalla.
- **`venuesModel.ts`** — funciones puras (`filterVenues`, `keepRow`, `markLabel`, `summaryOf`).

Datos: `board.venue_books` de `/api/bazaar/board` (lo arma el servidor, ver [`viewer/server/bazaar/venues/`](../../../server/bazaar/venues/AGENTS.md)). Solo lectura: nada se envía.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
