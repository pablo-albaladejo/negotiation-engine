# viewer/src/screens/market-test/ — Pestaña «Market test»

- **`MarketTest.tsx`** — la pestaña «Market test (auto vs board)»:
  - una banda «ahora» con la última línea del broker en vivo (si hay un bench corriendo);
  - una línea «vs auto»: cuántas sesiones terminadas fueron mejores, iguales o peores que su propia base auto (si la base de la API coincide siempre con nuestra eficiencia, lo dice: estamos al nivel de auto, media puntuación de bench);
  - la tabla de sesiones: cuándo (día y hora reales en la hora del navegador, más la hora de juego y el tick), modo (auto v04 o board v26), hard, eficiencia, base auto, «vs auto» (better en verde, worse en rojo, = auto), el % del óptimo en retrospectiva (solo board), emparejamientos oficiales y los nuestros (enviados y rechazados);
  - el detalle de la sesión elegida: la eficiencia oficial frente a la base auto, aparte; «lo nuestro frente al óptimo» en excedente de cotización (pares, excedente, capturado X/Y en %, provisional o final; en auto «no comparable», sin %), con la tabla «Missed» (pares óptimos que no hicimos) y «Suboptimal» (nuestros pares fuera del óptimo); el libro tick a tick en un gráfico SVG (una línea por operador; asks en rojo, bids en verde; estilo según el temple) con nuestros emparejamientos #n y los pares óptimos como fantasmas On (discontinuos y huecos, con casilla para ocultarlos), y la tabla de los nuestros.

Datos: `board.market_test`, de `marketTestOf` en [`viewer/server/bazaar/market-test/`](../../../server/bazaar/market-test/AGENTS.md). Solo lectura; aquí no se calcula ninguna cifra.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
