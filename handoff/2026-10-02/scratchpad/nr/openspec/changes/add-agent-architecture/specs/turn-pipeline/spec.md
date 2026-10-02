# Spec Delta: turn-pipeline

## Purpose

Orquesta cada turno de negociación a través de las cajas (adaptador, parser, estado, motor, narrador, validador), garantiza que siempre se responde y deja una traza reproducible de cada caja para medir e iterar offline.

## ADDED Requirements

### Requirement: Orden del turno
Cada turno SHALL ejecutarse en este orden: validar la entrada canónica, volcar los campos estructurados al estado de la sesión, parsear el texto del rival, actualizar el estado, decidir con el motor, narrar, validar y detectar fugas, y emitir la salida canónica.

#### Scenario: Turno completo sin LLM
- **WHEN** llega un turno válido con `LLM_PROVIDER=none`
- **THEN** la traza contiene un registro por cada caja en ese orden y la salida cumple el esquema

### Requirement: Estado de sesión
El sistema SHALL mantener por sesión el mandato, la configuración y su versión, el historial de ofertas de ambas partes, la ronda y el plazo, aislado entre sesiones concurrentes. La versión de configuración SHALL quedar fija durante toda la sesión.

#### Scenario: Sesiones concurrentes
- **WHEN** dos sesiones con mandatos distintos se juegan a la vez
- **THEN** cada decisión usa solo el mandato y el historial de su sesión

### Requirement: Siempre se responde
Si el parser o el narrador fallan dos veces o exceden su tiempo, o el validador o el detector de fugas rechazan dos textos, el sistema SHALL enviar la plantilla determinista con la misma decisión del motor. Si el motor falla, el sistema SHALL repetir nuestra última oferta válida o, si no la hay, la oferta de apertura, siempre tras los guardarraíles.

#### Scenario: Narrador caído
- **WHEN** el proveedor del narrador falla en los dos intentos
- **THEN** la respuesta se envía dentro del presupuesto del turno con el texto de plantilla y las cifras decididas por el motor

#### Scenario: Parser caído
- **WHEN** el parser falla en los dos intentos
- **THEN** el turno continúa usando solo los campos estructurados y el motor decide con normalidad

### Requirement: Presupuesto de tiempo
Cada caja con LLM SHALL tener un tiempo máximo por intento y el turno SHALL tener un presupuesto total configurable; al agotarse el presupuesto SHALL emitirse la plantilla sin esperar a las llamadas pendientes.

#### Scenario: Presupuesto agotado
- **WHEN** las llamadas al LLM superan el presupuesto total del turno
- **THEN** se responde con la plantilla antes de que venza el presupuesto más un margen fijo

### Requirement: Un turno nunca tumba el proceso
Ninguna excepción de una caja SHALL propagarse fuera del turno ni detener el servidor; todo fallo SHALL registrarse con su caja, su tipo y la ruta de recuperación tomada.

#### Scenario: Inyección de fallos
- **WHEN** en pruebas se fuerza una excepción en cada caja por turnos
- **THEN** cada turno produce una salida válida y el proceso sigue vivo

### Requirement: Traza por turno
El sistema SHALL escribir una traza JSONL con un registro por caja y turno que incluya sesión, ronda, caja, entrada, salida, semilla, versión de configuración, proveedor, latencia y resultado (ok, reintento, fallback). El mandato SHALL aparecer solo en el registro de cabecera de la sesión y las trazas SHALL guardarse en `results/`, fuera del control de versiones.

#### Scenario: Traza completa
- **WHEN** termina una partida
- **THEN** existe un fichero JSONL con la cabecera de sesión y los registros de todas las cajas de todos los turnos, cada uno válido contra el esquema de traza

### Requirement: Reproducción offline de una caja
El sistema SHALL permitir reejecutar cualquier caja sobre las entradas guardadas en una traza, con otra configuración o proveedor, e informar de las diferencias respecto a la salida original.

#### Scenario: Reevaluar el motor con otra configuración
- **WHEN** se reproduce la caja del motor de una partida guardada con una configuración candidata
- **THEN** se obtiene para cada turno la decisión original, la nueva y si difieren

### Requirement: Transcripciones doradas
El sistema SHALL mantener un conjunto de partidas doradas sembradas cuyo resultado con proveedor `none` se compara en la suite de tests; cualquier cambio de decisión SHALL hacer fallar la suite hasta que la transcripción dorada se actualice de forma explícita.

#### Scenario: Regresión
- **WHEN** un cambio en el motor altera una decisión de una partida dorada
- **THEN** `pnpm test` falla indicando la partida, la ronda y la diferencia

### Requirement: Cajas ejecutables de forma aislada
Cada caja SHALL declarar su esquema de entrada y de salida y SHALL poder ejecutarse sola desde la línea de comandos con un fixture JSON, validando entrada y salida.

#### Scenario: Ejecutar una caja
- **WHEN** se ejecuta la caja del validador con un fixture de entrada
- **THEN** se imprime una salida que cumple su esquema, o un error de validación que señala el campo

### Requirement: Observabilidad
El sistema SHALL emitir logs estructurados en JSON sin la reserva, el mandato ni instrucciones internas, y SHALL poder enviar trazas a un backend externo (Langfuse u OpenTelemetry) solo cuando un flag lo activa; desactivado, el comportamiento del agente SHALL ser idéntico.

#### Scenario: Logs sin secretos
- **WHEN** se juega una partida con el nivel de log más detallado
- **THEN** ninguna línea de log contiene el valor de la reserva de la sesión

#### Scenario: Flag de trazas externas apagado
- **WHEN** el flag de trazas externas no está activo
- **THEN** no se hace ninguna conexión al backend externo
