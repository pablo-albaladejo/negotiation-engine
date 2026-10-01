# Spec Delta: turn-pipeline

## Purpose

Infiere del texto la aceptación y la retirada del rival sin dar al LLM autoridad sobre el acuerdo, y ajusta el presupuesto del turno para que el LLM quepa en el tiempo del ring.

## ADDED Requirements

### Requirement: Aceptación inferida del texto verificada
Con `acceptance.signal = parser-intent-verified` y un turno con `rivalAction = message` (una acción del ring distinta prevalece), una aceptación del rival SHALL inferirse del texto solo si: la intención del parser es `accept`; el parser devuelve un fragmento literal de evidencia de esa intención que aparece en el texto (misma normalización que las cifras); el parser determinista no detecta una negación en los idiomas que cubre; existe una oferta nuestra previa; y el texto no trae cifras nuevas o cada cifra que cita está verificada (dígitos o palabras; una cifra `llm-only` no basta) y coincide con el valor de ese issue en nuestra última oferta, aunque solo cite algunos issues. Al aceptar, nuestra respuesta repite las cifras del acuerdo. Si el texto trae cifras sin verificar, el turno SHALL tratarse como sin oferta y sin acuerdo. Con `parser.policy = deterministic-only`, la intención SHALL venir del parser determinista. El acuerdo SHALL ser siempre exactamente nuestra última oferta, que ya pasó los guardarraíles.

#### Scenario: Aceptación en alemán sin cifras
- **WHEN** nuestra última oferta fue 2 % a día 20 y el rival escribe "Einverstanden, das nehmen wir" con intención `accept` y evidencia "Einverstanden"
- **THEN** se registra el acuerdo 2 % a día 20 con origen `rival-text-verified` y respondemos confirmando 2 y 20

#### Scenario: Aceptación con cifras ilegibles
- **WHEN** el rival escribe "acepto, pero a tres y pico" con intención `accept`
- **THEN** no se registra acuerdo y la respuesta pide confirmar las cifras

#### Scenario: Negación detectada
- **WHEN** el rival escribe "no acepto ese 2 %" y el parser LLM devuelve intención `accept`
- **THEN** el parser determinista detecta la negación, no hay acuerdo y el motor decide como en cualquier otro turno

### Requirement: Aceptación cuando falla el parser LLM
Si el parser LLM falla o agota su tiempo en un turno con `rivalAction = message` y `acceptance.signal = parser-intent-verified`, la aceptación SHALL decidirse según `parser.onLlmFailure`: con `deterministic`, la intención y su evidencia SHALL venir del parser determinista y la aceptación SHALL verificarse con las mismas reglas que sin LLM (evidencia literal, sin negación es/en, oferta nuestra previa, y sin cifras o con la oferta completa del determinista igual a nuestra última oferta); con `confirm`, una aceptación leída por el determinista MUST NOT registrar acuerdo y la respuesta SHALL repetir exactamente nuestra última oferta con `ask = confirm-acceptance`, pidiendo al rival que confirme. La traza SHALL registrar `llmFailed` y la regla aplicada.

#### Scenario: Fallo del LLM con respaldo determinista
- **WHEN** con `onLlmFailure = deterministic` el parser LLM agota su tiempo y el rival escribe "Vale, trato hecho." tras nuestra oferta
- **THEN** se registra el acuerdo en nuestra última oferta con origen `rival-text-verified`

#### Scenario: Fallo del LLM con confirmación
- **WHEN** con `onLlmFailure = confirm` el parser LLM falla y el rival escribe "Vale, trato hecho."
- **THEN** no se registra acuerdo, respondemos con nuestra última oferta y pedimos que confirme la aceptación

### Requirement: Retirada inferida del texto
La retirada leída en el texto SHALL tratarse según `acceptance.walkSignal`: `trace-only` (por defecto en `hybrid` y `text-only`; solo se aplica a turnos con `rivalAction = message`) la registra en la traza y la pasa al narrador como intención, sin marcar la retirada del rival en la sesión, de modo que respondemos con la decisión normal del motor; `parser-intent-verified` la trata como `rivalAction = walk` si su evidencia literal aparece en el texto; `ring-action` solo atiende a la acción del ring.

#### Scenario: Retirada aparente con trace-only
- **WHEN** con `trace-only` el rival escribe "we're done here unless you move" con intención `walk`
- **THEN** la sesión no marca la retirada del rival, el motor decide su contraoferta y la traza registra la intención `walk`

### Requirement: Confirmación de cifras sin oferta
Un turno sin oferta por cifras sin confirmar SHALL producir la decisión normal del motor sin oferta del rival nueva (sin aceptar), con `ask = confirm-figures` hacia el narrador y la plantilla, en el idioma de la sesión. La respuesta MUST NOT repetir cifras leídas del rival, porque el validador solo admite las cifras decididas.

#### Scenario: Confirmación en inglés
- **WHEN** el idioma de la sesión es `en` y la cifra del rival no se verifica
- **THEN** la respuesta es nuestra contraoferta con nuestras cifras y una petición en inglés de que el rival indique las suyas con dígitos

### Requirement: Nivel de confianza en la traza
La caja `reconcile` SHALL registrar por turno la política, la confianza de la oferta (`structured` | `dual-agreed` | `verified-digits` | `verified-words` | `llm-only` | `deterministic-only` | `unconfirmed`), el motivo cuando no hay oferta (`span-not-found` | `value-mismatch` | `ambiguous` | `disagreement` | `words-unverifiable` | `partial` | `llm-failed`), el idioma y, para la aceptación y la retirada, la señal usada y si se verificó. Los fragmentos de evidencia son texto del rival y SHALL quedar solo en la traza local, igual que la caja `rivalText`.

#### Scenario: Traza de un turno sin oferta
- **WHEN** el LLM devuelve una evidencia que no aparece en el texto
- **THEN** la traza local registra confianza `unconfirmed`, motivo `span-not-found` y el fragmento, y la exportación OTel no contiene el fragmento

## MODIFIED Requirements

### Requirement: Presupuesto de tiempo
El presupuesto total del turno SHALL ser, si el ring declara su tiempo máximo (por turno o en `ring.timeoutMs`), el menor entre ese tiempo multiplicado por `turn.budgetRatio` (por defecto 0.9) y ese tiempo menos el margen de seguridad (500 ms por defecto, configurable); si no lo declara, SHALL usarse `turnBudgetMs` de la configuración. Cada caja con LLM SHALL tener su tiempo máximo por llamada (`llm.parser.timeoutMs`, `llm.narrator.timeoutMs`), limitado por el tiempo restante. El narrador SHALL omitirse y usarse la plantilla si el tiempo restante antes de llamarlo es menor que `llm.narrator.minRemainingMs` (por defecto 900 ms), y un segundo intento solo SHALL hacerse si queda al menos ese tiempo. Al agotarse el presupuesto, SHALL emitirse la plantilla sin esperar a las llamadas pendientes.

#### Scenario: Presupuesto agotado
- **WHEN** el ring declara 5000 ms de tiempo máximo y las llamadas al LLM no terminan
- **THEN** se responde con la plantilla en 4500 ms o menos desde la llegada del turno

#### Scenario: Narrador omitido por falta de tiempo
- **WHEN** tras el parser y el motor quedan 600 ms y `minRemainingMs = 900`
- **THEN** no se llama al narrador, se envía la plantilla y la traza registra `narrator-skipped`

#### Scenario: Presupuesto relativo
- **WHEN** el ring declara 3000 ms, `budgetRatio = 0.9` y el margen es 500 ms
- **THEN** el presupuesto del turno es 2500 ms
