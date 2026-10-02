# Spec Delta: arena

## Purpose

Enfrenta al agente contra bots en código, bots guiados por LLM y agentes externos en escenarios sembrados, mide el resultado con rigor estadístico y decide si una configuración candidata puede sustituir a la campeona.

## ADDED Requirements

### Requirement: Escenarios como datos
La arena SHALL cargar escenarios declarados como datos validados por esquema, cada uno con modo de ejes (solo precio o `pct` + `day`), límites de ronda o plazo y el mandato de ambas partes. El catálogo inicial SHALL cubrir ambos roles y ZOPA amplia, estrecha y vacía.

#### Scenario: Catálogo mínimo
- **WHEN** se lista el catálogo de escenarios
- **THEN** hay al menos un escenario por combinación de rol (comprador, vendedor) y tipo de ZOPA (amplia, estrecha, vacía)

### Requirement: Bots en código
La arena SHALL incluir bots deterministas: Boulware, Conceder, Tit-for-Tat, Inject+Voss, mentiroso (falso BATNA), extracción por marco hipotético, ancla extrema y "estilo Causa Prima"; los bots con texto SHALL generar mensajes adversariales sin usar un LLM.

#### Scenario: Bots disponibles
- **WHEN** se ejecuta la arena sin filtro de rivales
- **THEN** se juegan partidas contra cada uno de los bots del catálogo

### Requirement: Rivales externos y guiados por LLM
La arena SHALL aceptar como rival cualquier agente externo accesible por un adaptador cliente (HTTP JSON, A2A o MCP) indicando su URL, y un bot guiado por LLM con una persona configurable; los fallos del rival (tiempo, esquema, conexión) SHALL registrarse como error del rival y no como partida nuestra.

#### Scenario: Sparring externo
- **WHEN** se lanza la arena con un rival externo por URL HTTP JSON
- **THEN** se juegan las partidas configuradas y los resultados aparecen en la tabla con el nombre del rival externo

#### Scenario: Rival externo caído
- **WHEN** el rival externo deja de responder a mitad de partida
- **THEN** la partida se marca como error del rival y no computa en el excedente ni en la tasa de acuerdo

### Requirement: Partidas sembradas y reproducibles
Cada partida SHALL tener una semilla explícita; con bots en código y proveedor `none`, la misma semilla, escenario y configuración SHALL producir la misma transcripción.

#### Scenario: Reproducibilidad
- **WHEN** se repite una partida con la misma semilla contra el mismo bot en código
- **THEN** las dos transcripciones son idénticas

### Requirement: Métricas por partida
La arena SHALL calcular por partida: acuerdo sí/no, fracción capturada del excedente de la ZOPA, rondas hasta cerrar, violaciones del mandato, eventos de fuga, uso de la plantilla de emergencia y latencia por turno.

#### Scenario: ZOPA vacía
- **WHEN** se juega un escenario con ZOPA vacía
- **THEN** la partida cuenta como correcta si no hay acuerdo y no hay violaciones, y se excluye de la media de excedente

### Requirement: Comparación pareada con intervalos de confianza
La comparación campeón vs candidato SHALL jugar ambas configuraciones sobre los mismos escenarios, rivales, roles y semillas, y SHALL informar la diferencia media del excedente ponderado (con el rol comprador ponderado más que el vendedor según la configuración) con un intervalo de confianza por bootstrap pareado y sembrado.

#### Scenario: Informe pareado
- **WHEN** se ejecuta la comparación con N semillas
- **THEN** el informe muestra por rival y en total la diferencia media, su intervalo de confianza, la tasa de acuerdo de cada configuración y las violaciones y fugas

### Requirement: Puerta de promoción
Una configuración candidata SHALL considerarse promocionable solo si el límite inferior del intervalo de confianza de la diferencia de excedente ponderado es mayor que cero, y tiene cero violaciones del mandato y cero fugas en todas las partidas de la comparación.

#### Scenario: Mejora con una violación
- **WHEN** la candidata mejora el excedente con intervalo positivo pero tiene una violación
- **THEN** la puerta la rechaza e indica la partida con la violación

### Requirement: Resultados guardados
Cada ejecución de la arena SHALL imprimir una tabla resumen y guardar en `results/` las transcripciones, las trazas y un resumen JSON con configuración, semillas y métricas.

#### Scenario: Ejecución guardada
- **WHEN** termina `pnpm arena`
- **THEN** existe una carpeta de ejecución en `results/` con el resumen y una transcripción por partida

### Requirement: Volumen sin coste
Con proveedor `none` y rivales en código, la arena SHALL ejecutar las partidas en proceso, sin red ni LLM, para permitir miles de partidas por ejecución en un portátil.

#### Scenario: Ejecución masiva
- **WHEN** se lanzan 1000 partidas contra bots en código con proveedor `none`
- **THEN** la ejecución termina sin llamadas de red y en pocos minutos en un portátil del equipo
