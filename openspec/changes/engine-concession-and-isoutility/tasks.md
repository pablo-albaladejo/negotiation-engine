# Tasks

Orden = camino crítico del minuto 0 (grupos 1–3: `noFreeConcession`, sus tests y su medición), después lo aplazado. Cada tarea es TDD: primero el test o la propiedad, luego la implementación. Etiquetas: `[aplazada: sábado]` (iso-utilidad con utilidad lineal), `[aplazada: tras causa-prima-arena]` (iso-utilidad con utilidad TAE), `[si hay tiempo]`; una tarea sin etiqueta es camino crítico.

## 1. Equivalencia y configuración

- [ ] 1.1 Propiedad "decisión idéntica byte a byte con las opciones ausentes" (`JSON.stringify(decide(input))` frente a una copia congelada de la implementación actual, sobre `test/engine/arbitraries.ts`, fixtures y doradas); verificar que pasa antes de tocar el motor con `pnpm test test/engine/ test/golden.test.ts`
- [ ] 1.2 Claves opcionales `noFreeConcession` (`epsilon`, `fraction`, `releaseT`) e `isoUtility` en `EngineParamsSchema` (`src/engine/engine.ts`) y `AgentConfigSchema` (`src/engine/config.ts`), mapeo en `src/pipeline/pipeline.ts` y `src/arena/cli.ts`, y en `config.params` de `src/arena/results-schema.ts`; verificar con tests de esquema (rangos, ausencia = apagada) y `pnpm typecheck`

## 2. Sin concesión gratis

- [ ] 2.1 Tests de "oferta nueva" (sin oferta, igual, mejora ≤ `epsilon`, sin confirmar, oscilación, primera oferta); luego `state.rivalOfferedThisTurn` en `EngineInputSchema` y la función `isNewRivalOffer` en `src/engine/engine.ts`; verificar con `pnpm test test/engine/`
- [ ] 2.2 Propiedades fast-check: con la regla encendida y `fraction = 0`, sin oferta nueva y sin liberación, la contraoferta es nuestra última oferta; con `fraction > 0`, la concesión ≤ `fraction` · paso Boulware; luego la retención en `decide` (sustituye al factor de reciprocidad, antes de los guardarraíles, `ourNextUtility` = la retenida); verificar con `pnpm test test/engine/`
- [ ] 2.3 Tests de liberación por plazo (`t ≥ releaseT`, `isLastMove` con y sin `rivalCanRespond`, `defaultHorizonReached`) y de que la decisión coincide entonces con la de la regla apagada; luego la liberación; verificar con `pnpm test test/engine/`
- [ ] 2.4 Test del pipeline: turno de solo texto y turno con cifras sin confirmar dan `rivalOfferedThisTurn = false`, turno con oferta enlazada da `true`; luego fijarlo en `engineInputFor` (`src/pipeline/pipeline.ts`); verificar con `pnpm test test/pipeline/`
- [ ] 2.5 `explain.offerRule` (`held-no-new-offer`, `held-partial`, `released-deadline`) opcional en `ExplainSchema`, ausente con las opciones apagadas; test de que no cambia la decisión, no contiene cifras y se redacta en OTel y pino; mostrarlo en el panel de ronda de `viewer/src/screens/ArenaReplayScreen.tsx` ("not logged" si falta); verificar con `pnpm test` y `pnpm viewer:test`

## 3. Medición de `noFreeConcession`

- [ ] 3.1 Candidatas `config/baselines/nfc.json` y `config/baselines/nfc-f25.json` (campeona + regla, `fraction` 0 y 0,25); `pnpm promote <candidata> --dry-run` en escenarios estructurados y `pct-day-*` contra `boulware`, `conceder` y `tit-for-tat`; anotar en `provenance.metrics`: diferencia media pp, tasa de acuerdo, violaciones, fugas, excedente de `pct-day-buyer-wide` × `boulware` y × `tit-for-tat`, histograma de reglas de aceptación; verificar que `config/champion.json` no cambió y que `results/` tiene `gate.json` de cada candidata
- [ ] 3.2 Si una candidata pasa la puerta y los criterios extra de design.md §8 (acuerdo global −2 pp como mucho, ningún `price-*-narrow*` −5 pp), proponer al usuario `pnpm promote` sin `--dry-run`; si no, registrar el motivo en este fichero

## 4. Iso-utilidad con utilidad lineal

- [ ] 4.1 `[aplazada: sábado]` Interfaz `UtilitySpace` y `linearSpace(issues, mandate)` en nuevo `src/engine/iso-utility.ts`; tests de que `linearSpace` da la misma utilidad, mandato y redondeo que `issues.ts`; verificar con `pnpm test test/engine/`
- [ ] 4.2 `[aplazada: sábado]` Propiedades fast-check: `|u(iso) − u(plana)| ≤ δ` y `u(iso) ≥ u`, `withinOfferMandate` siempre, utilidades nuestras nunca suben, un issue = oferta plana, y las mismas propiedades con un `UtilitySpace` de prueba no lineal y monótono; luego `isoUtilityOffer` (barrido de rejilla en 2 issues, `closest-to-rival-last`, `opponent-model`, desempates, oferta plana como reserva); verificar con `pnpm test test/engine/`
- [ ] 4.3 `[aplazada: sábado]` Enchufar la colocación en `generateOffer` (`src/engine/offer.ts`) y `decide` (oferta del rival y `estimatedWeights`), `offerRule` `iso-utility-closest` / `iso-utility-model` / `iso-utility-plain`; la retención sigue devolviendo la oferta literal; verificar con `pnpm test` (incluida la propiedad 1.1)
- [ ] 4.4 `[aplazada: sábado]` Si el usuario aprueba la pregunta abierta 1: pesos por rol opcionales en el escenario (`src/arena/scenario.ts`, `src/bots/bot.ts`), escenario `pct-day-buyer-asym` en `config/arena/scenarios.json` y delta de `arena`; verificar con `pnpm arena --scenarios pct-day-buyer-asym --seeds 5` con 0 violaciones
- [ ] 4.5 `[aplazada: sábado]` Utilidad nuestra media del acuerdo en `src/arena/metrics.ts` si no existe; candidatas `iso-closest.json`, `iso-model.json`, `nfc-iso.json` por `pnpm promote --dry-run` en estructurados y `pct-day-*` (y `pct-day-buyer-asym` si existe); promover solo si mejora `surplusShare` sin empeorar la utilidad del acuerdo ni la tasa de acuerdo (design.md §8)

## 5. Iso-utilidad con utilidad TAE

- [ ] 5.1 `[aplazada: tras causa-prima-arena]` `UtilitySpace` TAE sobre la utilidad y el guardarraíl de la unidad `apr` de `causa-prima-arena`; las propiedades de 4.2 sobre escenarios `apr`; verificar con `pnpm test test/engine/`
- [ ] 5.2 `[aplazada: tras causa-prima-arena]` Repetir la medición de 3.1 y 4.5 con el bot Causa-Prima-engine y los escenarios `apr`; verificar con `gate.json` de cada candidata y 0 violaciones del mandato `apr`
