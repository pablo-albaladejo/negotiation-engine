# viewer/src/screens/forex/ — Pestaña «Forex»

Las cadenas A → B → C que encuentra `bazaar:play` cada tick: comprar en A, guardar la copia y vender en B, neto de comisiones. Cabecera con tick, hora, tratos de la ventana y cartas escaneadas.

- **`Forex.tsx`** — la pantalla. Cada cadena es un flujo horizontal «Buy at A» → «Hold carta» → «Sell to B» → margen neto (y peor caso); cada nodo con su valor esperado, rango de precios (lo–hi, n, comisión si la hay) y `maxBuy`/`minSell`. El paso actual va resaltado; en reposo, el siguiente (el primero) va punteado. Muestra el estado, las hechas hoy y si es «automated» (la ejecuta el agente de dealers) o «shown only». En pantallas estrechas el flujo se apila en vertical. Cada paso es clicable y lleva un contador («2 threads», «1 spare»): abre debajo de la cadena sus conversaciones de hoy, de la más reciente a la más antigua, con estado, escalera de precios ella → nosotros, outcome y regla, y los flags; el número del hilo abre el cajón de conversación que ya existe (fila `thread:<id>` del tablero). En el paso de guardar, las copias de sobra. Sin hilos: «No conversations for this step today».

Datos: `board.forex` de `/api/bazaar/board` (ver [`viewer/server/bazaar/forex/`](../../../server/bazaar/forex/AGENTS.md)). Solo lectura: nada se envía.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
