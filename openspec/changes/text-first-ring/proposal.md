complexity: high

# Proposal: ring de solo texto y cualquier idioma (text-first-ring)

## Why

`pnpm eval:llm` muestra que el agente está diseñado para un ring estructurado y que la arena lo sobrestima:

- La reconciliación de solo texto (`reconcileTextOffer` en `src/pipeline/reconcile.ts`) exige que el parser determinista y el LLM COINCIDAN. Contra rivales que escriben en lenguaje natural la expresión regular no encuentra la mayoría de las ofertas, y el AND estricto las descarta: con el LLM, "sin extraer" SUBE (solo texto 2/8 → 8/8) y el excedente baja.
- El narrador LLM vía `claude -p` gasta unos 2 s solo en arrancar el proceso; no cabe en `turnBudgetMs` = 4500 ms y la plantilla responde casi todos los turnos.
- La mayoría de los bots de la arena mandan ofertas estructuradas, y en el modo `text-only` de la arena el agente sigue recibiendo `rivalAction` estructurada: nunca se mide la detección de aceptaciones en el texto.

Supuestos de trabajo del equipo: (1) todo lo que llega al agente y todo lo que envía es TEXTO en lenguaje natural del rival (probablemente otro agente LLM), sin oferta estructurada ni acción del ring garantizadas; (2) el rival puede escribir en CUALQUIER idioma. El protocolo del ring se publica el viernes a las 18:45, así que cada decisión es CONFIGURABLE: el valor por defecto es `hybrid` (decisión del usuario): sin campos estructurados sigue los dos supuestos, con ellos los usa, y los modos `text-only` y `structured` siguen disponibles.

## What Changes

- **Configuración de ejecución** (`config/runtime.json`, nueva): `ring.mode` (`hybrid` por defecto | `text-only` | `structured`; `hybrid` usa la oferta y la acción estructuradas cuando el ring las trae, siempre lee el texto y, sin campos estructurados, se comporta exactamente como `text-only`) y los valores por defecto que se derivan de él para el parser, la aceptación, el idioma, la plantilla, los proveedores y los tiempos. `AgentConfig` (motor, campeona) no cambia.
- **Política del parser** `parser.policy`: `llm-primary-verified` (por defecto en solo texto), `dual-strict` (la actual) y `deterministic-only`. El LLM devuelve, por cifra, el valor y el fragmento LITERAL del texto que lo respalda; el código comprueba que el fragmento aparece en el texto y, si tiene dígitos (cualquier escritura, ambas convenciones decimales), que normalizado da el valor. Los números en palabras de idiomas sin normalizador se aceptan como `llm-only` o se pide confirmación (`parser.acceptWordNumbers`). Discrepancia o cifra no verificable ⇒ sin oferta este turno y pedimos confirmar.
- **Aceptación y retirada desde el texto**: `acceptance.signal` (`parser-intent-verified` por defecto en `hybrid` y solo texto para turnos sin acción del ring | `ring-action`). Un acuerdo inferido solo puede ser nuestra última oferta; al aceptar repetimos las cifras. La retirada inferida no nos hace retirarnos por defecto (`acceptance.walkSignal: trace-only`). El acuerdo se registra en la sesión aunque el ring no traiga acción.
- **Cualquier idioma**: el parser devuelve el idioma (BCP-47); el narrador escribe en él (`narrator.language: auto`); plantillas en `en` y `es` con forma neutral (cifras y frase corta) para idiomas sin plantilla. El normalizador numérico, el validador y el detector de fugas pasan a ser independientes del idioma y de la escritura: dígitos Unicode (`\p{Nd}`, NFKC), separadores locales, y la fuga se detecta por proximidad numérica a la reserva; las palabras clave del mandato quedan como señal secundaria.
- **Latencia**: proveedor y tiempo máximo por caja (`llm.parser.*`, `llm.narrator.*`); `anthropic-api` (HTTP, sin arrancar procesos) recomendado en solo texto; presupuesto relativo al tiempo del ring (`turn.budgetRatio`); el narrador se omite si no queda tiempo (`llm.narrator.minRemainingMs`).
- **Origen del mandato** `mandate.source`: solo `scenario-file`. `brief-text` (brief de la ORGANIZACIÓN, canal de confianza, acuerdo estricto determinista+LLM y fallo cerrado) queda **aplazado por decisión del usuario hasta conocer el ring**, por ser una desviación de la regla "el LLM nunca fija el mandato".
- **Arena realista**: modo de texto completo para TODOS los bots (lenguaje natural, sin oferta ni acción estructuradas hacia el agente, verdad de terreno guardada por la arena), bots multilingües (es, en; después fr y ja/ar con formatos variados), bot LLM como sparring principal y `pnpm eval:llm` comparando políticas e idiomas con métricas de lectura (sin extraer, mal leídas, falsas aceptaciones, acuerdo, excedente, latencia, tasa de plantilla).
- **Seguridad**: casos de inyección y red team en varios idiomas y casos adversariales de evidencia y dígitos; las reglas de cuarentena no cambian.

Reglas no negociables que este cambio NO toca: el código decide toda cifra y toda decisión de aceptar o retirarse; el LLM nunca fija mandato, reserva ni identidad desde el texto del rival; toda oferta pasa por los guardarraíles; siempre respondemos; nunca se filtra el mandato.

## Capabilities

### New Capabilities
- `ring-config`: configuración de ejecución por modo de ring, sus valores por defecto y su visibilidad en la traza.

### Modified Capabilities
- `ring-protocol`: contrato canónico en solo texto, aceptación ligada a nuestra última oferta también desde el texto, registro del acuerdo sin acción del ring.
- `llm-boundary`: política del parser, evidencia literal y verificación, idioma, normalizador/validador/detector de fugas independientes del idioma, plantillas multilingües, proveedor y tiempos por caja, mandato desde brief.
- `turn-pipeline`: aceptación y retirada inferidas, confirmación de cifras, presupuesto relativo y omisión del narrador, nivel de confianza en la traza.
- `arena`: texto completo para todos los bots, bots multilingües, sparring LLM, métricas de lectura y evaluación de políticas.
- `red-team`: inyección multilingüe y casos de evidencia y dígitos.

## Impact

- Código: `src/llm/` (parser, llm-parser, numbers, validator, leak, template, narrator, llm-narrator, provider, anthropic-api, nuevo `verify.ts` y `templates/`), `src/pipeline/` (reconcile, binding, pipeline, session, nuevo `runtime-config.ts`), `src/protocol/` (adaptador HTTP en solo texto), `src/arena/` (runner, metrics, cli, scenario, eval-llm-main), `src/bots/` (renderizador de lenguaje natural multilingüe, llm-bot), `src/agent/` (carga de la configuración; brief del mandato si se aprueba), `redteam/`, fixtures en `test/fixtures/{numbers,parser,llm}`.
- Configuración: `config/runtime.json` nuevo con valores por defecto; `ANTHROPIC_API_KEY` y `ANTHROPIC_MODEL` necesarios para el proveedor recomendado.
- Depende de `add-agent-architecture` (requisitos que se modifican); se archiva después de él.
- Sin dependencias nuevas.
