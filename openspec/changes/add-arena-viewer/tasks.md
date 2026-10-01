# Tasks

Orden = camino crítico del minuto 0 (grupos 1–5: servidor, extensiones de escritores, adaptadores, P1–P4 y los estados de P8 log inválido, vacío y cargando), después lo aplazado. Cada tarea es TDD: primero el test o fixture, luego la implementación. Etiquetas de aplazamiento: `[aplazada: sábado]`, `[aplazada: domingo]`, `[si hay tiempo]`; una tarea sin etiqueta es camino crítico.

## 1. Paquete del visor

- [x] 1.1 Crear `viewer/` (`package.json` con react/react-dom 18, vite, @vitejs/plugin-react, vitest, jsdom, @testing-library/react, zod, tsx; `tsconfig.json`; `vite.config.ts` con alias a `../design-system/src` y `dedupe` de React; `vitest.config.ts`), `vitest.config.ts` raíz que excluye `viewer/**`, y scripts raíz `viewer` y `viewer:test`; verificar con un test de render de `Root` + `KpiStrip` con un hook en `viewer/` y `pnpm test` y `pnpm typecheck` raíz sin cambios

## 2. Extensiones de los escritores

- [x] 2.1 Esquemas Zod `TranscriptLineSchema`, `SummarySchema`, `GateFileSchema` en `src/arena/results-schema.ts` que aceptan v1; luego `schemaVersion: 2`, `roundLimit`, `reserves` y `config.params` en `src/arena/cli.ts`; verificar con un test que ejecuta la arena con 1 semilla en un directorio temporal y valida cada línea y el resumen
- [x] 2.2 Propiedad "misma acción, oferta y regla con y sin `explain`" sobre `test/fixtures/engine/` y las doradas; luego `explain` opcional en `DecisionSchema` y en el motor (`src/engine/engine.ts`), `explain` redactado en `src/pipeline/otel.ts`; verificar con `pnpm test` (incluidos `test/golden.test.ts` y `test/dev/replay.test.ts`) y `pnpm arena` con 0 violaciones
- [x] 2.3 `traceVersion: 2` opcional en las cabeceras y `role` en la de torneo (`src/pipeline/trace.ts`, `src/agent/agent.ts`); verificar con tests de que una traza v1 sigue validando y que la cabecera de torneo con `mandate` se rechaza

## 3. Servidor local

- [x] 3.1 Tests de enlace (`address === "127.0.0.1"`, sin host configurable), `Host` ajeno ⇒ 403, método no `GET` ⇒ 405, path traversal (codificado, absoluto, enlace simbólico hacia fuera) ⇒ 400/404, config fuera de la lista ⇒ 404; luego `viewer/server/` con `node:http` y guardas de ruta; verificar con `pnpm viewer:test`
- [x] 3.2 Tests de validación por línea (línea inválida con número y campo, JSON truncado, fichero vacío) sin caída; luego lectores en streaming y endpoints `/api/runs`, `/api/runs/:runId`, `/api/runs/:runId/games/:gameId`, `/api/tournament/:runId/:session`, `/api/scenario-ref` (solo con nombre y hash coincidentes); verificar con `pnpm viewer:test`
- [x] 3.3 `pnpm viewer` arranca en un proceso servidor + Vite middleware; verificar a mano que `http://127.0.0.1:5199/` carga y `/api/runs` responde
  - Nota: `pnpm viewer` sirve la API y un `index.html` mínimo (Root del sistema de diseño); las pantallas llegan en 5.x. Verificado con curl: `/api/runs` 200 con los runs reales de `results/` y `/` 200.

## 4. Adaptadores (fichero → modelo de pantalla)

- [x] 4.1 Fixtures generados con los escritores reales (arena, traza de arena, traza de torneo) y tests de `runsModel`, `matchesModel` (filtros), `arenaReplayModel` (con y sin `explain`, sin traza) y `tournamentReplayModel` (sin reserva del rival ni ZOPA; reserva propia solo con hash coincidente); luego los adaptadores en `viewer/src/model/`; verificar con `pnpm viewer:test` y un test que comprueba que los modelos no contienen campos calculados (solo valores de fuente o conteos)
  - Nota: adaptadores en `viewer/src/model/` y tests en `viewer/test/` (fixtures generados en un directorio temporal por `viewer/test/fixtures.ts`); hasta 1.1 corren con `pnpm test` raíz y se tipan con un tsconfig ad hoc. 1.1 debe moverlos a `pnpm viewer:test` y al `tsconfig.json` de `viewer/` al excluir `viewer/**` del vitest raíz.

## 5. Pantallas del minuto 0

- [ ] 5.1 P1 runs y P2 partidas con `Filters`; verificar con un smoke test de render por pantalla sobre los fixtures
- [ ] 5.2 P3 replay arena (`OfferChart`, chat, panel de decisión por ronda, selección por punto) y P4 replay torneo (`ModeBadge`, tabla de estimación, burbujas del rival sin texto); verificar con smoke tests y un test de que el texto del rival con HTML se muestra literal
- [ ] 5.3 Estados P8: log inválido (fichero, línea, campo, líneas válidas), run vacío y cargando con progreso; verificar con smoke tests

## 6. Sábado: dos issues y campeona vs candidata

- [ ] 6.1 Adaptador `twoIssueModel` y P5 (`Scatter2D` con mandato, utilidades de `explain`, tabla; sin isoutilidades); verificar con un fixture de `pct-day` y smoke test [aplazada: sábado]
- [ ] 6.2 `gate.json` v2 (`configs`, `summaries` por fase con `candidateByRivalRole`, `dryRun`, `promoted`) y `pnpm promote --dry-run` en `src/arena/promote.ts` y `promote-main.ts`; verificar con `test/arena/promote.test.ts` que en seco `config/champion.json` no cambia y que `gate.json` valida con `GateFileSchema` [aplazada: sábado]
- [ ] 6.3 Endpoint `/api/promote/:runId`, `gateModel` y P6 (métricas, checks con etiquetas inglesas, `Heatmap`, diff de parámetros, comando solo con `dryRun && pass`); verificar con smoke tests de aprobado, rechazado y ya promovido [aplazada: sábado]

## 7. Domingo o si hay tiempo: directo y estados restantes

- [ ] 7.1 Tests de la cola SSE (línea añadida < 1 s, escritura partida, fichero de sesión nuevo, línea inválida ⇒ evento `invalid`); luego `/api/live` con `fs.watch` + sondeo 500 ms; verificar con `pnpm viewer:test` [aplazada: domingo]
- [ ] 7.2 `liveModel` y P7 proyector (`Scoreboard`, `OfferChart` grande, 3 últimas burbujas, LIVE/FINAL/BREAK, tema oscuro); verificar con smoke test y a mano con `pnpm agent` + `scripts/smoke.sh` [aplazada: domingo]
- [ ] 7.3 Registro `protocol` en `src/pipeline/pipeline.ts` (solo rutas y códigos de Zod) con test en `test/pipeline/`; verificar que no contiene texto del rival [si hay tiempo]
- [ ] 7.4 Estados P8 restantes: rival rompe protocolo, ZOPA vacía con retirada, LLM caído ("N of M via template"); verificar con smoke tests [si hay tiempo]
