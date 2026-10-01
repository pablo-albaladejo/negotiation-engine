# Spec Delta: tuning

## Purpose

Ajusta fuera del torneo los parámetros del motor mediante barridos evaluados en la arena, versiona cada configuración y promueve una nueva campeona solo cuando la puerta de promoción lo permite.

## ADDED Requirements

### Requirement: Interfaz de generador y evaluador
El generador de candidatas SHALL exponer una interfaz `propose(history?) → Config[]` que devuelve una lista de configuraciones a evaluar, y el evaluador SHALL implementar `evaluate(configs) → PairedReport[]` que evalúa cada candidata contra la campeona vigente usando comparación pareada en la arena. El sistema SHALL guardar cada candidata con procedencia (`sweepId`, semilla, métricas).

#### Scenario: Generador aleatorio
- **WHEN** se crea un generador con muestreo aleatorio y se piden 20 candidatas
- **THEN** se obtiene una lista de 20 configuraciones con versión incremental

#### Scenario: Evaluador pareado
- **WHEN** se evalúa una lista de candidatas
- **THEN** se obtiene un informe pareado de la candidata vs la campeona vigente

### Requirement: Barrido de parámetros
El sistema SHALL generar configuraciones candidatas por rejilla o muestreo aleatorio sembrado sobre rangos declarados de los parámetros del motor, y SHALL evaluar cada candidata en la arena contra la campeona vigente con comparación pareada, usando solo rivales `tuning` y semillas del rango de ajuste.

#### Scenario: Barrido aleatorio
- **WHEN** se lanza un barrido de 20 candidatas con una semilla
- **THEN** se obtiene una tabla ordenada de candidatas con su diferencia de excedente, significación, violaciones, fugas y procedencia (`sweepId`, semillas), reproducible con la misma semilla

#### Scenario: Sin rivales reservados
- **WHEN** termina un barrido
- **THEN** su resumen no contiene ninguna partida contra un rival `heldOut` ni con una semilla del rango de revalidación

### Requirement: Optimizador de caja negra opcional
El generador de candidatas SHALL estar detrás de una interfaz de propuesta y evaluación, de modo que un optimizador de caja negra MAY sustituirlo sin cambiar la arena ni la puerta de promoción.

#### Scenario: Cambio de generador
- **WHEN** se selecciona el optimizador en lugar del muestreo aleatorio
- **THEN** las candidatas se evalúan con la misma comparación pareada y se registran en la misma tabla

### Requirement: Versionado de configuraciones
Cada configuración candidata o campeona SHALL llevar un número de versión y su procedencia (versión de la que parte, barrido o autor, semillas y resumen de métricas), y SHALL validarse contra el esquema de configuración.

#### Scenario: Procedencia
- **WHEN** se abre una configuración candidata generada por un barrido
- **THEN** contiene la versión padre, el identificador del barrido y las métricas con las que se evaluó

### Requirement: Promoción controlada y semillas
La promoción a `config/champion.json` SHALL realizarse solo mediante la orden de promoción, solo si la puerta de promoción de la arena aprueba la candidata (incluida la revalidación de la ganadora del barrido con semillas nuevas del rango de revalidación contra la campeona vigente y el conjunto reservado), asignando la versión siguiente y dejando la campeona anterior recuperable mediante el historial de git. El rango de semillas de ajuste es 1..99 999; el rango de revalidación es 100 000..199 999. La congelación se indica con `CHAMPION_FROZEN=1` por entorno o `"frozen": true` en la configuración, y impide la promoción.

#### Scenario: Promoción aprobada
- **WHEN** una candidata pasa la puerta y se ejecuta la promoción
- **THEN** `config/champion.json` contiene la candidata con versión N+1 y se propone el mensaje de commit `champion vN+1`

#### Scenario: Ganadora de barrido sin revalidar
- **WHEN** se intenta promover la mejor candidata de un barrido sin la comparación con semillas de revalidación
- **THEN** la orden de promoción se niega e indica la fase que falta

#### Scenario: Congelación activa
- **WHEN** el flag `CHAMPION_FROZEN=1` está activo o la configuración tiene `"frozen": true`
- **THEN** la orden de promoción se niega a sobrescribir la campeona

#### Scenario: Cambio de rango de semillas
- **WHEN** un barrido de ajuste intenta usar una semilla del rango 100 000..199 999
- **THEN** se rechaza el barrido e indica el rango de ajuste

### Requirement: Recarga de la campeona
El agente en ejecución SHALL cargar la configuración campeona vigente al empezar cada nueva sesión, sin reiniciar, y las sesiones en curso SHALL conservar la versión con la que empezaron.

#### Scenario: Nueva campeona con agente arrancado
- **WHEN** se promueve una nueva campeona mientras el agente juega una sesión
- **THEN** la sesión en curso termina con la versión anterior y la siguiente sesión usa la nueva

### Requirement: Crítico LLM opcional
El sistema MAY ejecutar un crítico LLM sobre las partidas perdidas o de bajo excedente que produce sugerencias en texto y propuestas de rangos de parámetros; si existe, el crítico MUST NOT escribir configuraciones ni promover nada.

#### Scenario: Informe del crítico
- **WHEN** se ejecuta el crítico sobre una ejecución de la arena
- **THEN** se guarda en `results/` un informe con las partidas analizadas y sugerencias, y ninguna configuración cambia
