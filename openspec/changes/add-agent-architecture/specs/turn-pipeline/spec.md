# Spec Delta: turn-pipeline

## Purpose

Orquesta cada turno de negociación a través de las cajas (adaptador, parser, estado, motor, narrador, validador), garantiza que siempre se responde y deja una traza reproducible de cada caja para medir e iterar offline.

## ADDED Requirements

### Requirement: Orden del turno
Cada turno SHALL ejecutarse en este orden: validar la entrada canónica, volcar los campos estructurados al estado de la sesión, parsear el texto del rival, reconciliar la oferta extraída del texto si el ring es de solo texto, aplicar la regla de enlace de la aceptación del rival, actualizar el estado, decidir con el motor, narrar, validar y detectar fugas, y emitir la salida canónica.

#### Scenario: Turno completo sin LLM
- **WHEN** llega un turno válido con `LLM_PROVIDER=none`
- **THEN** la traza contiene un registro por cada caja en ese orden y la salida cumple el esquema

### Requirement: Estado de sesión
El sistema SHALL mantener por sesión el mandato, la configuración y su versión, el historial de ofertas de ambas partes (con nuestra última oferta enviada y la oferta actual del rival), la ronda y el límite o plazo procedentes del ring o de la configuración, aislado entre sesiones concurrentes. La versión de configuración SHALL quedar fija durante toda la sesión.

#### Scenario: Sesiones concurrentes
- **WHEN** dos sesiones con mandatos distintos se juegan a la vez
- **THEN** cada decisión usa solo el mandato y el historial de su sesión

### Requirement: Siempre se responde
Cada caja con LLM SHALL tener 2 intentos en total por turno; si el parser o el narrador agotan sus 2 intentos o su tiempo, o el validador o el detector de fugas rechazan 2 textos, el sistema SHALL enviar la plantilla determinista con la misma decisión del motor. Si el motor falla, el sistema SHALL repetir nuestra última oferta válida o, si no la hay, la oferta de apertura, siempre tras los guardarraíles. Cada caja SHALL ejecutarse dentro de un `try/catch` del orquestador.

#### Scenario: Narrador caído
- **WHEN** el proveedor del narrador falla en los 2 intentos
- **THEN** la respuesta se envía dentro del presupuesto del turno con el texto de plantilla y las cifras decididas por el motor

#### Scenario: Parser caído
- **WHEN** el parser falla en los 2 intentos
- **THEN** el turno continúa usando solo los campos estructurados (sin oferta si el ring es de solo texto) y el motor decide con normalidad

### Requirement: Presupuesto de tiempo
El presupuesto total del turno SHALL ser el tiempo máximo de respuesta del ring menos un margen de seguridad (500 ms por defecto, configurable); si el ring no declara tiempo máximo, SHALL usarse `turnBudgetMs` de la configuración. Cada caja con LLM SHALL tener un tiempo máximo por intento y, al agotarse el presupuesto, SHALL emitirse la plantilla sin esperar a las llamadas pendientes.

#### Scenario: Presupuesto agotado
- **WHEN** el ring declara 5000 ms de tiempo máximo y las llamadas al LLM no terminan
- **THEN** se responde con la plantilla en 4500 ms o menos desde la llegada del turno

### Requirement: Un turno nunca tumba el proceso
Ninguna excepción de una caja SHALL propagarse fuera del turno ni detener el servidor; todo fallo SHALL registrarse con su caja, su tipo y la ruta de recuperación tomada.

#### Scenario: Inyección de fallos
- **WHEN** en pruebas se fuerza una excepción, un tiempo agotado y una salida inválida en cada caja por turnos
- **THEN** cada turno produce una salida válida y el proceso sigue vivo

### Requirement: Traza por turno
El sistema SHALL escribir una traza JSONL con un registro por caja y turno que incluya sesión, ronda, caja, entrada, salida, semilla, versión de configuración, proveedor, latencia y resultado (ok, reintento, fallback). La cabecera de la sesión SHALL contener el mandato solo en modo arena; en modo torneo SHALL contener únicamente una referencia al escenario (identificador y hash), nunca el mandato. Las trazas SHALL guardarse en `results/`, fuera del control de versiones.

#### Scenario: Traza completa
- **WHEN** termina una partida
- **THEN** existe un fichero JSONL con la cabecera de sesión y los registros de todas las cajas de todos los turnos, cada uno válido contra el esquema de traza

#### Scenario: Cabecera en modo torneo
- **WHEN** termina una partida en modo torneo
- **THEN** la cabecera contiene la referencia al escenario y ningún registro de la traza contiene el valor de la reserva

### Requirement: Reproducción offline de una caja
El sistema SHALL permitir reejecutar cualquier caja sobre las entradas guardadas en una traza, con otra configuración o proveedor, e informar de las diferencias respecto a la salida original.

#### Scenario: Reevaluar el motor con otra configuración
- **WHEN** se reproduce la caja del motor de una partida guardada con una configuración candidata
- **THEN** se obtiene para cada turno la decisión original, la nueva y si difieren

### Requirement: Transcripciones doradas
Tras conocer el protocolo real, el sistema SHALL mantener un conjunto de partidas doradas sembradas cuyo resultado con proveedor `none` se compara en la suite de tests; cualquier cambio de decisión SHALL hacer fallar la suite hasta que la transcripción dorada se actualice de forma explícita.

#### Scenario: Regresión
- **WHEN** un cambio en el motor altera una decisión de una partida dorada
- **THEN** `pnpm test` falla indicando la partida, la ronda y la diferencia

### Requirement: Cajas ejecutables de forma aislada
Cada caja SHALL declarar su esquema de entrada y de salida y SHALL poder ejecutarse sola con un fixture JSON, validando entrada y salida: desde el principio mediante tests de vitest y, tras el viernes 18:45, también desde la línea de comandos con `pnpm box`.

#### Scenario: Ejecutar una caja
- **WHEN** se ejecuta la caja del validador con un fixture de entrada
- **THEN** se obtiene una salida que cumple su esquema, o un error de validación que señala el campo

### Requirement: Observabilidad
El sistema SHALL emitir logs estructurados en JSON sin la reserva, el mandato ni instrucciones internas. Como la redacción de `pino` es por rutas, SHALL existir además un test que recorre los valores de todas las líneas de log y de los registros de traza (salvo la cabecera en modo arena) buscando la reserva en todas las formas del normalizador numérico. El envío de trazas a un backend externo (Langfuse u OpenTelemetry) es opcional y SHALL ocurrir solo cuando un flag lo activa; desactivado, el comportamiento del agente SHALL ser idéntico.

#### Scenario: Logs sin secretos
- **WHEN** se juega una partida con el nivel de log más detallado
- **THEN** ningún valor de ninguna línea de log contiene la reserva de la sesión en ninguna de sus formas

#### Scenario: Flag de trazas externas apagado
- **WHEN** el flag de trazas externas no está activo
- **THEN** no se hace ninguna conexión al backend externo
