# Spec Delta: negotiation-engine

## Purpose

Hace visible por qué el motor tomó cada decisión, sin cambiar la decisión, para que el visor no tenga que recalcular nada.

## ADDED Requirements

### Requirement: Explicación de la decisión
La decisión del motor SHALL poder llevar un campo opcional `explain` con: `t`, la utilidad objetivo Boulware y la oferta objetivo (`target`, `targetOffer`), el paso respecto a nuestra oferta anterior (`step`, `null` en la apertura), la utilidad de la oferta decidida (`uOffer`) y de la oferta actual del rival (`uRival`, `null` si no hay), el resultado de AC_next (booleano), el de AC_time (`n/a` | `applies` | `no`) y la estimación de la reserva del rival (`rivalReserveEstimate`). `explain` MUST NOT cambiar la acción, la oferta ni la regla, y MUST NOT incluir nuestra reserva ni nuestro mandato.

`rivalReserveEstimate` SHALL ser la estimación del modelo del rival sobre la reserva DEL RIVAL (nunca la nuestra) y SHALL estar siempre presente: sin ofertas del rival es el a priori del escenario (punto medio del rango de cada issue); con ofertas, su mejor oferta para nosotros o la regresión de su curva de concesión. `targetOffer` SHALL ser `null` cuando `target` ya está en la utilidad de nuestra reserva (concesión completa), para no escribir nuestra oferta de reserva.

`explain` es equivalente a la reserva: en concesión completa `target = uRes`, y con un solo issue esa utilidad (o la oferta objetivo cercana a `t = 1`) revela nuestra reserva. Por eso `explain` SHALL ser solo local: SHALL escribirse únicamente en la traza JSONL local, MUST redactarse en la exportación OpenTelemetry/Langfuse y en los logs de pino, y MUST NOT aparecer en ninguna exportación ni salida hacia el rival.

#### Scenario: Misma decisión con y sin explicación
- **WHEN** se ejecuta el motor sobre los fixtures de `test/fixtures/engine/` y las partidas doradas
- **THEN** acción, oferta y regla son idénticas a las de antes del cambio y cada decisión trae `explain`

#### Scenario: Estimación de la reserva del rival
- **WHEN** el rival ha hecho al menos 2 ofertas
- **THEN** `explain.rivalReserveEstimate` no es nulo y es una oferta sobre los issues del escenario derivada de las ofertas del rival

#### Scenario: Explicación solo local
- **WHEN** se juega un turno con logs de pino en nivel `trace` y exportación OTel
- **THEN** la traza JSONL local tiene `explain` completo y ni los logs ni los spans contienen sus claves ni sus valores

#### Scenario: Sin mandato en la explicación
- **WHEN** se serializa `explain` de cualquier decisión
- **THEN** no contiene las claves `mandate` ni `reservation`
