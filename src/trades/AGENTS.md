# src/trades/ — El Rastro

Trades con otros equipos en El Rastro (comisión 5 % + 1 P por carta, redondeada hacia arriba), puntuados a NUESTROS valores privados. Solo se lee la estructura de cada oferta (give/want), nunca su texto. Entrada: `main.ts` (`pnpm bazaar:trades`).

## Archivos

- **`trades.ts`** — puro y determinista. Valoración: `buildValueModel` saca la base privada de cada carta de `your_value` (÷ marginal de la última copia; repetidas 0,25× y 0,1× según los marginales de copia del catálogo) y de `/api/me/value` para las que no tenemos (sin contar dos veces el bonus si esa carta completaría la página); `portfolioValue` suma copias + bonus de página y set; `pageRisk` penaliza quitar nuestra única copia de una página casi completa (≥ 8/10). `tradeFee`, `minAsk` (suelo de venta = pérdida + comisión + margen) y `maxBid` (techo de puja = valor − comisión − margen). `evaluateOffer` da el valor creado si aceptamos (cartas + caja − comisión − riesgo) y exige margen (2 P o 10 % del efectivo). `planTick`: una aceptación por tick (la de más valor que quepa en caja y en `--max-spend`), repetidas a la venta un 5 % por encima de la referencia (`priceReference`: liquidaciones del feed, `parseSettlements`, por carta y luego por rareza; si no, lo que se pide en el tablón; si no, book) y nunca bajo el suelo; pujas por cartas de página que faltan (mejor puja + 1 o 0,9× la referencia, nunca sobre el techo); reprecio lento (`slowReprice`, ofertas de ≥ 10 ticks, pasos del 5 %), corrección inmediata si una oferta queda bajo el suelo o sobre el techo, y cancelación de las inválidas. Topes: `--max-offers`, `--max-bids`, `--max-spend` (compras aceptadas + pujas abiertas con comisión), límites del servidor (`/api/clock` → limits). Supuesto conservador: pagamos la comisión en todo trato.
- **`agent.ts`** — `TradesAgent`, método propose (estado y `planTick`, solo GET) y método execute (un plan, quizá recortado por el coordinador); `TradesAgent.step` = las dos: lee reloj, `/api/me`, nuestras ofertas, el tablón y el feed; cachea valores privados toda la ejecución; ejecuta aceptación → cancelaciones → altas (nada en dry-run); una puja nuestra que desaparece sin cancelar antes de caducar cuenta como gasto.
- **`main.ts`** — `runTradesCli`: `pnpm bazaar:trades --dry-run --once` (solo GET). En vivo exige quitar `--dry-run` y pasar `--confirm` (solo con aprobación del usuario). Flags: `--max-offers` (10), `--max-spend` (60), `--max-bids` (6), `--min-margin` (2), `--expires` (40 ticks), `--ticks`, `--top`.

## Links

- ↑ [`src/`](../AGENTS.md)
