# src/dealers/history/ — Memoria de las conversaciones

Qué pasó en cada conversación con un dealer y qué aprendimos. Solo escribe trazas y `docs/bazaar/lessons.json`; nunca decide una cifra.

## Archivos

- **`thread-log.ts`** — `ThreadSummary` por conversación: cartas, recibidas, copias antes/después, tratos con ese dealer en la última hora, tick/ts, su lista, apertura y final, nuestros precios y los suyos, paciencia, resultado (no_progress cuenta como walked), valor creado a nuestro valor y, con `welcome-first-deal`, el límite medido (*measuredLimit*); `formatThreadSummary` imprime la línea SUMMARY.
- **`lessons.ts`** — `appendLesson` añade una entrada por conversación a `docs/bazaar/lessons.json` (schema bazaar-lessons/v1) sin reescribir las existentes (inserción en el texto, validada con JSON.parse, rename atómico); `deriveLessons` (límite medido en la primera conversación (*measured_limit*), no se movió, por debajo de su lista, repetida recibida, final tras N mensajes, valor negativo...); `PendingLessons` espera a que neg_points se mueva (o 5 ticks) para anotar neg_points_delta y ladder_points_after.

## Links

- ↑ [`src/dealers/`](../AGENTS.md)
- → [`docs/`](../../../docs/AGENTS.md) — donde viven las lecciones
