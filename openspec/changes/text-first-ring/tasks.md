# Tasks

Orden = camino crítico del minuto 0 (grupos 1–7: configuración, normalizador, parser con evidencia, aceptación por texto, validador y fugas, plantillas en/es, latencia, arena en texto completo y eval), después lo aplazado. Cada tarea es TDD: primero el test o fixture, luego la implementación. Etiquetas: `[aplazada: tras vie 18:45]`, `[aplazada: sábado]`, `[si hay tiempo]`, `[requiere aprobación]`; una tarea sin etiqueta es camino crítico.

## 1. Configuración de ejecución

- [x] 1.1 Tests de `RuntimeConfigSchema` (esquema cerrado, valores por defecto por modo, `hybrid` por defecto y su resolución por turno, clave inválida señalada, clave secreta rechazada) y luego `src/pipeline/runtime-config.ts` con carga desde `config/runtime.json` / `RUNTIME_CONFIG` y `config/runtime.json` de ejemplo; verificar con `pnpm test` y `pnpm typecheck`
- [x] 1.2 Inyectar la configuración efectiva en el pipeline, el agente (`src/agent/`) y la arena (`--ring-mode`, `--parser-policy`, `--acceptance-signal`, `--narrator-language`, proveedor por caja), con su huella en cada entrada de la traza; verificar con un test que juega un turno con `dual-strict` por CLI y lee la huella en la traza

## 2. Normalizador numérico para cualquier escritura

- [x] 2.1 Fixtures `test/fixtures/numbers/` multiescritura (arábigo-índicos, persas, devanagari, ancho completo, `٫ ٬ ٪`, apóstrofo, espacio fino, agrupación india, caracteres de ancho cero) y test que recorre todo `\p{Nd}` y comprueba el mapeo a 0–9; luego NFKC + quitar `\p{Cf}` + tabla de ceros en `src/llm/numbers.ts`; verificar con `pnpm test test/llm/` sin regresiones en los fixtures existentes

## 3. Parser con evidencia literal y políticas

- [x] 3.1 Tests del esquema LLM nuevo (`figures` con evidencia, `intentEvidence`, `language` BCP-47, campos prohibidos siguen rechazados) y luego `src/llm/parser.ts` y el prompt de `src/llm/llm-parser.ts` (copiar el fragmento literal, cualquier idioma); verificar con respuestas grabadas
- [x] 3.2 Tabla de casos de `verifyFigures` (aparición, dígitos de otras escrituras, desambiguación por rango, `value-mismatch`, palabras es/en, `llm-only`/`confirm`, oferta parcial) y luego `src/llm/verify.ts`; verificar con `pnpm test`
- [x] 3.3 Tabla de casos de las tres políticas y `onLlmFailure` (incluido el veto determinista) y luego `src/pipeline/reconcile.ts` y la rama de solo texto de `src/pipeline/pipeline.ts`, con confianza y motivo en la caja `reconcile` y evidencias solo en la traza local; verificar con `pnpm test test/pipeline/` y que `dual-strict` reproduce las doradas
- [x] 3.4 Detección de idioma de respaldo por escritura Unicode y palabras es/en en `src/llm/deterministic-parser.ts`, idioma en la sesión (`src/pipeline/session.ts`); verificar con fixtures por escritura

## 4. Aceptación, retirada y acuerdo desde el texto

- [x] 4.1 Tabla de enlace ampliada (señal `ring-action` vs `parser-intent-verified`, evidencia de intención, negación es/en, sin oferta previa, cifras iguales/distintas/sin verificar, `llm-only` no acepta) y luego `src/pipeline/binding.ts`; verificar con `pnpm test`
- [ ] 4.2 Tests de `walkSignal` (`trace-only` no marca `rivalWalked`) y del acuerdo registrado (origen, evidencia, respuestas idempotentes tras el acuerdo) y luego `session.ts`/`pipeline.ts`; verificar con una partida sembrada contra un bot que acepta por texto — implementado y probado por turnos (`test/pipeline/text-acceptance.test.ts`); falta la partida sembrada, que necesita el bot de texto completo de 7.1
- [x] 4.3 Adaptador HTTP en `text-only` (entrada solo texto ⇒ `message`, ronda derivada, salida solo texto; `hybrid` con acción del ring) en `src/protocol/http.ts`; verificar con la batería común de contrato y fixtures nuevos en `test/fixtures/ring/`

## 5. Validador, fugas y plantillas independientes del idioma

- [x] 5.1 Tests del validador con cifras de otras escrituras y `validator.coherence` (`known-languages` marca `coherence-unchecked`, `strict` rechaza) y luego `src/llm/validator.ts` con mapa de expresiones por idioma (en, es); verificar con `pnpm test test/llm/`
- [x] 5.2 Tests del detector de fugas con la reserva en `٣٪`, `３％` y palabras es/en, y luego `src/llm/leak.ts` con `MANDATE_RE` por idioma como señal secundaria; verificar con `pnpm test` y `pnpm redteam` sin fugas
- [x] 5.3 Propiedad plantilla × idioma × decisión (pasa validador y fugas) y luego `src/llm/templates/{en,es}.ts`, forma neutral y `template.uncovered` en `src/llm/template.ts`; verificar con `pnpm test`
- [x] 5.4 `language` en `NarratorInputSchema` (sigue `.strict()`) y prompt del narrador que escribe en ese idioma (`src/llm/narrator.ts`, `src/llm/llm-narrator.ts`); verificar con respuestas grabadas en en/es/fr

## 6. Latencia

- [ ] 6.1 Proveedor, modelo, tiempo e intentos por caja en `src/llm/provider.ts`; keep-alive y calentamiento en `src/llm/anthropic-api.ts`; verificar con cliente simulado y tests de contrato del proveedor
- [ ] 6.2 Presupuesto relativo (`turn.budgetRatio`, `ring.timeoutMs`) y omisión del narrador (`minRemainingMs`, `narrator-skipped` en traza) en `src/pipeline/pipeline.ts`; verificar con reloj inyectado y cliente lento (respuesta en ≤ presupuesto)

## 7. Arena en texto completo y evaluación

- [ ] 7.1 `src/bots/nl-renderer.ts` (generaliza `text-only.ts`; es/en; formatos variados; aceptaciones y retiradas solo en texto) y `--text-mode full` en `src/arena/runner.ts`/`scenario.ts`/`cli.ts` con verdad de terreno canónica; verificar con una partida sembrada reproducible contra Boulware
- [ ] 7.2 Métricas `unextracted`, `misread`, `falseAccept`, `missedAccept`, `falseWalk`, `confirmRate`, `templateRate`, latencia p50/p95 por idioma y política en `src/arena/metrics.ts` y esquema de resultados; verificar con partidas fabricadas
- [ ] 7.3 Bot LLM en texto completo con `--language` y sin nuestra oferta estructurada (`src/bots/llm-bot.ts`); verificar con cliente grabado
- [ ] 7.4 `pnpm eval:llm` con matriz política × idioma × proveedor (`EVAL_LLM_LANGUAGES`, `EVAL_LLM_POLICIES`, `anthropic-api` si hay clave) en `src/arena/eval-llm-main.ts` y `scripts/eval-llm.sh`; verificar ejecutándolo con es,en y decidir los valores por defecto con 0 `falseAccept`
- [ ] 7.5 Test de combinaciones de configuración (0 violaciones, 0 fugas, siempre respuesta) contra el bot de texto completo; verificar con `pnpm test`
- [ ] 7.6 Actualizar `src/llm/AGENTS.md`, `src/pipeline/AGENTS.md` y `src/arena/AGENTS.md` con las claves y la política nueva

## 8. Protocolo real

- [ ] 8.1 Ajustar el adaptador de solo texto y `ring.timeoutMs` al protocolo publicado y fijar `ring.mode` en `config/runtime.json` [aplazada: tras vie 18:45]

## 9. Idiomas adicionales

- [ ] 9.1 Bots multilingües fr, ja y ar con dígitos nativos y de ancho completo [aplazada: sábado]
- [ ] 9.2 Plantillas fr (y ja/ar si `eval:llm` lo justifica), palabras numéricas fr en el normalizador, expresiones de coherencia y de mandato fr/ja/ar [aplazada: sábado]

## 10. Mandato desde brief

- [ ] 10.1 `mandate.source = brief-text` con acuerdo exacto determinista+LLM y fallo cerrado (`/health` no listo, sin valores) en `src/agent/` [aplazada: sábado] [requiere aprobación] — aplazada por decisión del usuario hasta conocer el ring; no implementar (el esquema solo admite `scenario-file`)

## 11. Red team

- [ ] 11.1 Casos de inyección es/en/fr/ja en `redteam/cases.yaml` y test de aserciones deterministas
- [ ] 11.2 Casos adversariales de evidencia (ancho cero, dígitos mezclados, etiquetas falsas, aceptaciones negadas o condicionales multilingües, cita de nuestra oferta) [aplazada: sábado]
- [ ] 11.3 Suite extendida de red team en ar y otros idiomas con el bot LLM como atacante [si hay tiempo]
