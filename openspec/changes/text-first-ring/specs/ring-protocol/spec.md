# Spec Delta: ring-protocol

## Purpose

Adapta el contrato con el ring al supuesto de que todo lo que llega y todo lo que sale es texto en lenguaje natural, manteniendo disponibles los modos estructurado e híbrido.

## MODIFIED Requirements

### Requirement: Modo solo texto
Cuando el ring no da la oferta del rival como campo estructurado, la oferta del rival SHALL extraerse del texto según `parser.policy`: con `llm-primary-verified`, solo si cada cifra del parser LLM pasa la verificación de evidencia literal y el parser determinista no extrae una oferta completa distinta; con `dual-strict`, solo si el parser determinista y el LLM coinciden en el valor de cada issue; con `deterministic-only` (o `LLM_PROVIDER=none`), solo si el parser determinista encuentra un único valor no ambiguo por issue. En cualquier otro caso el turno SHALL tratarse como sin oferta y la respuesta SHALL ser nuestra contraoferta pidiendo que el rival confirme sus cifras. Todo mensaje nuestro de aceptación SHALL repetir los valores exactos de cada issue aceptado.

#### Scenario: Cifra verificada sin coincidencia de la expresión regular
- **WHEN** con `llm-primary-verified` el rival escribe "podríamos cerrar en dos y medio, pagando el 15" en un turno en que el parser determinista no extrae oferta, y el LLM devuelve `pct` 2.5 con evidencia "dos y medio" y `day` 15 con evidencia "el 15"
- **THEN** ambas evidencias aparecen en el texto, se comprueban con el normalizador y el estado registra la oferta 2.5 % a día 15

#### Scenario: Parsers discrepan
- **WHEN** el parser determinista extrae una oferta completa 1.5 % y el parser LLM devuelve 15 % con evidencia verificada
- **THEN** el turno se trata como sin oferta, el motor no puede aceptar y el texto enviado pide confirmar las cifras

#### Scenario: Política estricta actual
- **WHEN** con `dual-strict` el parser determinista no extrae oferta y el LLM devuelve una oferta verificada
- **THEN** el turno se trata como sin oferta, como en el comportamiento anterior

#### Scenario: Aceptación explícita
- **WHEN** el motor acepta en modo solo texto la oferta 2 % a día 20
- **THEN** el texto enviado contiene "2" y "20" como cifras de los issues y el validador rechaza cualquier texto de aceptación que no los contenga

### Requirement: Aceptación del rival ligada a nuestra última oferta
Una aceptación del rival SHALL interpretarse solo como aceptación de nuestra última oferta enviada. En todos los modos, una acción del ring distinta de `message` prevalece sobre la intención leída en el texto. Con `acceptance.signal = ring-action`, solo la acción del ring (`rivalAction = accept`) SHALL cerrar un acuerdo y la intención leída en el texto solo informa al narrador. Con `acceptance.signal = parser-intent-verified`, una aceptación leída en el texto SHALL cerrar un acuerdo solo si cumple la regla de aceptación verificada de `turn-pipeline`. En ambos casos, una aceptación con cifras que no se pueden confirmar SHALL tratarse como turno sin oferta, nunca como acuerdo, y una aceptación con valores (estructurados o extraídos del texto) distintos de nuestra última oferta SHALL tratarse como una oferta nueva del rival y pasar por las condiciones de aceptación del motor. Sin una oferta nuestra previa no SHALL haber acuerdo.

#### Scenario: Aceptación con cifras distintas
- **WHEN** nuestra última oferta fue 2 % a día 20 y el rival acepta con 3 % a día 20
- **THEN** el estado registra una oferta nueva del rival de 3 % a día 20, no un acuerdo, y el motor decide sobre ella

#### Scenario: Aceptación sin cifras
- **WHEN** el rival acepta sin valores tras nuestra oferta de 2 % a día 20
- **THEN** el acuerdo registrado es exactamente 2 % a día 20

#### Scenario: Texto que dice aceptar con la señal del ring
- **WHEN** con `acceptance.signal = ring-action` el rival envía `rivalAction = message` con el texto "de acuerdo, acepto" tras nuestra oferta
- **THEN** no se registra ningún acuerdo y el motor decide sobre la oferta actual como en cualquier otro turno

#### Scenario: Aceptación en el texto antes de nuestra primera oferta
- **WHEN** con `parser-intent-verified` el primer mensaje del rival dice "accepted"
- **THEN** no se registra acuerdo y respondemos con nuestra oferta de apertura

## ADDED Requirements

### Requirement: Contrato canónico en solo texto
Con `ring.mode = text-only`, el adaptador de entrada SHALL aceptar mensajes que solo traen texto e identificadores de sesión y ronda, y SHALL traducirlos al contrato canónico con `rivalAction = message` y sin `rivalOffer`; cualquier campo estructurado de oferta o acción que el ring sí envíe SHALL descartarse salvo en `hybrid` o `structured`. El adaptador de salida SHALL enviar el texto validado como contenido del mensaje; la acción y la oferta canónicas SHALL seguir calculándose y registrándose en la traza, y SHALL enviarse al ring solo si `ring.mode` es `structured` o `hybrid`. Si falta el número de ronda, el adaptador SHALL derivarlo del contador de la sesión.

#### Scenario: Mensaje solo con texto
- **WHEN** en `text-only` llega `{ "sessionId": "s1", "text": "Offer 3% paying on day 10" }` sin ronda ni acción
- **THEN** el cerebro recibe `rivalAction = message`, ronda derivada de la sesión, sin `rivalOffer`, y la respuesta HTTP contiene solo el texto validado

#### Scenario: Híbrido con acción del ring
- **WHEN** en `hybrid` llega `rivalAction = accept` con texto
- **THEN** la acción del ring prevalece sobre la intención leída en el texto

### Requirement: Registro del acuerdo sin acción del ring
Cuando el ring no trae acción, el acuerdo SHALL registrarse en la sesión al aceptar nosotros (decisión `accept` del motor) o al verificar una aceptación del rival, con las cifras acordadas, la ronda, el origen (`engine-accept` | `rival-text-verified` | `ring-action`) y el fragmento de evidencia. Con un acuerdo registrado, toda respuesta posterior de esa sesión SHALL repetir el mismo texto de confirmación con las mismas cifras y MUST NOT proponer otra oferta. El acuerdo SHALL aparecer en la traza y en las métricas de la arena.

#### Scenario: Rival vuelve a escribir tras el acuerdo
- **WHEN** hay un acuerdo registrado en 2 % a día 20 y el rival envía otro mensaje
- **THEN** respondemos confirmando 2 % a día 20, sin oferta nueva

#### Scenario: Acuerdo por aceptación nuestra
- **WHEN** el motor acepta la oferta verificada 2.5 % a día 15
- **THEN** la sesión registra el acuerdo con origen `engine-accept` y el texto enviado repite 2.5 y 15
