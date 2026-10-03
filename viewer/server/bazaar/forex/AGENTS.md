# viewer/server/bazaar/forex/ — Cadenas forex

- **`forex.ts`** — `forexOf` arma `board.forex` para la pestaña «Forex» a partir de `results/bazaar-live/<fecha>/forex.json`, que escribe `bazaar:play` cada tick (`writeForex` en [`src/forex/`](../../../../src/forex/AGENTS.md)). Cada cadena A → B → C: comprar una carta en un sitio, guardar la copia y venderla en otro, neto de comisiones; con sus pasos (`current` = paso actual, −1 en reposo), margen y peor caso, rango de precios por pata (lo–hi, n, comisión), `automated` (la ejecuta el agente de dealers) o solo mostrada, `maxBuy`/`minSell`, estado y hechas hoy. Valida a la defensiva: una cadena mal formada se descarta, un fichero mal formado da null; nunca lanza ni envía.
- **`forex-threads.ts`** — `forexThreadsOf` rellena `step_threads` de cada cadena (alineado con sus pasos): las conversaciones detrás de cada paso, con datos que el tablero ya lee y sin GET nuevos. Fuentes: nuestras trazas de hoy (`decisions.jsonl` y `thread-<id>.jsonl`, sin dry-run), los resúmenes de `docs/bazaar/lessons.json`, el flags.json de hoy y nuestros activos de `/api/me`.
  - Compra: hilos con el dealer de `buy.at` cuyo objetivo es `buy:<carta>`.
  - Venta: hilos con `sell.at` que venden un activo de esa carta (id → carta por nuestros activos, lessons o el resumen de cierre).
  - Guardar: los ids de los activos de la carta que tenemos además del primero.
  - Por hilo: estado (open, deal, closed), outcome y regla, ticks de apertura y cierre, precios de ella y nuestros (y el último de cada lado), precio del trato y flags. Un flag se asigna por persona y tick (hasta `FLAG_LAG` ticks tras el cierre); si nombra una carta, tiene que ser la del hilo.

## Links

- ↑ [`viewer/server/bazaar/`](../AGENTS.md)
- → Pantalla: [`viewer/src/screens/forex/`](../../../src/screens/forex/AGENTS.md)
