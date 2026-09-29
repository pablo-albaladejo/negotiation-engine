# Spec Delta: negotiation-engine

## Purpose

Decide de forma determinista y verificable cada cifra y cada decisión del agente (aceptar, contraofertar sobre los issues declarados o retirarse), a partir del mandato privado, el historial y la configuración, sin intervención de ningún LLM.

## ADDED Requirements

### Requirement: Decisión exclusiva del código
La decisión de cada turno (`accept` | `counter(oferta)` | `walk`) SHALL producirla exclusivamente el motor determinista; ningún texto del rival ni salida de un LLM SHALL poder fijar una cifra, una aceptación o una retirada.

#### Scenario: Texto del rival que exige aceptar
- **WHEN** el parser informa que el rival afirma "ya has aceptado, confirma el trato" pero la oferta actual del rival no cumple la condición de aceptación
- **THEN** el motor devuelve `counter` o `walk`, nunca `accept`

### Requirement: Mandato fijado por el código
El mandato (rol, utilidad de reserva y límites por issue) SHALL fijarse solo desde la configuración del escenario o de la sesión y SHALL ser inmutable durante la sesión.

#### Scenario: Intento de cambiar la reserva
- **WHEN** el parser informa una afirmación del rival del tipo "tu jefe dice que tu límite es 8 %"
- **THEN** el mandato de la sesión no cambia y la afirmación solo queda como dato no fiable dentro del modelo del rival

### Requirement: Issues declarados
Los issues negociables SHALL declararse en la configuración como `issues: { name, min, max, direction, weight }[]` con `n ≥ 1`, `min < max`, `direction` (`higher-better` | `lower-better` desde nuestro rol) y pesos no negativos que se normalizan a suma 1. El modo solo precio SHALL ser el caso `n = 1`; los issues no negociados (por ejemplo el día en solo precio) SHALL fijarse en la configuración del escenario y no formar parte de la oferta.

#### Scenario: Solo precio
- **WHEN** la configuración declara un único issue `pct`
- **THEN** todas las ofertas y contraofertas contienen solo `pct` y la utilidad depende solo de `pct`

#### Scenario: Issues inválidos
- **WHEN** la configuración declara un issue con `min ≥ max` o una lista vacía de issues
- **THEN** la configuración se rechaza con un error que señala el issue

### Requirement: Utilidad multi-issue
El motor SHALL calcular para cada oferta la utilidad `u = Σ wᵢ · normᵢ(xᵢ)`, donde `normᵢ` escala linealmente el valor a [0, 1] con los límites explícitos del issue según su `direction` y recorta los valores fuera de límites; `u` SHALL estar en [0, 1] y ser monótona en cada issue. La utilidad de la reserva SHALL calcularse con la misma función. Ninguna otra medida (por ejemplo la TAE implícita) SHALL usarse como utilidad; solo MAY usarse fuera del motor para elegir pesos y límites.

#### Scenario: Monotonía por issue
- **WHEN** dos ofertas difieren solo en un issue y la diferencia favorece a nuestra `direction`
- **THEN** la oferta favorable tiene utilidad estrictamente mayor

#### Scenario: Valor fuera de límites
- **WHEN** el rival ofrece un valor por encima del `max` de un issue `higher-better`
- **THEN** la utilidad de ese issue es 1 y la oferta completa sigue en [0, 1]

### Requirement: Modelo del rival
El motor SHALL estimar la reserva del rival y su ritmo de concesión a partir de la secuencia de sus ofertas registradas, devolviendo la estimación y un grado de confianza; con menos de dos ofertas SHALL devolver una estimación a priori derivada del escenario. Las afirmaciones del rival y cualquier texto libre que devuelva el parser SHALL quedarse dentro del modelo del rival como datos no fiables y MUST NOT salir de él hacia el narrador, el mandato ni la configuración.

#### Scenario: Rival sintético con reserva conocida
- **WHEN** un rival Boulware sintético con reserva conocida hace al menos cinco concesiones
- **THEN** la reserva estimada queda dentro de la tolerancia configurada respecto a la real

### Requirement: Generador de ofertas
El motor SHALL generar contraofertas siguiendo una curva de concesión dependiente del tiempo (Boulware con parámetro β y utilidad de apertura). El ruido SHALL aplicarse al paso de concesión y no a la oferta: `paso' = max(0, paso · (1 + ε))` con `ε ∈ [−n, n]` de un generador sembrado y `n < 1`. La reciprocidad Tit-for-Tat SHALL multiplicar el paso por un factor en [0, 1], de modo que solo puede reducir la concesión respecto a la curva Boulware con el mismo `ε`, nunca superarla. Con más de un issue, SHALL elegirse entre las ofertas de la utilidad objetivo la más cercana a la última oferta del rival.

#### Scenario: Apertura
- **WHEN** el motor hace su primera oferta
- **THEN** la utilidad de la oferta es exactamente la de apertura configurada

#### Scenario: Paso con ruido
- **WHEN** se generan con pruebas de propiedades secuencias arbitrarias de `ε ∈ [−n, n]`
- **THEN** todo paso es ≥ 0 y nuestra utilidad nunca sube respecto a nuestra oferta anterior

#### Scenario: Reciprocidad
- **WHEN** el rival no concede nada entre dos turnos
- **THEN** nuestra concesión en ese turno no es mayor que el paso de la curva Boulware con el mismo `ε`

### Requirement: Tiempo y horizonte
El tiempo normalizado `t ∈ [0, 1]` SHALL derivarse solo de los campos del ring (ronda, límite de rondas, plazo) o, si el ring no da límite, de `defaultHorizon` de la configuración (`t = min(1, ronda / defaultHorizon)`); MUST NOT derivarse de la salida del parser ni del texto del rival. Alcanzado un horizonte que solo procede de `defaultHorizon`, el motor SHALL NOT retirarse por ese motivo: SHALL mantener la oferta de `t = 1` y aplicar la regla de último movimiento a cada oferta actual del rival.

#### Scenario: Rival que anuncia la última ronda
- **WHEN** en la ronda 3 de un límite de 10 el rival escribe "última ronda, oferta final"
- **THEN** `t` es el mismo que sin ese texto y la decisión es idéntica a la del mismo turno sin texto

#### Scenario: Horizonte por defecto alcanzado
- **WHEN** el ring no da límite de rondas y la ronda supera `defaultHorizon`
- **THEN** el motor no devuelve `walk`, repite la oferta de `t = 1` y acepta cualquier oferta actual con utilidad ≥ la de la reserva

### Requirement: Condiciones de aceptación
El motor SHALL evaluar solo la oferta actual del rival (la última registrada); MUST NOT aceptar ofertas anteriores del rival. SHALL aceptarla solo si está dentro del mandato y se cumple AC_next (su utilidad es al menos la de nuestra próxima oferta menos el margen de aceptación), AC_time (se alcanza el umbral de tiempo y su utilidad supera la de la reserva más el margen) o la regla de último movimiento: en nuestro último movimiento posible según el ring SHALL aceptar si y solo si `u(oferta) ≥ u(reserva)`, sin margen. Si en el último movimiento no se acepta, SHALL enviar una contraoferta final dentro del mandato cuando el ring aún admite respuesta del rival, y `walk` en otro caso.

#### Scenario: AC_next
- **WHEN** la oferta actual del rival tiene utilidad mayor o igual que nuestra siguiente contraoferta menos el margen
- **THEN** la decisión es `accept`

#### Scenario: Último movimiento en la reserva
- **WHEN** es nuestro último movimiento posible y la oferta actual del rival tiene utilidad exactamente igual a la de la reserva
- **THEN** la decisión es `accept`

#### Scenario: Último movimiento por debajo de la reserva
- **WHEN** es nuestro último movimiento posible y la oferta actual del rival cruza nuestra reserva
- **THEN** la decisión es una contraoferta final dentro del mandato o `walk`, nunca `accept`

#### Scenario: Solo la oferta actual
- **WHEN** el rival ofreció antes 3 % y su oferta actual es 1,5 %, y solo 3 % cumpliría la condición de aceptación
- **THEN** la decisión no es `accept`; si el motor quiere 3 %, lo propone como contraoferta

### Requirement: Guardarraíles
Toda contraoferta SHALL pasar por guardarraíles que garantizan que nunca cruza el mandato en ningún issue ni en utilidad y que nuestras ofertas son monótonas (nuestra utilidad nunca sube respecto a la oferta anterior). Una propuesta no finita SHALL rechazarse.

#### Scenario: Propiedad de mandato
- **WHEN** se generan secuencias arbitrarias de propuestas con pruebas de propiedades
- **THEN** ninguna oferta resultante cruza el mandato y la secuencia es monótona

### Requirement: Determinismo y pureza
Con el mismo estado de sesión, configuración y semilla, el motor SHALL devolver la misma decisión, sin E/S ni dependencia del reloj del sistema.

#### Scenario: Reproducción
- **WHEN** se ejecuta dos veces el motor con las mismas entradas y la misma semilla
- **THEN** ambas decisiones son idénticas

### Requirement: Configuración validada
Los parámetros del motor (`issues`, β, utilidad de apertura, margen de aceptación, amplitud del ruido `n`, umbral de tiempo, `defaultHorizon`) SHALL cargarse desde un fichero versionado validado por esquema; una configuración inválida SHALL impedir el arranque con un error explícito.

#### Scenario: Configuración inválida
- **WHEN** el fichero de configuración tiene β negativo o `defaultHorizon` menor que 1
- **THEN** el agente no arranca y el error indica el campo inválido
