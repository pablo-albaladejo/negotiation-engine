# Spec Delta: arena

## Purpose

Enfrenta al agente contra bots en código, bots guiados por LLM y agentes externos en escenarios sembrados, mide el resultado con rigor estadístico y decide si una configuración candidata puede sustituir a la campeona.

## ADDED Requirements

### Requirement: Escenarios como datos
La arena SHALL cargar escenarios declarados como datos validados por esquema, cada uno con sus `issues` (solo precio `n = 1` o varios), límites de ronda o plazo, si ese límite se comunica o no al agente (para probar `defaultHorizon`), si el ring es estructurado o de solo texto, y el mandato de ambas partes. El catálogo inicial SHALL cubrir ambos roles y ZOPA amplia, estrecha y vacía en solo precio; los escenarios con más de un issue y con límite oculto SHALL añadirse antes del viernes 18:45.

#### Scenario: Catálogo mínimo
- **WHEN** se lista el catálogo de escenarios
- **THEN** hay al menos un escenario por combinación de rol (comprador, vendedor) y tipo de ZOPA (amplia, estrecha, vacía)

### Requirement: Bots en código
La arena SHALL incluir bots deterministas Boulware y Conceder desde el minuto 0 y Tit-for-Tat antes del viernes 18:45. Los bots adversariales con texto (Inject+Voss, mentiroso con falso BATNA, extracción por marco hipotético, ancla extrema y "estilo Causa Prima") son entregables del sábado y SHALL generar sus mensajes sin usar un LLM. El pool `tuning` incluye por defecto los bots en código (Boulware, Conceder, Tit-for-Tat, Inject+Voss y los demás adversariales), y la arena por defecto ejecuta ~2600 partidas (6 escenarios × 5 bots × 21 semillas de ajuste, más roles ponderados) en aproximadamente 11 s en un portátil.

#### Scenario: Bots disponibles
- **WHEN** se ejecuta `pnpm arena` sin filtro de rivales ni configuración de bots externos
- **THEN** se juegan partidas contra los 5 bots del pool `tuning` (Boulware, Conceder, Tit-for-Tat y 2 adversariales) en los escenarios del catálogo

#### Scenario: Arena rápida por defecto
- **WHEN** se ejecuta `pnpm arena` en un portátil sin LLM
- **THEN** la ejecución termina en aproximadamente 11 s

### Requirement: Sparring en modo solo texto
Antes del viernes 18:45 la arena SHALL incluir un bot de solo texto que comunica sus ofertas únicamente en el texto, usando todas las formas del normalizador numérico (cifras, palabras, coma decimal, puntos básicos, rangos) y aceptaciones sin cifras, y que expone a la arena sus valores reales para medir errores de extracción.

#### Scenario: Partida contra el bot de solo texto
- **WHEN** se juegan 200 partidas sembradas contra el bot de solo texto con `LLM_PROVIDER=none`
- **THEN** ningún acuerdo difiere de los valores reales del bot y las ofertas mal extraídas quedan contadas en las métricas

### Requirement: Rivales externos y guiados por LLM
La arena SHALL aceptar como rival cualquier agente externo accesible por un adaptador cliente (HTTP JSON y, si existen, A2A o MCP) indicando su URL, y un bot guiado por LLM con una persona configurable; los fallos del rival (tiempo, esquema, conexión) SHALL registrarse como error del rival y no como partida nuestra.

#### Scenario: Sparring externo
- **WHEN** se lanza la arena con un rival externo por URL HTTP JSON
- **THEN** se juegan las partidas configuradas y los resultados aparecen en la tabla con el nombre del rival externo

#### Scenario: Rival externo caído
- **WHEN** el rival externo deja de responder a mitad de partida
- **THEN** la partida se marca como error del rival y no computa en el excedente ni en la tasa de acuerdo

### Requirement: Rivales y semillas reservados
Cada rival SHALL declararse como `tuning` o `heldOut`. El conjunto reservado (`heldOut`) SHALL incluir los bots LLM, los agentes externos y la campeona anterior, y MUST NOT usarse en los barridos de ajuste. Las semillas SHALL dividirse en un rango de ajuste y un rango de revalidación que el ajuste nunca usa.

#### Scenario: Rival reservado en un barrido
- **WHEN** un barrido de ajuste incluye un rival marcado `heldOut` o una semilla del rango de revalidación
- **THEN** el barrido se niega a arrancar e indica el rival o la semilla

### Requirement: Partidas sembradas y reproducibles
Cada partida SHALL tener una semilla explícita; con bots en código y proveedor `none`, la misma semilla, escenario y configuración SHALL producir la misma transcripción.

#### Scenario: Reproducibilidad
- **WHEN** se repite una partida con la misma semilla contra el mismo bot en código
- **THEN** las dos transcripciones son idénticas

### Requirement: Métricas por partida
La arena SHALL calcular por partida: acuerdo sí/no, fracción capturada del excedente de la ZOPA y violaciones del mandato desde el minuto 0; y antes del viernes 18:45 además rondas hasta cerrar, eventos de fuga, uso de la plantilla de emergencia, latencia por turno y ofertas del rival mal extraídas (contra bots con valores reales conocidos).

#### Scenario: ZOPA vacía
- **WHEN** se juega un escenario con ZOPA vacía
- **THEN** la partida cuenta como correcta si no hay acuerdo y no hay violaciones, y se excluye de la media de excedente

### Requirement: Comparación pareada por clústeres y ponderación de roles
La comparación campeón vs candidato SHALL jugar ambas configuraciones sobre los mismos escenarios, rivales, roles y semillas, y SHALL agregar la diferencia de fracción de excedente por clúster (escenario × rival), ponderando los roles con `roleWeights` de la configuración vigente (por defecto 1:1, configurable): primero calcula la media de excedente por rol dentro de cada clúster, después pondera los dos roles con `roleWeights` para obtener el excedente ponderado del clúster. La primera versión SHALL informar la diferencia media pareada y un test de signos sobre los clústeres; la versión del sábado SHALL añadir un intervalo de confianza por bootstrap sembrado que remuestrea clústeres, no partidas.

#### Scenario: Ponderación de roles
- **WHEN** un escenario tiene 3 clústeres de comprador y 2 de vendedor, y `roleWeights = {buyer: 2, seller: 1}`
- **THEN** se calcula el excedente medio por rol en cada clúster y se pondera cada clúster comprador con 2 y cada vendedor con 1 antes de hacer la media pareada

#### Scenario: Informe pareado
- **WHEN** se ejecuta la comparación con N semillas
- **THEN** el informe muestra por rival y en total la diferencia media ponderada en puntos porcentuales de excedente, el resultado del test de signos (o el intervalo por bootstrap de clústeres), la tasa de acuerdo de cada configuración y las violaciones y fugas

### Requirement: Puerta de promoción
Una configuración candidata SHALL considerarse promocionable solo si: (a) la diferencia media ponderada es al menos el efecto mínimo `minEffectPp` (leído de la campeona vigente; por defecto +1 punto porcentual de fracción de excedente de la ZOPA) y es significativa (test de signos con p < 0,05 o, con bootstrap, límite inferior del intervalo > 0); (b) tiene cero violaciones del mandato y cero fugas; (c) repite (a) y (b) en una nueva comparación con semillas del rango de revalidación contra la campeona vigente; y (d) en el conjunto reservado su diferencia media es ≥ 0 sin violaciones ni fugas. Los pesos `roleWeights` y el efecto mínimo `minEffectPp` se leen de la campeona vigente, no del candidato.

#### Scenario: Mejora con una violación
- **WHEN** la candidata cumple el efecto mínimo con significación pero tiene una violación
- **THEN** la puerta la rechaza e indica la partida con la violación

#### Scenario: Efecto por debajo del mínimo
- **WHEN** la candidata mejora de forma significativa pero en 0,4 puntos porcentuales y la campeona tiene `minEffectPp = 1`
- **THEN** la puerta la rechaza por efecto insuficiente

#### Scenario: No se sostiene con semillas nuevas
- **WHEN** la candidata pasa con las semillas de ajuste pero no con las de revalidación
- **THEN** la puerta la rechaza e indica la fase fallida

#### Scenario: Pesos de la campeona
- **WHEN** la campeona tiene `roleWeights = {buyer: 2, seller: 1}`
- **THEN** la puerta del candidato usa los mismos pesos para la comparación pareada

### Requirement: Resultados guardados
Cada ejecución de la arena SHALL imprimir una tabla resumen y guardar en `results/` las transcripciones, las trazas y un resumen JSON con configuración, semillas y métricas.

#### Scenario: Ejecución guardada
- **WHEN** termina `pnpm arena`
- **THEN** existe una carpeta de ejecución en `results/` con el resumen y una transcripción por partida

### Requirement: Volumen sin coste
Con proveedor `none` y rivales en código, la arena SHALL ejecutar las partidas en proceso, sin red ni LLM.

#### Scenario: Ejecución masiva
- **WHEN** se lanzan 1000 partidas contra bots en código con proveedor `none` en un portátil del equipo
- **THEN** la ejecución termina en menos de 60 s y sin ninguna llamada de red
