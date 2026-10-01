# Spec Delta: turn-pipeline

## Purpose

Versiona la traza JSONL por partida y añade los registros que el visor necesita sin relajar la sanitización existente.

## ADDED Requirements

### Requirement: Traza v2
La cabecera de la traza SHALL aceptar `traceVersion: 2`; las cabeceras sin ese campo SHALL seguir siendo válidas (v1). La cabecera de torneo v2 SHALL incluir `role` (`buyer` | `seller`) y MUST NOT incluir mandato ni reserva. La sanitización de las cajas `parser`, `narrator`, `validator` y `leak` (solo longitudes y banderas) SHALL mantenerse.

#### Scenario: Cabecera de torneo v2
- **WHEN** `pnpm agent` abre una sesión nueva
- **THEN** la primera línea de su traza tiene `traceVersion: 2`, `role` y `scenario {id, hash}`, y el esquema estricto rechaza una cabecera de torneo con `mandate`

#### Scenario: Traza v1
- **WHEN** se valida una traza escrita antes de este cambio
- **THEN** pasa `TraceLineSchema`

### Requirement: Explicación del motor fuera de la exportación
El campo `explain` del registro `engine` SHALL quedar en la traza JSONL local y SHALL redactarse en la exportación OpenTelemetry/Langfuse y en los logs de pino (`REDACT_PATHS`), igual que el mandato: es equivalente a la reserva (ver negotiation-engine). Los registros `rivalText` MUST NOT llegar al logger; los registros `protocol` (solo rutas y códigos) sí se loguean, por el mismo punto de log.

#### Scenario: Exportación OTel
- **WHEN** se exporta un turno con `TRACE_EXPORT=otel`
- **THEN** el atributo de salida del span `engine` no contiene `explain`

#### Scenario: Logs de pino en nivel trace
- **WHEN** se juega un turno con `LOG_LEVEL=trace` y el rival manda texto
- **THEN** los logs no contienen el texto crudo del rival ni ninguna clave o valor de `explain` (el registro `engine` lleva `explain: "[redactado]"`)

### Requirement: Texto crudo del rival, solo local
El pipeline SHALL escribir un registro dedicado `box: "rivalText"` con el texto crudo del rival de cada turno (cuando lo haya) en la traza JSONL local (`results/`). Este registro MUST NOT salir en la exportación OpenTelemetry/Langfuse. La sanitización existente de `parser`, `narrator`, `validator` y `leak` SHALL mantenerse sin cambios: solo `rivalText` guarda el texto completo. El visor SHALL mostrar este texto únicamente a través de `ChatMessage`, como texto de React, nunca como HTML.

#### Scenario: Texto del rival en el JSONL local
- **WHEN** el rival manda texto en un turno
- **THEN** la traza local tiene un registro `box: "rivalText"` con ese texto completo

#### Scenario: Exclusión de la exportación
- **WHEN** se exporta la traza con `TRACE_EXPORT=otel`
- **THEN** no existe ningún span `box.rivalText` ni rastro del texto del rival en los atributos exportados

### Requirement: Registro de violación de protocolo
Cuando la entrada de un turno no cumple el esquema canónico, el pipeline SHALL escribir en la traza de la sesión, si el `sessionId` es legible, un registro `box: "protocol"` con `result: "error"` y en `error` solo las rutas de los campos inválidos y el código de Zod, nunca valores ni texto del rival.

#### Scenario: Turno sin oferta en `counter`
- **WHEN** el rival envía `counter` sin oferta
- **THEN** la traza tiene un registro `protocol` con `error` que nombra el campo `offer` y no contiene el texto del rival
