# viewer/server/bazaar/forex/ — Cadenas forex

- **`forex.ts`** — `forexOf` arma `board.forex` para la pestaña «Forex» a partir de `results/bazaar-live/<fecha>/forex.json`, que escribe `bazaar:play` cada tick (`writeForex` en [`src/forex/`](../../../../src/forex/AGENTS.md)). Cada cadena A → B → C: comprar una carta en un sitio, guardar la copia y venderla en otro, neto de comisiones; con sus pasos (`current` = paso actual, −1 en reposo), margen y peor caso, rango de precios por pata (lo–hi, n, comisión), `automated` (la ejecuta el agente de dealers) o solo mostrada, `maxBuy`/`minSell`, estado y hechas hoy. Valida a la defensiva: una cadena mal formada se descarta, un fichero mal formado da null; nunca lanza ni envía.

## Links

- ↑ [`viewer/server/bazaar/`](../AGENTS.md)
- → Pantalla: [`viewer/src/screens/forex/`](../../../src/screens/forex/AGENTS.md)
