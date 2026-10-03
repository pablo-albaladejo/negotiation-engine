# src/hints/ — Pistas

Corpus de líneas de dealers por persona (`results/bazaar-live/hints.jsonl`), con candidatas por regla determinista. Nunca entra en una cifra.

## Archivos

- **`corpus.ts`** — cada línea de un dealer por persona (tick, hora de juego, hora de pared, hilo, mensaje, fuente our-thread o feed), desde nuestros hilos y el feed (`collectRaw`, `newLines`); sin `hints.jsonl`, `seedRaw` lo siembra con todo lo guardado en `results/` (volcados, escaneos, streams). Se deduplica por id de mensaje o por persona + texto normalizado. `candidateReasons`, regla determinista con motivos: nombra otra persona o un puesto, menciona una hora o «opens», palabras como secret, rumour, hidden, legend, whisper, only the curious, una frase entre comillas, un set sin publicar o un id de carta fuera del catálogo. La clasificación queda en null (hint, egg-clue o voice: la rellenará un LLM en el paso 3). Persiste en `results/bazaar-live/hints.jsonl` (solo añade, entre días; también en dry-run, porque solo lee el juego) y llega a cada persona del `GameState` (más recientes primero). Excepción estrecha a «del rival solo se lee la estructura»: **nunca entra en una cifra**.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`state/`](../state/AGENTS.md)
