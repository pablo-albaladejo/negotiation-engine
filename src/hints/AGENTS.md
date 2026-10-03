# src/hints/ — Pistas

Corpus de líneas de dealers por persona (`results/bazaar-live/hints.jsonl`), con candidatas por regla determinista. Nunca entra en una cifra.

## Archivos

- **`corpus.ts`** — cada línea de un dealer por persona (tick, hora de juego, hora de pared, hilo, mensaje, fuente our-thread o feed), desde nuestros hilos y el feed (`collectRaw`, `newLines`); sin `hints.jsonl`, `seedRaw` lo siembra con todo lo guardado en `results/` (volcados, escaneos, streams). Se deduplica por id de mensaje o por persona + texto normalizado. `candidateReasons`, regla determinista con motivos: nombra otra persona o un puesto, menciona una hora o «opens», palabras como secret, rumour, hidden, legend, whisper, only the curious, una frase entre comillas, un set sin publicar o un id de carta fuera del catálogo. Cada línea guarda también `targets`, las otras personas que nombra (id, nombre o una palabra del nombre: «Carmen» → abuela), porque las pistas siembran rumores sobre **otros** puestos; y la keyword de sonda (`probeKeyword`: «about X» o «pregúntele … por X»). `enrichLine` rehace esta parte determinista de las líneas guardadas con las reglas y personas de hoy. Persiste en `results/bazaar-live/hints.jsonl` (solo añade, entre días; también en dry-run, porque solo lee el juego) y llega a cada persona del `GameState` (más recientes primero). Excepción estrecha a «del rival solo se lee la estructura»: **nunca entra en una cifra**.
- **`labels.ts`** — paso 3, el etiquetado con LLM (opt-in, `pnpm bazaar:play --hint-llm`): `HintLabeler` manda por lotes las candidatas sin etiqueta a `claude -p` (en segundo plano, una llamada a la vez de hasta 240 s, porque medido tarda unos 2,5 min; nunca bloquea el tick; se apaga tras 3 fallos). Para cada línea, `classification` (hint, egg-clue o voice), `phrase` (la frase de sonda, que `parseLabels` solo acepta si es un trozo literal del texto y sin dígitos) y `target` (la persona a la que hay que preguntar). Caché en `results/bazaar-live/hint-labels.json`; `applyLabels` la aplica en memoria en el `GameState`.

La sonda la elige `probePhrasesFor` (`../coordinator/routes.ts`): primero pistas de otros puestos que apuntan a esta persona, después sus egg-clue y por último sus propias keywords; las líneas `voice` nunca dan frase.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`state/`](../state/AGENTS.md)
