# Design: add-arena-viewer

## Context

Ver proposal.md. Fuente de intención: `docs/design/arena-viewer.dc.html` (P1–P8, solo `window.NegotiationRing.*`). Sistema de diseño en `design-system/` (17 componentes, React 18 como peer, `dist/` fuera de git, lockfile propio; reglas en `design-system/README.md` y `design-system/.design-sync/conventions.md`: inglés, `formatNumber(v, { locale: "en" })`, todo dentro de `Root`).

Escritores actuales (lo único que el visor lee):
- **Traza por partida**: `src/pipeline/trace.ts` (`TraceRecordSchema`, `TraceHeaderSchema`, `TraceLineSchema`; cabecera `arena` con mandato, `tournament` solo con `scenario {id, hash}`). Arena: `results/<runId>/traces/<gameId>.jsonl` (`src/arena/cli.ts:93-106`, `gameId = scenario__rival__seed`, `src/arena/runner.ts:68`). Torneo: `results/agent-<stamp>/<sessionId>-<hash8>.jsonl` (`src/agent/index.ts:16`, `src/agent/agent.ts:76-85`, `JsonlSessionTrace`).
- **Contenido por caja** (`src/pipeline/pipeline.ts:167-380`): `input` (`hasOffer`, `hasText`, `roundLimit`), `parser` (entrada `textLength`; salida `intent`, `claims`, `tactics`, `injectionSuspected`), `reconcile`, `binding` (oferta del rival), `engine` (entrada `issues`, `params`, `state`, `seed`; salida `Decision {action, offer?, rule}`, `src/engine/engine.ts:54-57`), `emergency`, `narrator`/`validator`/`leak` (solo longitudes y `ok`/`leak`), `template` (`{text}`), `output` (salida canónica con nuestro texto). Cada registro: `result`, `latencyMs`, `provider`. **El texto del rival no se registra** en ninguna caja.
- **Arena**: `results/<runId>/transcripts.jsonl` (`GameResult` sin `records` + `metrics`, `src/arena/cli.ts:89-92`; `TranscriptEntry {round, from, action, offer?, text}` y `GameResult` en `src/arena/runner.ts:9-39`; `GameMetrics` en `src/arena/metrics.ts:6-36`) y `summary.json` (`src/arena/cli.ts:122-138`: `runId, createdAt, llmProvider` fijo a `"none"`, `config {path, version, provenance}`, `seeds`, `overall`, `byRole`, `clusters`, y con `--candidate`: `candidate`, `paired`, `comparison`). Sin esquema Zod: hoy son interfaces TS.
- **Promoción**: `results/promote-<stamp>/gate.json` (`src/arena/promote.ts:103`: `candidate` ruta, `champion` versión, `criterion`, `gate {pass, checks[{phase, check, pass, detail}], failed}` de `src/arena/gate.ts:6-27`, `reports` por fase = `PairedReport`, `src/arena/paired.ts:100-116`). Si pasa, sobrescribe `config/champion.json` en el acto (`promote.ts:129`); no hay ensayo en seco.
- **Ajuste**: `results/<sweepId>/sweep.json` (`src/tune/tune-main.ts:65`) y candidatas en `config/candidates/` (`src/tune/sweep.ts:119`). **Red team**: `results/redteam-*/summary.json` y `report.md` (`src/redteam/main.ts:59-60`, `RedteamSummary` en `src/redteam/report.ts:13-18`). **Crítico**: `critic.md` en el directorio del run (`src/dev/critic.ts:39-72`). Ninguna pantalla del diseño los usa: el visor no los lee en esta change.

## Goals / Non-Goals

**Goals:** ver una partida ronda a ronda con lo que el motor registró; comparar campeona y candidata con la puerta tal como se evaluó; proyectar la partida en curso; nunca tumbarse por un log roto.

**Non-Goals:** recalcular métricas o decisiones; promover desde el visor; autenticación; despliegue fuera del portátil; pantallas de red team, crítico o barridos; más de 2 issues en gráficos (con `n > 2`, solo tablas).

## Decisions

### 1. `viewer/` como paquete propio, no `src/viewer/`
`tsconfig.json` raíz incluye `src` con `types: ["node"]`, sin DOM ni JSX, y TS 7; el sistema de diseño usa React 18 y TS 5.6. Meter TSX en `src/` rompería `pnpm typecheck` y añadiría React y Vite a las dependencias del agente del torneo. `viewer/` tiene `package.json`, `pnpm-lock.yaml`, `tsconfig.json` (DOM, `jsx: react-jsx`) y `vitest.config.ts` (jsdom) propios, igual que `design-system/`. La raíz añade `vitest.config.ts` que excluye `viewer/**` (verificar durante la implementación que la inclusión por defecto actual no cambia para el resto) y los scripts `viewer` (`pnpm --dir viewer start`) y `viewer:test`. El servidor importa los esquemas Zod de la raíz por ruta relativa (`../../src/pipeline/trace.ts`, `../../src/arena/results-schema.ts`) con `tsx`, así no se duplican.

### 2. Sistema de diseño por alias de ruta al código fuente
Vite `resolve.alias['@negotiation-ring/design-system'] → ../design-system/src/index.ts` (y `/styles.css → ../design-system/src/styles.css`), `resolve.dedupe: ['react','react-dom']` y `paths` equivalente en `viewer/tsconfig.json`. **Rechazado `file:`/`link:`**: `file:` copia el directorio al lockfile del visor y exige `pnpm build` del sistema (su `dist/` está en `.gitignore`) y reinstalar tras cada cambio; `link:` evita la copia pero sigue apuntando a `dist/` vía `exports`. El alias no toca ningún lockfile, no necesita build y recarga en caliente. Riesgo: dos copias de React; lo cubre `dedupe` y un test de render que usa hooks.

### 3. Un proceso: `node:http` + Vite en modo middleware
`viewer/server/main.ts` crea un `http.Server` en `127.0.0.1` (puerto `VIEWER_PORT`, por defecto 5199): `/api/*` lo atiende el router propio y el resto `vite.middlewares` (en `start:prod`, ficheros estáticos de `viewer/dist`). Sin Hono ni `concurrently`: un solo proceso, un puerto, sin CORS. Sin autenticación porque solo escucha en loopback; comprobación de `Host` contra DNS rebinding.

### 4. API y validación
`GET /api/runs`, `/api/runs/:runId` (summary + líneas de `transcripts.jsonl`), `/api/runs/:runId/games/:gameId` (traza), `/api/promote/:runId` (gate), `/api/tournament/:runId/:session`, `/api/scenario-ref?id&hash` (devuelve nuestro mandato solo si nombre y hash coinciden), `/api/live` (SSE). Identificadores con `^[A-Za-z0-9_.-]{1,128}$`, sin `..`, `realpath` dentro de la raíz. Cada respuesta es `{ data, errors: [{file, line, path, message}] }`. Lectura por streaming línea a línea (`readline`) para runs de miles de partidas, con progreso para el estado "Loading".

### 5. Adaptadores puros en `viewer/src/model/`
`runsModel`, `matchesModel`, `arenaReplayModel`, `tournamentReplayModel`, `twoIssueModel`, `gateModel`, `liveModel`: funciones puras de las respuestas validadas al modelo de cada pantalla. Permitido: seleccionar, filtrar, ordenar, contar registros, formatear y cambiar de escala (utilidad × 100). Prohibido: medias, diferencias, utilidades, objetivos, veredictos. Los tests usan fixtures generados con los escritores reales (`runArena` + `writeJsonlTrace` en un directorio temporal) para detectar deriva.

### 6. SSE en directo
`fs.watch` sobre el directorio `results/agent-*` más reciente con sondeo de respaldo de 500 ms (en macOS `fs.watch` puede perder eventos); desplazamiento por fichero, búfer de línea parcial, validación por línea. Eventos `record`, `session`, `invalid`. Cliente con `EventSource` y reconexión nativa.

### 7. Extensiones de escritores (quien decide, escribe)
- **Motor** (`src/engine/engine.ts`): `DecisionSchema` gana `explain?: { t, target, targetOffer, step, uOffer, uRival, acNext, acTime, rivalReserveEstimate }`. Opcional y `.strict()`; no cambia acción ni oferta (test de igualdad sobre fixtures y doradas). `src/pipeline/otel.ts` añade `explain` a las claves redactadas. `pnpm replay` compara solo acción, oferta y regla (verificar durante la implementación).
- **Traza** (`src/pipeline/trace.ts`): `traceVersion: z.literal(2).optional()` en ambas cabeceras; `role` opcional en la de torneo, escrito por `createTournamentTrace` desde el escenario cargado. Registro `protocol` desde `pipeline.turn()` antes de lanzar `ProtocolError` (solo rutas y códigos de Zod).
- **Arena** (`src/arena/cli.ts`, nuevo `src/arena/results-schema.ts`): `schemaVersion: 2`, `roundLimit`, `reserves {ours, rival}` en cada línea; `config.params` en `summary.json`.
- **Promoción** (`src/arena/promote.ts`, `promote-main.ts`): `gate.json` v2 con `configs`, `summaries` por fase (`summarize` existente y agrupación rival × rol), `dryRun`, `promoted`; flag `--dry-run`.

### 8. Mapa de campos y huecos

| Pantalla · campo | Fuente | Tratamiento |
|---|---|---|
| P1 run, fecha, partidas, excedente, acuerdo, violaciones, fugas | `summary.runId/createdAt/overall.*` | existe |
| P1 configuración (β, márgenes…) | — | **extender** `summary.config.params` |
| P1 estado champion/candidate | `summary.config.path/version` vs `config/champion.json.version` | existe (etiqueta, no métrica) |
| P2 KPIs (incl. empty ZOPA detected, duración) | `summary.overall.*`, `durationMs` | existe |
| P2 tabla: partida, escenario, rival, rol, resultado, precio, excedente | `transcripts.jsonl` `gameId, scenarioId, rival, role, endReason, agreement, metrics.surplusShare` | existe |
| P2 rondas "9/10" | `rounds` + — | **extender** `roundLimit` |
| P2 incidencias: template, fugas, ZOPA vacía, error del rival, mal extraídas | `metrics.*` | existe |
| P2 incidencias "injection", "AC_time", "narrow ZOPA 96–100" y casilla "injection" | solo en trazas / necesita reservas | **quitar** de P2 (están en P3) |
| P3 ofertas y chat (ambos textos) | `transcript[]` | existe |
| P3 reserva propia | cabecera arena `mandate.reservation` | existe |
| P3 reserva del rival, ZOPA | — | **extender** `reserves.rival` (solo arena) |
| P3 curva objetivo, paso, AC_next, AC_time, estimación de reserva del rival | — | **extender** `explain` del motor; la curva solo en rondas jugadas (se quitan las rondas futuras) |
| P3 regla de cierre | `engine.output.rule` | existe |
| P3 marcas de inyección, banderas del parser | `parser.output.tactics/injectionSuspected` | existe (con `LLM_PROVIDER=none` vienen vacías) |
| P3 validador "ok · 1 attempt", latencias por caja | registros `validator`, `latencyMs` | existe (conteo) |
| P3 cabecera `LLM_PROVIDER` | `record.provider` (no `summary.llmProvider`, fijo a `none`) | existe |
| P4 rol | — | **extender** `role` en cabecera de torneo |
| P4 nuestra reserva | `config/<scenario.id>` si coincide el hash | existe |
| P4 ofertas del rival, nuestras ofertas, nuestro texto | `binding.output.offer`, `output` | existe |
| P4 texto del rival en el chat | no se registra en torneo | **quitar** el texto (burbuja con acción y oferta, `text not logged`); ver Open Questions |
| P4 utilidad, estimación de reserva por ronda | — | **extender** `explain` |
| P4 nombre del rival "Team 3", "qualifying round 2", frase "closed at 102, below…" | no existe | **quitar** (se muestra `sessionId`) |
| P5 ofertas en el plano, mandato | registros `binding`/`engine`, `issues`, `mandate` | existe |
| P5 utilidades por ronda, "Utility 0.63" | — | **extender** `explain.uOffer/uRival` |
| P5 isoutilidades y fórmula de utilidad | sería recalcular | **quitar** |
| P6 métricas (excedente, acuerdo, violaciones, fugas, rondas medias, ZOPA vacía) | `gate.json` solo trae `agreementRate`, `meanSurplus` | **extender** `summaries` por fase |
| P6 columna "Change" | solo `reports.*.meanDiffPp` existe | existe para excedente; **quitar** en el resto |
| P6 checks y veredicto | `gate.checks`, `gate.pass`, valores de `reports[phase].meanDiffPp`, `sign.pValue`, `seeds.length` | existe; etiquetas inglesas por `(phase, check)` |
| P6 heatmap rival × rol | — | **extender** `summaries.candidateByRivalRole` |
| P6 diff de parámetros, "only change: β" | `gate.json` solo trae la versión de la campeona | **extender** `configs` |
| P6 comando `pnpm promote` | ruta `candidate` | **extender** `dryRun`/`promoted` + `--dry-run` |
| P7 ronda, límite, ofertas, utilidades, plantillas, ataques bloqueados | registros en vivo + `explain` | existe + extensión `explain` |
| P7 "Team 2", rival "Team 8", "Next: vs …" | no existe | **quitar** (`Us`, `sessionId`; sin calendario) |
| P7 texto del rival en las 3 burbujas | no se registra | igual que P4 |
| P8 log inválido | errores de validación del servidor | existe |
| P8 rival rompe protocolo | arena: `endReason: "rival-error"`, `error`; torneo: — | existe en arena; **extender** registro `protocol` en torneo |
| P8 ZOPA vacía | `metrics.zopaEmpty` + `reserves` | extensión de arena |
| P8 LLM caído "since 10:42", "100%" | los registros no tienen hora; el % sería cálculo | **quitar** la hora; mostrar "N of M via template" |
| P8 run vacío, cargando | `overall.games`, progreso de lectura | existe; el texto `pnpm arena --matches` del diseño se corrige (no existe ese flag) |

## Risks / Trade-offs

- **Tocar el motor el día del torneo**: `explain` es opcional y no altera la decisión; lo verifican la igualdad sobre fixtures, las doradas y `pnpm arena` con 0 violaciones. Si algo falla, la tarea se revierte sola y P3 muestra `not logged`.
- **Privacidad de `explain`**: la curva objetivo se acerca a nuestra reserva en `t → 1`. Queda en la traza local (como hoy nuestras ofertas) y se redacta en la exportación OTel.
- **Runs grandes**: 2600 líneas de transcript caben en memoria; las trazas se cargan por partida, no por run.
- **React duplicado** por el alias: `dedupe` y test de hooks.

## Migration Plan

Sin migración de datos: v1 se sigue leyendo; los campos nuevos aparecen en los runs nuevos. Rollback: revertir commits; el visor es aislado y los campos nuevos son opcionales.

## Open Questions

- ¿Registrar el texto del rival en las trazas de torneo (fichero local) para P4/P7? Por defecto **no**: se mantiene la sanitización y la burbuja muestra acción y oferta.
- ¿`pnpm promote --dry-run` es aceptable, o P6 debe salir de `pnpm arena --candidate` sin puerta? Por defecto `--dry-run`.
- ¿Nombre de equipo para el `Scoreboard`? Por defecto `Us`.
