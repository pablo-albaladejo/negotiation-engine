# viewer/src/model/ — Lógica pura del visor

Funciones puras sin React: leen JSON tolerante y devuelven lo que pinta la pantalla.

- **`bazaarBoard.ts`** — lista unificada, filtros y línea temporal del tablero.
- **`bazaar.ts`** — historia de la cifra.
- **`bazaarConversations.ts`** — conversaciones del tablero.
- **`cockpit.ts`** — cabina: puesto, lo abierto ahora, quién es quién (`partyOf`, `teamLabel`), curva (`offerCurve`, `niceScale`) y colores de rareza.
- **`gameModel.ts`** — nuestro modelo interno (`/api/bazaar/model`): tiempo, personas, pistas, precios, venues, sobres, flags y camino previsto (`withPlannedPath`).
- **`dealerFit.ts`** — ajuste de la curva por persona (solo el lado del dealer): `predictionOf`, `withPrediction` (su camino previsto con banda, su límite y la ronda de retirada sobre la curva), `predictionCaption`, `predictionLines` `dealerFitStrip` (tira del cajón: persona y banda de la conversación, `welcome` si el ajuste lo marca) y `dealerEstimates` (parámetros, límites por banda e historia por persona).
- **`index.ts`** — reexporta lo anterior.

## Links

- ↑ [`viewer/src/`](../AGENTS.md)
