# src/forex/ — Cadenas de forex (A → B → C)

Busca cada tick ineficiencias entre dealers y venues (decisión de Pablo, 3 oct): comprar una carta donde está barata (A), guardar la copia (B) y venderla donde pagan más (C). Las cadenas van en `GameState.forex`; el visor las pinta con el paso en el que estamos y el valor esperado de cada paso. Solo estructura (precios de liquidaciones y ofertas), nunca el texto de un dealer.

## Archivos

- **`ledger.ts`** — `updateDealerLedger(dir, events, tick)`: todos los tratos públicos de una carta por dinero con un dealer hoy (cualquier equipo), del feed de cada tick y, la primera vez, del `stream-public.jsonl` del recorder. Se guarda en dealer-trades.json en la carpeta del día (sobrevive a un reinicio). `dealerTradeOf` convierte una liquidación en `DealerTrade` (`side` desde el dealer: `sells` = un equipo le compró, `buys` = un equipo le vendió).
- **`chains.ts`** — `findChains(input)`: por carta, cada lado barato (un dealer que vende, con al menos `FOREX_MIN_SAMPLES` tratos en las últimas `FOREX_WINDOW_TICKS`, o un ask vivo de un venue) frente a cada lado caro (un dealer que compra o un bid vivo), con mediana y cuartiles. Margen neto = venta − compra − comisiones: los dealers no cobran (fee 0 en todas las liquidaciones de hoy), El Rastro `rastroFee` (≈ 2 P + 4 %, redondeado arriba) y cada venue su `fee_bps` y `fee_per_card`. Solo queda la cadena con margen ≥ `FOREX_MIN_MARGIN`; nunca una carta oculta. Cada `ForexChain` lleva tres pasos (comprar, guardar, vender) con su valor esperado, el peor caso, `maxBuy`/`minSell` para el planificador, `current` (paso en el que estamos: hilo de compra con A, copia guardada más allá de la primera, hilo de venta con C; −1 parado) y `doneToday`. `writeForex` deja forex.json en la carpeta del día para el visor.

Solo las cadenas con los dos lados en dealers (`automated`) las ejecuta el agente de dealers ([`dealers/planning/`](../dealers/planning/AGENTS.md) (forex.ts)): el coordinador se las pasa cada tick con `setForexRoutes`. Las que tienen un lado en un venue solo se muestran.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`state/`](../state/AGENTS.md) (`GameState.forex`) · [`coordinator/`](../coordinator/AGENTS.md)
