# viewer/server/bazaar/market-test/ — Market Test (auto frente a board)

- **`market-test.ts`** — `marketTestOf` arma `board.market_test`: nuestras sesiones del Market Test (el libro sintético que reciben todos los venues), en AUTO (v04) frente a BOARD (v26, nuestro broker casando en vivo).
  - Resultado oficial por sesión: «bench.started» y «bench.finished» del stream de equipo (`results/bazaar-live/<fecha>/stream-team.jsonl`, solo las líneas con «bench.»): hora, eficiencia frente a la base auto, Δ, emparejamientos y si es la versión «hard».
  - Libro tick a tick: `results/bazaar-live/<fecha>/bench.jsonl` (cotización y temple de cada operador sintético), por la ventana `start_tick`…+`ticks`. `dryRun` dice si lo leyó la sombra o el broker en vivo.
  - Nuestros emparejamientos: líneas «match» de `<fecha>/broker.jsonl` (enviado, rechazado o dry-run), si existe.
  - Números de la sombra de las sesiones auto: `results/bazaar-live/bench-sessions.json`.
  - «Ahora»: la última línea de `results/logs/broker-live.log`.
  - El libro y los emparejamientos solo se envían para las 8 últimas sesiones. Cada fichero se relee solo si cambia su tamaño. Solo lectura: nunca un POST.

## Links

- ↑ [`viewer/server/bazaar/`](../AGENTS.md)
- → Pantalla: [`viewer/src/screens/market-test/`](../../../src/screens/market-test/AGENTS.md)
