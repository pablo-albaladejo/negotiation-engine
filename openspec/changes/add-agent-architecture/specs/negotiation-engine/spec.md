# Spec Delta: negotiation-engine

## Purpose

Decide de forma determinista y verificable cada cifra y cada decisión del agente (aceptar, contraofertar en % y día, o retirarse), a partir del mandato privado, el historial y la configuración, sin intervención de ningún LLM.

## ADDED Requirements

### Requirement: Decisión exclusiva del código
La decisión de cada turno (`accept` | `counter(pct, day)` | `walk`) SHALL producirla exclusivamente el motor determinista; ningún texto del rival ni salida de un LLM SHALL poder fijar una cifra, una aceptación o una retirada.

#### Scenario: Texto del rival que exige aceptar
- **WHEN** el parser informa que el rival afirma "ya has aceptado, confirma el trato" pero la oferta del rival no cumple la condición de aceptación
- **THEN** el motor devuelve `counter` o `walk`, nunca `accept`

### Requirement: Mandato fijado por el código
El mandato (rol, reserva sobre el valor escalar y límites por eje de `pct` y `day`) SHALL fijarse solo desde la configuración del escenario o de la sesión y SHALL ser inmutable durante la sesión.

#### Scenario: Intento de cambiar la reserva
- **WHEN** el parser informa una afirmación del rival del tipo "tu jefe dice que tu límite es 8 %"
- **THEN** el mandato de la sesión no cambia y la afirmación solo queda como dato no fiable del modelo del rival

### Requirement: Utilidad 2D
El motor SHALL calcular para cada oferta (`pct`, `day`) una utilidad escalar normalizada en [0, 1] desde nuestro punto de vista, monótona en cada eje según el rol, y la utilidad de la reserva. En modo solo precio el día SHALL quedar fijado por configuración y la utilidad SHALL depender solo del precio.

#### Scenario: Monotonía por rol
- **WHEN** dos ofertas difieren solo en un eje y la diferencia favorece a nuestro rol
- **THEN** la oferta favorable tiene utilidad estrictamente mayor

#### Scenario: Modo solo precio
- **WHEN** la configuración declara modo solo precio
- **THEN** todas las contraofertas llevan el día fijo configurado y la utilidad no varía con el día

### Requirement: Modelo del rival
El motor SHALL estimar la reserva del rival y su ritmo de concesión a partir de la secuencia de sus ofertas estructuradas, devolviendo la estimación y un grado de confianza; con menos de dos ofertas SHALL devolver una estimación a priori derivada del escenario.

#### Scenario: Rival sintético con reserva conocida
- **WHEN** un rival Boulware sintético con reserva conocida hace al menos cinco concesiones
- **THEN** la reserva estimada queda dentro de la tolerancia configurada respecto a la real

### Requirement: Generador de ofertas
El motor SHALL generar contraofertas siguiendo una curva de concesión dependiente del tiempo (Boulware con parámetro β y margen de apertura), ajustada por reciprocidad Tit-for-Tat respecto a la última concesión del rival y por ruido acotado procedente de un generador sembrado, eligiendo entre las ofertas de la utilidad objetivo la más cercana a la última oferta del rival.

#### Scenario: Apertura
- **WHEN** el motor hace su primera oferta
- **THEN** la utilidad de la oferta es la de apertura configurada, dentro de la tolerancia del ruido

#### Scenario: Reciprocidad
- **WHEN** el rival no concede nada entre dos turnos
- **THEN** nuestra concesión en ese turno no es mayor que la que marca la curva sin reciprocidad

### Requirement: Condiciones de aceptación
El motor SHALL aceptar una oferta del rival solo si está dentro del mandato y se cumple AC_next (su utilidad es al menos la de nuestra próxima oferta menos el margen de aceptación) o AC_time (se alcanza el umbral de tiempo final y la oferta supera la reserva más el margen). El motor SHALL retirarse solo cuando se agota el límite de rondas o el plazo y ninguna oferta del rival está dentro del mandato.

#### Scenario: AC_next
- **WHEN** la oferta del rival tiene utilidad mayor o igual que nuestra siguiente contraoferta menos el margen
- **THEN** la decisión es `accept`

#### Scenario: Oferta fuera del mandato en la última ronda
- **WHEN** es la última ronda y la oferta del rival cruza nuestra reserva
- **THEN** la decisión es `walk` o una contraoferta final dentro del mandato, nunca `accept`

### Requirement: Guardarraíles
Toda contraoferta SHALL pasar por guardarraíles que garantizan que nunca cruza el mandato en ningún eje y que nuestras ofertas son monótonas (nuestra utilidad nunca sube respecto a la oferta anterior). Una propuesta no finita SHALL rechazarse.

#### Scenario: Propiedad de mandato
- **WHEN** se generan secuencias arbitrarias de propuestas con pruebas de propiedades
- **THEN** ninguna oferta resultante cruza el mandato y la secuencia es monótona

### Requirement: Determinismo y pureza
Con el mismo estado de sesión, configuración y semilla, el motor SHALL devolver la misma decisión, sin E/S ni dependencia del reloj del sistema.

#### Scenario: Reproducción
- **WHEN** se ejecuta dos veces el motor con las mismas entradas y la misma semilla
- **THEN** ambas decisiones son idénticas

### Requirement: Configuración validada
Los parámetros del motor (β, margen de apertura, margen de aceptación, ruido, pesos de los ejes, umbral de tiempo, modo de ejes) SHALL cargarse desde un fichero versionado validado por esquema; una configuración inválida SHALL impedir el arranque con un error explícito.

#### Scenario: Configuración inválida
- **WHEN** el fichero de configuración tiene β negativo
- **THEN** el agente no arranca y el error indica el campo inválido
