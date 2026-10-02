# Design: text-first-ring

## Context

Ver proposal.md (Why). Estado de partida medido en el código:

- `reconcileTextOffer` (`src/pipeline/reconcile.ts`) hace un AND estricto; `pipeline.ts` (ramas 306-318) lo aplica cuando falta `rivalOffer`, y `bindRivalMove` (`binding.ts`) solo atiende a `rivalAction`: la intención del parser nunca cierra un acuerdo.
- `numbers.ts` solo reconoce dígitos ASCII (`TOKEN_RE` con `\d`), palabras en español e inglés y separadores `.`/`,`. `validator.ts` comprueba la coherencia con `ACCEPT_RE`/`WALK_RE` en español e inglés (un narrador en francés siempre fallaría y caería a la plantilla). `leak.ts` ya bloquea por proximidad numérica, pero sobre ese normalizador ASCII, y su `MANDATE_RE` es español/inglés. `template.ts` solo escribe en español.
- `provider.ts` elige un único proveedor por `LLM_PROVIDER`, sin reintentos; parser y narrador tienen 4000 ms por defecto; el pipeline reparte el tiempo restante entre 2 intentos del narrador.
- La arena en `text-only` (`runner.ts`) quita `rivalOffer` pero sigue dando `rivalAction` estructurada al agente y nuestra oferta estructurada al bot; `text-only.ts` es el único bot que escribe en lenguaje natural (es/en).
- El motor responde `walk` si la sesión marca `rivalWalked` (`engine.ts`): una retirada mal leída nos haría perder el acuerdo.
- `openspec/specs/` no existe: este cambio MODIFICA requisitos de `add-agent-architecture` y solo se puede archivar después de él (`openspec validate` lo avisa).

## Goals / Non-Goals

**Goals:** leer ofertas y aceptaciones en lenguaje natural de cualquier idioma con el LLM como lector principal y el código como verificador; escribir en el idioma del rival; validador y detector de fugas independientes del idioma; caber en el tiempo del ring; medir todo esto en la arena; todo configurable, con `hybrid` por defecto (texto cuando el ring no trae campos estructurados).

**Non-Goals:** cambiar el motor, la estrategia o la campeona; escribir el adaptador del protocolo real (viernes 18:45); verificar palabras numéricas de todos los idiomas; traducir el texto del rival.

## Decisions

Tabla de claves (`config/runtime.json`, esquema cerrado en `src/pipeline/runtime-config.ts`, resuelto por modo; opciones de CLI en arena y eval):

| Clave | Por defecto (`hybrid`) | Alternativas | Test |
|---|---|---|---|
| `ring.mode` | `hybrid` | `text-only`, `structured` | esquema + resolución por modo |
| `ring.timeoutMs` | sin valor | ms del protocolo publicado | presupuesto |
| `parser.policy` | `llm-primary-verified` (`dual-strict` en structured); solo se aplica a turnos sin `rivalOffer` | `dual-strict`, `deterministic-only` | tabla de casos de reconcile |
| `parser.acceptWordNumbers` | `confirm` | `llm-only` | casos ja/fr en palabras |
| `parser.onLlmFailure` | `deterministic` | `confirm` | fallo simulado del cliente |
| `parser.ranges` | `conservative` | `confirm` | extremo peor, nunca aceptar |
| `parser.units.bps` | ninguna adicional | palabras por idioma | unidad explícita |
| `acceptance.signal` | `parser-intent-verified` (`ring-action` en structured); solo se aplica a turnos con `rivalAction = message` | `ring-action` | tabla de enlace |
| `acceptance.walkSignal` | `trace-only` (`ring-action` en structured); solo se aplica a turnos con `rivalAction = message` | `parser-intent-verified`, `ring-action` | caso de retirada aparente |
| `narrator.language` | `auto` | código BCP-47 fijo | entrada del narrador |
| `narrator.uncovered` | `template` | `llm` | idioma sin coherencia comprobable |
| `template.languages` | `["en","es"]` | + `fr`, `ja`, `ar` | propiedad plantilla×idioma |
| `template.fallbackLanguage` | `en` | cualquiera de `template.languages` | idioma sin plantilla |
| `template.uncovered` | `neutral` | `fallback-language` | idioma sin plantilla |
| `validator.coherence` | `known-languages` | `strict` | texto en ja |
| `llm.parser.{provider,model,timeoutMs,attempts}` | `LLM_PROVIDER`, `ANTHROPIC_MODEL`, 1800, 1 (2 en structured) | `none`/`claude-cli`/`anthropic-api`; 2 intentos | cliente simulado con latencia |
| `llm.narrator.{provider,model,timeoutMs,attempts}` | `LLM_PROVIDER`, `ANTHROPIC_MODEL`, 1500, 1 (2 en structured) | ídem | ídem |
| `llm.narrator.minRemainingMs` | 900 | cualquier ms | narrador omitido |
| `turn.budgetRatio` | 0.9 | (0, 1] | presupuesto relativo |
| `mandate.source` | `scenario-file` (único valor admitido) | `brief-text` aplazado por decisión del usuario hasta conocer el ring; el esquema lo rechaza | esquema |

### 1. Modo de ring y contrato canónico
El contrato canónico (`TurnInput`/`TurnOutput`) no cambia: el adaptador de solo texto rellena `rivalAction = message`, deriva la ronda de la sesión y envía solo el texto; acción y oferta canónicas siguen existiendo internamente (traza, validador, métricas). Alternativa descartada: un `TurnInput` distinto por modo (duplica el pipeline).

**`hybrid` es el valor por defecto** (decisión del usuario): usa la oferta y la acción estructuradas cuando el ring las trae y siempre lee el texto; sin campos estructurados se comporta exactamente como `text-only`. Resolución por turno, igual en los tres modos (la diferencia entre modos está solo en los valores por defecto y en lo que el adaptador conserva):

- **Oferta.** Con `rivalOffer` se usa la oferta estructurada (confianza `structured`) y `parser.policy` no interviene. Sin `rivalOffer`, la oferta se extrae del texto con `parser.policy`.
- **Aceptación y retirada.** Con `rivalAction` distinta de `message` (`offer`, `accept`, `walk`) prevalece la acción del ring (comportamiento `ring-action`): la intención leída en el texto solo informa al narrador. Con `rivalAction = message` se aplican `acceptance.signal` y `acceptance.walkSignal`.
- **Texto.** Si hay texto, el parser se llama siempre (intención, tácticas, idioma, narrador), también cuando hay campos estructurados.

Valores por defecto resueltos:

| Clave | `hybrid` | `text-only` | `structured` |
|---|---|---|---|
| `parser.policy` | `llm-primary-verified` | `llm-primary-verified` | `dual-strict` |
| `acceptance.signal` | `parser-intent-verified` | `parser-intent-verified` | `ring-action` |
| `acceptance.walkSignal` | `trace-only` | `trace-only` | `ring-action` |
| `llm.*.attempts` | 1 | 1 | 2 |

Así, un turno `hybrid` sin `rivalOffer` y con `rivalAction = message` usa exactamente los valores de `text-only`, y un turno con campos estructurados usa los de `structured` para esos campos. En `text-only` el adaptador descarta los campos estructurados, de modo que todo turno sigue la ruta de texto. Sin proveedor LLM (parser determinista), `llm-primary-verified` y `dual-strict` se degradan a `deterministic-only`, como hoy. Una clave fijada en el fichero o por CLI sustituye al valor por defecto del modo, pero no a la regla de que una acción del ring distinta de `message` prevalece.

### 2. Política del parser y verificación por evidencia
Esquema LLM nuevo: `figures: {issue, value, evidence}[]`, `intent`, `intentEvidence?`, `language`, `claims`, `tactics`, `injectionSuspected` (cerrado). La oferta se deriva en código (`src/llm/verify.ts`), con los pasos de la spec: aparición del fragmento tras NFKC + quitar `\p{Cf}` + plegado; si tiene `\p{Nd}`, lectura igual al valor, filtrando lecturas por el rango del issue; si son palabras es/en, lectura del normalizador; si no, `llm-only`. El parser determinista pasa de llave conjunta a veto: solo bloquea si extrae una oferta completa distinta. Razón: la medición muestra que el AND pierde casi todas las ofertas en lenguaje natural, y la evidencia literal impide que el LLM invente una cifra que no esté en el texto. Lo que la verificación NO cubre: que el LLM atribuya bien una cifra al issue (`pct` vs `day`); lo mitigan el rango del issue y la tasa `misread` de la arena. `dual-strict` y `deterministic-only` siguen siendo el comportamiento anterior.

### 3. Aceptación y retirada desde el texto
Aceptación verificada (solo en turnos con `rivalAction = message` y `acceptance.signal = parser-intent-verified`) = intención `accept` + evidencia literal presente + sin negación detectada (es/en deterministas) + oferta nuestra previa + sin cifras nuevas, o cada cifra citada verificada (dígitos o palabras, nunca `llm-only`) e igual al valor de ese issue en nuestra última oferta (puede citar solo algunos issues). Un acuerdo inferido siempre es nuestra última oferta (ya dentro del mandato): el peor caso de una falsa aceptación es repetir nuestra oferta, no conceder. Al aceptar repetimos las cifras (validador). Acuerdo registrado en la sesión con origen y evidencia; tras él, respuestas idempotentes. Retirada: `trace-only` por defecto porque el motor se retira si `rivalWalked`, y un falso positivo destruye el acuerdo (0 para ambos), mientras que en un ring de texto la partida la cierra el ring.

### 4. Idioma
Idioma del parser (BCP-47) con respaldo determinista por escritura Unicode. Narrador con `language` en su entrada cerrada. Plantillas por idioma en `src/llm/templates/{en,es}.ts`, cifras con dígitos ASCII; forma neutral para el resto. Cambios exactos:
- `numbers.ts`: pre-pase NFKC + quitar `\p{Cf}`; `TOKEN_RE` con `\p{Nd}` y tabla de ceros por bloque Unicode (test que recorre todo `\p{Nd}`); separadores `٫ ٬ ' espacio espacio-fino`, agrupación india; `٪`. Palabras siguen en es/en (fr el sábado).
- `validator.ts`: cifras con el normalizador ampliado; `ACCEPT_RE`/`WALK_RE` pasan a un mapa por idioma; coherencia solo en idiomas cubiertos según `validator.coherence`; recibe el idioma del texto.
- `leak.ts`: la proximidad numérica ya existe y pasa a cubrir toda escritura al ampliar el normalizador; `MANDATE_RE` pasa a un mapa por idioma como señal secundaria. Garantía en idiomas sin palabras cubiertas: el narrador nunca recibe la reserva.
- `deterministic-parser.ts`: negación y tácticas siguen en es/en; se añade la detección de idioma por escritura.

### 5. Latencia
`anthropic-api` (fetch con keep-alive y calentamiento al arrancar) recomendado en solo texto; `claude-cli` solo en desarrollo (≈2 s de arranque). Reparto con 4500 ms: parser ≤ 1800, motor ≈ 0, narrador ≤ min(1500, restante − 300 de reserva para validador, fugas y plantilla); narrador omitido si quedan < 900 ms; un solo intento por defecto. Proveedor por caja para poder poner el parser en HTTP y el narrador en plantilla.

### 6. Origen del mandato
Solo `scenario-file`: el esquema rechaza cualquier otro valor. `brief-text` (canal de la organización al arrancar, acuerdo exacto determinista+LLM y fallo cerrado) queda aplazado por decisión del usuario hasta conocer el ring: es una desviación de "el LLM nunca fija el mandato" y no se implementa en este cambio.

### 7. Arena realista
`--text-mode full`: renderizador de lenguaje natural común (`src/bots/nl-renderer.ts`, generalización de `text-only.ts`) que envuelve cualquier estrategia; la arena guarda el movimiento canónico como verdad de terreno y decide el acuerdo real con él. `--languages` por semilla. Bot LLM en texto completo e idioma dado. `eval:llm`: matriz política × idioma × proveedor con las métricas de la spec.

### 8. Seguridad
Sin cambios en la cuarentena: el texto del rival solo lo lee el parser; las evidencias son texto del rival y quedan solo en la traza local (`LOCAL_ONLY_BOXES` o redacción en OTel/pino). Casos de red team multilingües y adversariales de evidencia.

## Risks / Trade-offs

- **Atribución equivocada de issue** (la evidencia existe pero era el día, no el porcentaje) → rango del issue, veto determinista y métrica `misread`; si `misread` > 0 en eval, volver a `dual-strict` por configuración.
- **Bucle de confirmaciones** con rivales que solo escriben palabras en idiomas no cubiertos y `acceptWordNumbers = confirm` → el motor sigue concediendo por tiempo; medir `confirmRate` y decidir el valor por defecto con datos.
- **Falsa aceptación por LLM** (intención `accept` en un "acepto si…") → evidencia literal + veto de negación es/en + acuerdo limitado a nuestra última oferta; métrica `falseAccept` = 0 como puerta.
- **Coherencia sin comprobar** en idiomas no cubiertos → las cifras siguen validadas; `strict` disponible.

## Migration Plan

Todo detrás de `config/runtime.json`; `ring.mode = structured` reproduce el comportamiento actual (salvo los arreglos del normalizador); con `hybrid` por defecto, un ring estructurado tampoco cambia, porque su oferta y su acción prevalecen. Archivar después de `add-agent-architecture`. Rollback: cambiar claves, sin despliegue.

## Open Questions

- Resueltas por el usuario: `ring.mode = hybrid` por defecto; `acceptance.walkSignal = trace-only`; una aceptación verificada leída en el texto puede cerrar el acuerdo; `mandate.source` solo `scenario-file` (`brief-text` aplazado hasta conocer el ring).
- ¿`parser.acceptWordNumbers` por defecto `confirm` o `llm-only`? (por defecto `confirm` hasta medir `confirmRate`).
- ¿Modelo del parser y del narrador en `anthropic-api` y su latencia real? (medir con `eval:llm` antes del viernes 18:45).
