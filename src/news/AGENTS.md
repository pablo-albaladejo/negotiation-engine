# src/news/ — Noticias del Bazaar (Radio Rastro)

Vigila las noticias del Bazaar (Radio Rastro, el Boletín del Bazar y El Tablón) y deja un resumen para el panel «Radio Rastro» de la pestaña Now del visor. Además alimenta `GameState.news` como **pista** (excepción estrecha aprobada, como las pistas de eggs): de qué dealer, set o carta se habla y en qué dirección.

**NUNCA UNA CIFRA.** Nada de esta carpeta se importa desde `coordinator/`, `dealers/`, `duels/`, `trades/`, `broker/` ni `engine/`, ninguna de esas carpetas lee `GameState.news` (lo comprueba `test/news-signals.test.ts`), y nunca produce una cifra ni una decisión. Unas noticias son ciertas, otras son rumores que no pasan y otras son solo Madrid: nada dice cuál es cuál.

## Archivos

- **`main.ts`** — `pnpm bazaar:news [--once] [--poll-ms 30000] [--no-llm] [--no-file-log]` (`--poll-ms` mínimo 30000). Cada vuelta lee lo nuevo del `stream-public.jsonl` del recorder (eventos news.posted) y, como mucho cada 30 s, `GET /api/news` (solo GET, cliente de [`shared/`](../shared/AGENTS.md)). Añade lo nuevo (sin repetir id) a `results/bazaar-live/<fecha local>/news.jsonl` y reescribe news-summary.json de forma atómica (tmp + rename). Log en `results/logs/<fecha>/news.log` (con `--no-file-log`, solo stdout: lo usa `bazaar:up`, que ya lo guarda ahí). Nunca sale del bucle por un error: lo apunta y sigue.
- **`news.ts`** — funciones puras: esquema de `/api/news`, `itemFromStreamLine`, `tagMentions` (nombres de sets, cartas, dealers y venues; solo etiqueta), `rulesSummary`, `summaryPrompt` y `buildSummaryFile`.
- **`signals.ts`** — `readNewsSignals(dir, nowTick)`: lee news-summary.json y devuelve `NewsSignals` (`available`, `updatedAt`, `summary`, `items`); nunca lanza (sin fichero o roto: vacío). Cada `NewsSignal` lleva id, tick, `ageTicks`, fuente, titular, cuerpo, menciones por tipo (sets, cards, dealers por id de persona, venues), `direction` por palabras clave en inglés y castellano (demand, supply, event, unknown) y `unverified: true`. Ningún campo de precio. `formatNewsSignals`: la línea «news» de la salida de play.
- **`llm.ts`** — `claudeOnce`: una llamada a `claude -p --model haiku` con el prompt por stdin y 60 s de tope; null si falla.

El resumen se pide al LLM solo cuando llegan noticias nuevas; si falla, tarda más de 60 s o va con `--no-llm`, se usa el resumen por reglas.

## Links

- ↑ [`src/`](../AGENTS.md)
- → Visor: [`viewer/server/bazaar/`](../../viewer/server/bazaar/AGENTS.md) (`GET /api/bazaar/news` y `news` en `/api/bazaar/model`)
- → [`state/`](../state/AGENTS.md) (`GameState.news`)
