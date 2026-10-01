# Spec Delta: negotiation-engine

## Purpose

Hace visible por qué el motor tomó cada decisión, sin cambiar la decisión, para que el visor no tenga que recalcular nada.

## ADDED Requirements

### Requirement: Explicación de la decisión
La decisión del motor SHALL poder llevar un campo opcional `explain` con: `t`, la utilidad objetivo Boulware y la oferta objetivo (`target`, `targetOffer`), el paso respecto a nuestra oferta anterior (`step`, `null` en la apertura), la utilidad de la oferta decidida (`uOffer`) y de la oferta actual del rival (`uRival`, `null` si no hay), el resultado de AC_next (booleano), el de AC_time (`n/a` | `applies` | `no`) y la estimación de la reserva del rival (`rivalReserveEstimate`). `explain` MUST NOT cambiar la acción, la oferta ni la regla, y MUST NOT incluir nuestra reserva ni nuestro mandato.

#### Scenario: Misma decisión con y sin explicación
- **WHEN** se ejecuta el motor sobre los fixtures de `test/fixtures/engine/` y las partidas doradas
- **THEN** acción, oferta y regla son idénticas a las de antes del cambio y cada decisión trae `explain`

#### Scenario: Sin mandato en la explicación
- **WHEN** se serializa `explain` de cualquier decisión
- **THEN** no contiene las claves `mandate` ni `reservation`
