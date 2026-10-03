# viewer/src/model/ — Lógica pura del visor

Funciones puras sin React: leen JSON tolerante y devuelven lo que pinta la pantalla.

- **`bazaarBoard.ts`** — lista unificada, filtros y línea temporal del tablero.
- **`bazaar.ts`** — historia de la cifra.
- **`bazaarConversations.ts`** — conversaciones del tablero.
- **`cockpit.ts`** — cabina: puesto, lo abierto ahora, quién es quién (`partyOf`, `teamLabel`), curva (`offerCurve`, `niceScale`) y colores de rareza. `originOf`: la columna «Posted by» de «Right now» (ruta, «posted 6 P (t1079) → reprice 8 P (t1093)», neg si se llena y ticks que quedan).
- **`gameModel.ts`** — nuestro modelo interno (`/api/bazaar/model`): tiempo, personas, pistas, precios, venues, sobres, flags y camino previsto (`withPlannedPath`).
- **`dealerFit.ts`** — ajuste de la curva por persona (solo el lado del dealer): `predictionOf`, `withPrediction` (su camino previsto con banda, su límite y la ronda de retirada sobre la curva), `predictionCaption`, `predictionLines` `dealerFitStrip` (tira del cajón: persona y banda de la conversación, `welcome` si el ajuste lo marca) y `dealerEstimates` (parámetros, límites por banda e historia por persona).
- **`personaModel.ts`** — lo que el modelo de HOY sabe de la persona de una conversación (también vieja o cerrada): `personas[].model` si está, si no `estimates`/`fit`. `strategyLines` («value [lo–hi] · n · source» o «unknown»), `bandView` (suelo/techo medido de su banda con book), `herWalkText`, `sideLabel` («we sell · she buys») y `currentPrediction` (su curva con la fórmula del ajuste cuando el servidor no trae *prediction*).
- **`scoreTree.ts`** — qué alimenta cada acción: `componentOf` (dealer → LADDER con nivel, share y si entra en el top 3 si el modelo está cargado; duelo → DUEL; trato con otro equipo fuera de nuestro venue → NEG; trato entre OTROS equipos en nuestro venue → MARKET; ofertas abiertas, sobres, Taller, álbum, regalos → no score) y `scoreTree` (ladder/duel/neg → NEGOTIATING /30, bench/organic → MARKET /30 → SCORE → rank, con Δ del día y del tick de `board.score_parts`).
- **`index.ts`** — reexporta lo anterior.

## Links

- ↑ [`viewer/src/`](../AGENTS.md)
