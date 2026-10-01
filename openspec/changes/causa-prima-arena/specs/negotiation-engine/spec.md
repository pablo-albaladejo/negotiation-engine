# Spec Delta: negotiation-engine

## Purpose

Mandato opcional en % TAE (banda mínimo–máximo) para ofertas pct/día, sin cambiar las decisiones con el mandato por issue.

## ADDED Requirements

### Requirement: Conversión pct/día ↔ TAE
El motor SHALL convertir una oferta `{ pct, day }` a TAE con `TAE = pct/(100 − pct) × 365/(baseDays − day) × 100` (en %), con `baseDays` del escenario. La conversión MUST ser estrictamente creciente en `pct` y en `day` dentro de `0 ≤ pct < 100` y `day < baseDays`.

#### Scenario: 2/10 net 30
- **WHEN** se convierte `{ pct: 2, day: 10 }` con `baseDays: 30`
- **THEN** la TAE es 37,24 % (redondeada a dos decimales)

### Requirement: Guardarraíl en banda TAE
Con un mandato `apr`, toda oferta y toda aceptación de nuestro agente SHALL tener una TAE dentro de `[min, max]` de su banda, y nuestras ofertas MUST conceder de forma monótona en TAE. La comprobación MUST repetirse en el pipeline justo antes de enviar.

#### Scenario: Propiedad sobre mandatos aleatorios
- **WHEN** se generan bandas, rondas y ofertas del rival aleatorias con mandato `apr`
- **THEN** ninguna oferta ni aceptación del motor queda fuera de la banda

### Requirement: Mandato por issue sin cambios
Sin mandato `apr`, las decisiones del motor MUST ser idénticas byte a byte a las anteriores a este cambio.

#### Scenario: Decisiones de referencia
- **WHEN** se ejecuta `decide` sobre el conjunto fijo de entradas guardado antes del cambio
- **THEN** la serialización JSON de cada decisión coincide con la guardada
