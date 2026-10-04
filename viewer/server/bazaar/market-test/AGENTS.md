# viewer/server/bazaar/market-test/ — Market Test (auto frente a board)

- **`market-test.ts`** — `marketTestOf` arma `board.market_test`: nuestras sesiones del Market Test (el libro sintético que reciben todos los venues), en AUTO (v04) frente a BOARD (v26, nuestro broker casando en vivo).
  - Resultado oficial por sesión: «bench.started» y «bench.finished» del stream de equipo (`results/bazaar-live/<fecha>/stream-team.jsonl`, solo las líneas con «bench.»): hora, eficiencia frente a la base auto, Δ, emparejamientos y si es la versión «hard».
  - Libro tick a tick: `results/bazaar-live/<fecha>/bench.jsonl` (cotización y temple de cada operador sintético), por la ventana `start_tick`…+`ticks`. `dryRun` dice si lo leyó la sombra o el broker en vivo.
  - Nuestros emparejamientos: líneas «match» de `<fecha>/broker.jsonl` (enviado, rechazado o dry-run), si existe.
  - Números de la sombra de las sesiones auto: `results/bazaar-live/bench-sessions.json`.
  - «Ahora»: la última línea de `results/logs/broker-live.log`.
  - `hindsight` por sesión: lo nuestro (emparejamientos «sent» y no dry-run: pares y excedente de cotización, el campo `surplus`) frente al óptimo a posteriori, con los pares perdidos (`missed`) y los nuestros fuera del óptimo (`suboptimal`); provisional hasta el último tick leído mientras corre, final al acabar. Solo comparable en board (v26): en auto (v04) el libro se graba después de que auto ya cruzó, así que se marca «no comparable» y sin % capturado. Es excedente de cotización (bid − ask), **no** la eficiencia oficial: bench.jsonl no trae límites privados.
  - El libro y los emparejamientos solo se envían para las 8 últimas sesiones. Cada fichero se relee solo si cambia su tamaño. Solo lectura: nunca un POST.
- **`optimum.ts`** — funciones puras: `hindsightOptimum` (operadores = ids distintos del libro hasta un tick; un par ask × bid es posible si en algún tick ambos están con bid ≥ ask; su peso es el mejor bid − ask en esos ticks; emparejamiento de peso máximo con el algoritmo húngaro, cada operador una vez: primero más excedente, luego más pares y, a igualdad, los nuestros) y `maxWeightAssignment`. Test en [`viewer/test/`](../../../test/AGENTS.md).

## Links

- ↑ [`viewer/server/bazaar/`](../AGENTS.md)
- → Pantalla: [`viewer/src/screens/market-test/`](../../../src/screens/market-test/AGENTS.md)
