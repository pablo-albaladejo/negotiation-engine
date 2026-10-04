# viewer/src/screens/market-test/ — Pestaña «Market test»

- **`MarketTest.tsx`** — la pestaña «Market test (auto vs board)»:
  - una banda «ahora» con la última línea del broker en vivo (si hay un bench corriendo);
  - la tabla de sesiones: hora, modo (auto v04 o board v26), hard, eficiencia, base auto, Δ, emparejamientos oficiales y los nuestros (enviados y rechazados);
  - el detalle de la sesión elegida: la eficiencia oficial frente a la base auto, aparte; «lo nuestro frente al óptimo» en excedente de cotización (pares, excedente, capturado X/Y en %, provisional o final; en auto «no comparable», sin %), con la tabla «Missed» (pares óptimos que no hicimos) y «Suboptimal» (nuestros pares fuera del óptimo); el libro tick a tick en un gráfico SVG (una línea por operador; asks en rojo, bids en verde; estilo según el temple) con nuestros emparejamientos #n y los pares óptimos como fantasmas On (discontinuos y huecos, con casilla para ocultarlos), y la tabla de los nuestros.

Datos: `board.market_test`, de `marketTestOf` en [`viewer/server/bazaar/market-test/`](../../../server/bazaar/market-test/AGENTS.md). Solo lectura; aquí no se calcula ninguna cifra.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
