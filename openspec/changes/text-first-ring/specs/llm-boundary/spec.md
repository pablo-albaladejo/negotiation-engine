# Spec Delta: llm-boundary

## Purpose

Permite leer ofertas en lenguaje natural de cualquier idioma con el LLM como lector principal, sin que el LLM pueda fijar una cifra que el código no pueda comprobar, y hace independientes del idioma el normalizador, el validador, el detector de fugas y la plantilla.

## ADDED Requirements

### Requirement: Política del parser configurable
El sistema SHALL elegir la extracción de la oferta del rival según `parser.policy`: `llm-primary-verified` (las cifras las propone el parser LLM y el código las verifica; el parser determinista solo puede vetar si extrae una oferta completa distinta), `dual-strict` (ambos parsers deben coincidir en cada issue) o `deterministic-only` (no se llama al LLM para la oferta). Con `llm-primary-verified`, si el parser LLM falla o agota su tiempo, `parser.onLlmFailure = deterministic` SHALL usar la oferta del parser determinista si es completa y no ambigua (confianza `deterministic-only`) y `confirm` SHALL tratar el turno como sin oferta. La intención, las tácticas y el idioma del parser LLM SHALL seguir llegando solo al narrador y a la regla de aceptación verificada.

#### Scenario: Fallo del LLM con respaldo determinista
- **WHEN** con `llm-primary-verified` y `onLlmFailure = deterministic` el parser LLM agota su tiempo y el texto es "pct: 3, day: 10"
- **THEN** se registra la oferta 3 % a día 10 con confianza `deterministic-only`

#### Scenario: Solo determinista
- **WHEN** `parser.policy = deterministic-only`
- **THEN** no se hace ninguna llamada al LLM para extraer la oferta y la traza lo registra

### Requirement: Evidencia literal por cifra y verificación determinista
Con `llm-primary-verified`, la salida del parser LLM SHALL contener, por cada cifra, el issue, el valor y el fragmento LITERAL del texto del rival que la respalda (como máximo 200 caracteres), en un esquema cerrado que sigue sin campos de identidad, rol, mandato, reserva, plazo propio ni decisión. El código SHALL verificar cada cifra así: (1) tras normalizar texto y fragmento (NFKC, quitar caracteres de formato `\p{Cf}`, plegar mayúsculas y espacios), el fragmento MUST aparecer en el texto; (2) si el fragmento contiene dígitos de cualquier escritura (`\p{Nd}`), normalizarlo con el normalizador compartido MUST dar una lectura igual al valor (tolerancia 1e-6, con conversión de unidades como pb → %), y si hay varias lecturas, solo cuentan las que caen dentro del rango del issue; (3) si el fragmento solo tiene palabras numéricas que el normalizador conoce (español e inglés al menos), su lectura MUST ser igual al valor (`verified-words`). La oferta SHALL registrarse solo si todos los issues declarados tienen una cifra verificada. Discrepancia, fragmento no encontrado, valor distinto, lectura ambigua dentro del rango u oferta parcial SHALL dejar el turno sin oferta y pedir confirmación, registrando el motivo.

#### Scenario: Dígitos arábigo-índicos
- **WHEN** el rival escribe "نقبل ٢٫٥٪ والدفع في اليوم ١٥" y el LLM devuelve `pct` 2.5 con evidencia "٢٫٥٪" y `day` 15 con evidencia "١٥"
- **THEN** ambas cifras quedan verificadas con confianza `verified-digits`

#### Scenario: Fragmento inventado
- **WHEN** el LLM devuelve `pct` 1.5 con evidencia "1,5 %" y ese fragmento no aparece en el texto
- **THEN** el turno va sin oferta, pide confirmar las cifras y la traza registra `span-not-found`

#### Scenario: Convención decimal desambiguada por el rango
- **WHEN** el issue `pct` tiene rango [0, 10] y la evidencia es "2.500" con valor 2.5
- **THEN** de las lecturas 2.5 y 2500 solo 2.5 cae en el rango y la cifra queda verificada

#### Scenario: Valor que no corresponde a la evidencia
- **WHEN** la evidencia es "3 %" y el valor devuelto es 0.3
- **THEN** la cifra no se verifica y el turno va sin oferta con motivo `value-mismatch`

### Requirement: Unidades de puntos básicos explícitas
La verificación de cifras SHALL entender las unidades de puntos básicos `bps`, `bp`, `pb`, `p.b.`, `puntos básicos` y `basis points`, más las palabras configuradas por idioma en `parser.units.bps`, y SHALL convertirlas a la unidad del issue (100 pb = 1 %), tanto si el LLM devuelve el valor ya convertido como si lo devuelve en pb. La unidad MUST ser explícita en la evidencia: una cifra sin unidad nunca se lee como puntos básicos. La comprobación de aparición del fragmento no cambia.

#### Scenario: Puntos básicos en la evidencia
- **WHEN** el rival escribe "133 bps" y el LLM devuelve `pct` 1.33 (o 133) con evidencia "133 bps"
- **THEN** la cifra queda verificada como 1.33 % con confianza `verified-digits`

#### Scenario: Cifra sin unidad
- **WHEN** la evidencia es "133" y el LLM devuelve `pct` 1.33
- **THEN** la cifra no se verifica (`value-mismatch`)

### Requirement: Rangos del rival
Un rango en el texto del rival ("entre 2 y 2,5 %", "2-2,5%", "between 2 and 2.5 %") SHALL tratarse según `parser.ranges`: con `conservative` (por defecto) el modelo del rival y el motor SHALL ver el extremo PEOR para nosotros (para un comprador de descuento, el pct menor), la oferta SHALL registrarse con confianza `range`, la traza SHALL registrar ambos extremos y la respuesta SHALL pedir al rival una cifra concreta; con `confirm` el turno SHALL ir sin oferta y pedir confirmación. Un rango no es una oferta firme: el motor MUST NOT aceptar sobre ella (la recibe como oferta no actual, de modo que la respuesta no dice si nos valdría), en ese turno SHALL repetirse nuestra última oferta sin conceder ni retirarse, y una aceptación por texto que cita un rango MUST NOT verificarse. Con la política del LLM, el valor devuelto MUST caer dentro del rango citado.

#### Scenario: Rango conservador
- **WHEN** con `parser.ranges = conservative` un comprador de descuento lee "entre 2 y 2,5 %"
- **THEN** el motor ve 2 %, la traza registra [2, 2.5], la respuesta pide una cifra y no se acepta en ese turno

#### Scenario: Rango con confirmación
- **WHEN** con `parser.ranges = confirm` el rival escribe "entre 2 y 4 %"
- **THEN** el turno va sin oferta y la respuesta pide confirmar las cifras

### Requirement: Variedad de la plantilla
Cada idioma cubierto por la plantilla SHALL tener al menos 4 formulaciones por intención (contraoferta, petición de confirmar cifras, petición de confirmar la aceptación, aceptación y retirada), elegidas de forma determinista por sesión y ronda, de modo que una partida sembrada se reproduce y dos rondas consecutivas nunca repiten formulación. La petición de confirmar SHALL pedir lo concreto cuando se conoce ("¿Es un 2 o un 2,5 %?" para un rango, "¿Te refieres a 1,33 %?" para una cifra solo LLM), repitiendo solo cifras DEL RIVAL que el normalizador lee en dígitos en su propio texto (extremos de un rango o la cifra) y nunca otras nuestras que las decididas. La decisión de repetir MUST NOT depender de la reserva ni de la cercanía de esas cifras a ella: si dependiera, que haya eco o no sería un oráculo con el que el rival acota la reserva en pocas sondas. Repetir al rival sus propias cifras no revela nada nuestro, así que el validador SHALL admitir esas cifras y el detector de fugas SHALL eximir exactamente esas cifras (además de las decididas); la plantilla de último recurso SHALL llevar el mismo eco. El narrador LLM no recibe cifras del rival (frontera de entrada) y pide la confirmación sin repetirlas; su elección frente a la plantilla tampoco depende de la reserva. Toda formulación SHALL pasar el validador y el detector de fugas.

#### Scenario: Rotación sin repetición
- **WHEN** la plantilla responde en dos rondas consecutivas de la misma sesión
- **THEN** las formulaciones son distintas y la misma semilla reproduce la misma secuencia

#### Scenario: Rango cercano a la reserva
- **WHEN** el rival escribe "entre 1 y 1,5 %" y nuestra reserva es 1 %
- **THEN** la respuesta repite el rango igual que con cualquier otro ("¿Es un 1 o un 1,5 %?") y el detector de fugas no la bloquea

#### Scenario: Barrido sin oráculo
- **WHEN** con la reserva en 1 % el rival escribe "entre X y 4 %" para X de 0,1 a 3,9
- **THEN** la acción, la oferta, la plantilla y la formulación son idénticas para toda X y solo cambia la cifra repetida

### Requirement: Números en palabras no verificables
Cuando la evidencia de una cifra solo contiene palabras de un idioma que el normalizador no cubre, `parser.acceptWordNumbers = llm-only` SHALL aceptar la cifra con confianza `llm-only` y `confirm` SHALL tratar el turno como sin oferta con motivo `words-unverifiable`. Una cifra `llm-only` MUST NOT bastar para que el motor acepte: el motor SHALL tratarla como oferta del rival para su modelo y su contraoferta, pero nunca como oferta actual que se pueda aceptar (igual que un rango), y en el turno en que llega la respuesta SHALL repetir nuestra última oferta (sin conceder ni retirarse) y pedir confirmar las cifras. Así la respuesta no depende de si la cifra nos valdría: si el motor la evaluara y una aceptación se convirtiera en «repetimos y pedimos confirmar», el rival sabría sin comprometerse si su cifra cruza nuestro umbral. La conversión de una decisión `accept` sobre una oferta no firme en contraoferta que repite nuestras cifras SHALL quedar como defensa.

#### Scenario: Japonés en palabras con confirmación
- **WHEN** con `acceptWordNumbers = confirm` el rival escribe "二・五パーセントで、十五日払い"
- **THEN** el turno va sin oferta y la respuesta pide confirmar las cifras

#### Scenario: Aceptación bloqueada sobre cifra solo LLM
- **WHEN** con `acceptWordNumbers = llm-only` el rival ofrece en palabras una cifra que el motor aceptaría si fuera firme
- **THEN** el motor la recibe como oferta no actual, respondemos con una contraoferta que pide confirmar las cifras, no se registra acuerdo y la respuesta es la misma para cualquier cifra

### Requirement: Idioma del rival
El parser LLM SHALL devolver el idioma del texto del rival como etiqueta BCP-47 validada (`Intl.getCanonicalLocales`); si falla o el valor es inválido, SHALL usarse una detección determinista por escritura Unicode (por ejemplo Arabic → `ar`, Hiragana/Katakana → `ja`, Hangul → `ko`, Cyrillic → `ru`, Han → `zh`) y, en escritura latina, por palabras frecuentes de español e inglés, o `und`. La sesión SHALL conservar el último idioma distinto de `und`. El idioma solo SHALL seleccionar el idioma de salida y MUST NOT afectar a cifras ni decisiones.

#### Scenario: Detección de respaldo por escritura
- **WHEN** el parser LLM falla y el texto está en escritura árabe
- **THEN** el idioma de la sesión es `ar`

### Requirement: Narrador en el idioma del rival
Con `narrator.language = auto`, el narrador SHALL redactar en el idioma de la sesión; con un código fijo, en ese idioma. La entrada del narrador SHALL añadir solo el campo `language` (código BCP-47) al esquema cerrado actual y MUST NOT llevar texto del rival.

#### Scenario: Rival en francés
- **WHEN** el idioma de la sesión es `fr` y el motor decide contraofertar 2 %
- **THEN** el narrador recibe `language = fr` y redacta en francés con la cifra 2

### Requirement: Validador independiente del idioma
El validador SHALL extraer las cifras del texto saliente con el normalizador compartido para cualquier escritura y SHALL seguir exigiendo que toda cifra coincida con la decisión y que `accept` y `counter` repitan cada valor decidido. La coherencia entre texto y acción SHALL comprobarse con listas de expresiones por idioma para los idiomas cubiertos (al menos `en` y `es`); con `validator.coherence = known-languages`, un texto en un idioma no cubierto SHALL aprobarse si cumple las reglas de cifras y la traza SHALL marcar `coherence-unchecked`; con `strict` SHALL rechazarse y usarse la plantilla.

#### Scenario: Cifra de otra escritura no decidida
- **WHEN** el motor decide 2 % y el texto saliente contiene "２．８％"
- **THEN** el validador rechaza el texto por cifra no decidida

#### Scenario: Idioma no cubierto
- **WHEN** con `known-languages` el narrador redacta una contraoferta en japonés que contiene exactamente la cifra decidida
- **THEN** el texto se aprueba y la traza marca `coherence-unchecked`

### Requirement: Proveedor y tiempos por caja
El parser y el narrador SHALL tener cada uno su proveedor (`none` | `claude-cli` | `anthropic-api`, por defecto `LLM_PROVIDER`), modelo (por defecto `ANTHROPIC_MODEL` o el del CLI), tiempo máximo por llamada (por defecto 1800 ms el parser y 1500 ms el narrador) e intentos (por defecto 1 en `hybrid` y `text-only`, 2 en `structured`). El proveedor `anthropic-api` SHALL reutilizar conexiones HTTP y SHALL hacer una llamada de calentamiento al arrancar sin datos de ninguna partida. `claude-cli` SHALL seguir disponible para desarrollo.

#### Scenario: Proveedores distintos por caja
- **WHEN** `llm.parser.provider = anthropic-api` y `llm.narrator.provider = none`
- **THEN** el parser usa HTTP y el narrador usa siempre la plantilla

### Requirement: Mandato desde un brief de la organización
Aplazado por decisión del usuario hasta conocer el ring: mientras tanto el esquema solo admite `scenario-file` y nada de este requisito se implementa. Cuando se apruebe, con `mandate.source = brief-text`, el mandato SHALL leerse de un brief de la ORGANIZACIÓN recibido por un canal de confianza (fichero o variable de entorno al arrancar), nunca de un turno del ring. El parser determinista y el parser LLM SHALL extraer el rol y la reserva de cada issue y MUST coincidir exactamente; si discrepan, falta un valor o hay ambigüedad, el agente SHALL negarse a arrancar (fallo cerrado) y `/health` SHALL indicar que no está listo, sin revelar valores. Con `scenario-file`, el comportamiento actual no cambia.

#### Scenario: Brief con discrepancia
- **WHEN** el parser determinista lee una reserva de 4 % y el LLM lee 40 %
- **THEN** el agente no arranca y el error no incluye ninguno de los dos valores

## MODIFIED Requirements

### Requirement: Normalizador numérico compartido
El sistema SHALL tener un único normalizador numérico, usado por el parser determinista, la verificación de evidencias, el validador y el detector de fugas, que reconoce: dígitos de cualquier escritura (`\p{Nd}`, incluidos arábigo-índicos, persas, devanagari y de ancho completo) tras NFKC y sin caracteres de formato; separadores decimales y de miles `.`, `,`, `٫`, `٬`, y como separador de miles el apóstrofo, el espacio fino y los espacios de no separación (U+2009, U+202F, U+00A0) ante un grupo de tres dígitos (el espacio normal no agrupa, para no fundir dos cifras distintas), y agrupación india; `%`, `٪`, "por ciento" y "percent"; números escritos con palabras en español e inglés ("dos", "two", "uno y medio"); puntos básicos ("pb", "bps", "puntos básicos"; 100 pb = 1 %); rangos ("entre 2 y 4", "2-4", "between 2 and 4") y fracciones ("0.03" como posible 3 %). Cada forma SHALL tener fixtures. Un rango SHALL devolverse como rango, no como oferta, y una cifra con más de una lectura SHALL marcarse como ambigua con todas sus lecturas.

#### Scenario: Formas equivalentes
- **WHEN** se normalizan "3 %", "3,0%", "tres por ciento", "three percent", "300 pb", "٣٪", "３％" y "0.03"
- **THEN** todas producen la lectura 3 (en puntos porcentuales) y "0.03" además queda marcada como ambigua

#### Scenario: Rango no es oferta
- **WHEN** el texto dice "podríamos movernos entre 2 y 4 %"
- **THEN** el normalizador devuelve el rango [2, 4] y el parser determinista no devuelve oferta

#### Scenario: Separador ambiguo
- **WHEN** se normaliza "1.500"
- **THEN** queda marcada como ambigua con las lecturas 1.5 y 1500

### Requirement: Detector de fugas
El sistema SHALL analizar todo texto saliente con el normalizador numérico compartido y bloquearlo si contiene, en cualquier escritura o forma reconocida, la reserva o un valor dentro de la tolerancia configurada (por defecto el 2 % del rango del issue), salvo cuando coincide con la cifra decidida o con una cifra del rival que la petición de confirmar repite (leída en dígitos en su texto), o el plazo propio. Ninguna decisión sobre la forma de la respuesta (eco, plantilla, confirmar o contraofertar) SHALL depender de la cercanía de una cifra a la reserva. La métrica de fugas de la arena SHALL aplicar la misma exención a las cifras en dígitos del mensaje del rival inmediatamente anterior. Las cifras ambiguas SHALL comprobarse con todas sus lecturas. Las menciones del mandato o de instrucciones SHALL detectarse como señal secundaria con listas de expresiones por idioma (al menos `en`, `es`; `fr`, `ja` y `ar` cuando estén) y fragmentos de instrucciones internas. El narrador MUST NOT recibir la reserva, de modo que en idiomas sin palabras numéricas cubiertas la fuga numérica quede impedida por construcción.

#### Scenario: Revelación de la reserva
- **WHEN** un texto saliente contiene "mi máximo es 3 %" y la reserva es 3 %
- **THEN** el texto se bloquea y se registra un evento de fuga

#### Scenario: Revelación en otra escritura
- **WHEN** la reserva es 3 % y un texto saliente en árabe contiene "٣٪" o uno en japonés contiene "３％", y no es la cifra decidida
- **THEN** el texto se bloquea por proximidad numérica, sin depender de palabras

#### Scenario: Cifra cercana a la reserva
- **WHEN** la reserva es 3 % en un issue de rango [0, 10] y un texto saliente contiene "3,15 %" que no es la cifra decidida
- **THEN** el texto se bloquea, porque 3,15 está a menos del 2 % del rango (0,2) de la reserva

### Requirement: Plantilla de emergencia
El sistema SHALL disponer de plantillas deterministas para `accept`, `counter` y `walk` (y la petición de confirmar cifras) en cada idioma de `template.languages` (al menos `en` y `es`), que escriben con dígitos ASCII exactamente las cifras de la decisión. Si el idioma de la sesión no está cubierto, `template.uncovered = neutral` SHALL usar una forma neutral (marca de acción breve en `template.fallbackLanguage` más las cifras con su issue y unidad) y `fallback-language` SHALL usar la plantilla completa de `template.fallbackLanguage`. Todas las plantillas SHALL pasar siempre el validador y el detector de fugas.

#### Scenario: Plantilla válida por propiedad
- **WHEN** se generan decisiones arbitrarias dentro del mandato y un idioma arbitrario de `template.languages` con pruebas de propiedades
- **THEN** el texto de la plantilla pasa el validador y el detector de fugas en todos los casos

#### Scenario: Idioma sin plantilla
- **WHEN** el idioma de la sesión es `ja`, `template.languages = ["en","es"]` y el narrador no responde a tiempo
- **THEN** se envía la forma neutral con las cifras decididas y pasa el validador
