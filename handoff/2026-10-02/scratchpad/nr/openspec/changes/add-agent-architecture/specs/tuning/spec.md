# Spec Delta: tuning

## Purpose

Ajusta fuera del torneo los parámetros del motor mediante barridos evaluados en la arena, versiona cada configuración y promueve una nueva campeona solo cuando la puerta de promoción lo permite.

## ADDED Requirements

### Requirement: Barrido de parámetros
El sistema SHALL generar configuraciones candidatas por rejilla o muestreo aleatorio sembrado sobre rangos declarados de los parámetros del motor, y SHALL evaluar cada candidata en la arena contra la campeona con la comparación pareada.

#### Scenario: Barrido aleatorio
- **WHEN** se lanza un barrido de 20 candidatas con una semilla
- **THEN** se obtiene una tabla ordenada de candidatas con su diferencia de excedente, intervalo de confianza, violaciones y fugas, reproducible con la misma semilla

### Requirement: Optimizador de caja negra opcional
El sistema SHALL permitir sustituir el generador de candidatas por un optimizador de caja negra con la misma interfaz de propuesta y evaluación, sin cambiar la arena ni la puerta de promoción.

#### Scenario: Cambio de generador
- **WHEN** se selecciona el optimizador en lugar del muestreo aleatorio
- **THEN** las candidatas se evalúan con la misma comparación pareada y se registran en la misma tabla

### Requirement: Versionado de configuraciones
Cada configuración candidata o campeona SHALL llevar un número de versión y su procedencia (versión de la que parte, barrido o autor, semillas y resumen de métricas), y SHALL validarse contra el esquema de configuración.

#### Scenario: Procedencia
- **WHEN** se abre una configuración candidata generada por un barrido
- **THEN** contiene la versión padre, el identificador del barrido y las métricas con las que se evaluó

### Requirement: Promoción controlada
La promoción a `config/champion.json` SHALL realizarse solo mediante la orden de promoción, solo si la puerta de promoción de la arena aprueba la candidata, asignando la versión siguiente y dejando la campeona anterior recuperable mediante el historial de git.

#### Scenario: Promoción aprobada
- **WHEN** una candidata pasa la puerta y se ejecuta la promoción
- **THEN** `config/champion.json` contiene la candidata con versión N+1 y se propone el mensaje de commit `champion vN+1`

#### Scenario: Congelación
- **WHEN** el flag de congelación está activo
- **THEN** la orden de promoción se niega a sobrescribir la campeona

### Requirement: Recarga de la campeona
El agente en ejecución SHALL cargar la configuración campeona vigente al empezar cada nueva sesión, sin reiniciar, y las sesiones en curso SHALL conservar la versión con la que empezaron.

#### Scenario: Nueva campeona con agente arrancado
- **WHEN** se promueve una nueva campeona mientras el agente juega una sesión
- **THEN** la sesión en curso termina con la versión anterior y la siguiente sesión usa la nueva

### Requirement: Crítico LLM opcional
El sistema SHALL poder ejecutar un crítico LLM sobre las partidas perdidas o de bajo excedente que produce sugerencias en texto y propuestas de rangos de parámetros; el crítico MUST NOT escribir configuraciones ni promover nada.

#### Scenario: Informe del crítico
- **WHEN** se ejecuta el crítico sobre una ejecución de la arena
- **THEN** se guarda en `results/` un informe con las partidas analizadas y sugerencias, y ninguna configuración cambia
