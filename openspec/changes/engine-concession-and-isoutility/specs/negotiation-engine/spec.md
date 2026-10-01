# Spec Delta: negotiation-engine

## Purpose

No conceder cuando el rival no se mueve y, a igual utilidad para nosotros, ofrecer la combinación de issues que más le conviene al rival. Ambas opciones son configurables y apagadas por defecto hasta que la puerta de promoción diga lo contrario.

## ADDED Requirements

### Requirement: Regla "sin concesión gratis"
Los parámetros del motor y la configuración del agente SHALL aceptar una clave opcional `noFreeConcession` con `epsilon` (utilidad nuestra, ≥ 0, por defecto 0,001), `fraction` (en [0, 1], por defecto 0) y `releaseT` (en [0, 1], por defecto `acTimeThreshold`). Clave ausente = regla apagada. Con la regla encendida, si ya enviamos alguna oferta, el rival no hizo una oferta nueva en este turno y no aplica la liberación por plazo, la contraoferta MUST ser exactamente nuestra última oferta cuando `fraction = 0`, y con `fraction > 0` MUST conceder como mucho `fraction` veces el paso que habría dado la curva Boulware en ese turno.

#### Scenario: El rival repite su oferta
- **WHEN** `noFreeConcession` está encendida con `fraction = 0`, `t < releaseT` y la oferta actual del rival es igual a la anterior
- **THEN** la decisión es `counter` con una oferta idéntica, issue a issue, a nuestra última oferta

#### Scenario: Concesión parcial
- **WHEN** `noFreeConcession` está encendida con `fraction = 0,25` y el rival no hizo oferta nueva
- **THEN** `u(última nuestra) − u(contraoferta) ≤ 0,25 · paso Boulware del turno` más la tolerancia de redondeo

#### Scenario: Propiedad: nunca mejor para el rival sin que él mejore
- **WHEN** fast-check genera escenarios, historiales y semillas con la regla encendida (`fraction = 0`) en turnos sin oferta nueva del rival y sin liberación por plazo
- **THEN** la utilidad nuestra de la contraoferta es igual a la de nuestra última oferta y la oferta es la misma

### Requirement: Qué es una oferta nueva del rival
La entrada del motor SHALL aceptar `state.rivalOfferedThisTurn` (booleano opcional), que el pipeline MUST fijar a `true` solo cuando la regla de enlace registró una oferta del rival en este turno. Una oferta es nueva si y solo si `rivalOfferedThisTurn` no es `false`, la oferta actual no está marcada como sin confirmar (`currentOfferUnconfirmed`) y su utilidad para nosotros supera en más de `epsilon` la mejor utilidad (para nosotros) de las ofertas anteriores del rival. La primera oferta del rival siempre es nueva. Con `rivalOfferedThisTurn` ausente, el motor SHALL suponer que hay oferta este turno si existe oferta actual del rival.

#### Scenario: Solo palabras
- **WHEN** el rival manda texto sin cifras y el pipeline fija `rivalOfferedThisTurn = false`
- **THEN** no hay oferta nueva y, con la regla encendida, repetimos nuestra última oferta

#### Scenario: Cifras sin confirmar
- **WHEN** `currentOfferUnconfirmed = true`
- **THEN** no hay oferta nueva

#### Scenario: Mejora por debajo de epsilon
- **WHEN** la oferta actual del rival mejora nuestra utilidad en 0,0005 respecto a su mejor oferta anterior y `epsilon = 0,001`
- **THEN** no hay oferta nueva

#### Scenario: Oscilación del rival
- **WHEN** el rival empeora su oferta y en el turno siguiente vuelve a la anterior
- **THEN** la vuelta no cuenta como oferta nueva, porque no supera su mejor oferta anterior

### Requirement: Liberación por plazo
La regla "sin concesión gratis" MUST NOT aplicarse cuando `t ≥ releaseT`, cuando es nuestro último movimiento según el ring (`isLastMove`, con o sin `rivalCanRespond`) o cuando se alcanzó el horizonte por defecto. En esos turnos la oferta SHALL seguir la curva Boulware y la aceptación como hoy, para que la regla no lleve a una retirada cuando había acuerdo posible.

#### Scenario: Último movimiento con respuesta del rival
- **WHEN** la regla está encendida, `isLastMove = true`, `rivalCanRespond = true` y el rival no hizo oferta nueva
- **THEN** la contraoferta es la de la curva Boulware en `t = 1` (sin retención)

#### Scenario: Pasado releaseT
- **WHEN** la regla está encendida, `t ≥ releaseT` y el rival repite su oferta
- **THEN** la decisión es la misma que con la regla apagada

### Requirement: Composición con reciprocidad, aceptación y guardarraíles
El orden SHALL ser: objetivo Boulware → (si hay oferta nueva) factor de reciprocidad como hoy, (si no la hay y la regla aplica) retención → colocación de la oferta → guardarraíles. La retención MUST sustituir al factor de reciprocidad en ese turno, no multiplicarse con él. La aceptación SHALL evaluarse con la utilidad de la contraoferta que realmente enviaríamos (la retenida si hay retención). Toda oferta, retenida o no, MUST pasar por `enforceOfferGuardrails`.

#### Scenario: Reciprocidad encendida y rival quieto
- **WHEN** `reciprocity = 0,5`, la regla está encendida y el rival no hizo oferta nueva
- **THEN** la contraoferta es la retenida y el factor de reciprocidad no interviene

#### Scenario: AC_next con oferta retenida
- **WHEN** hay retención
- **THEN** `ourNextUtility` de la aceptación es la utilidad de nuestra última oferta

### Requirement: Colocación iso-utilidad
Los parámetros del motor y la configuración SHALL aceptar `isoUtility` con valores `off` (por defecto; ausente equivale a `off`), `closest-to-rival-last` y `opponent-model`. Con un valor distinto de `off` y al menos dos issues, la oferta de utilidad objetivo `u` SHALL elegirse entre los candidatos de la rejilla de oferta (redondeados a nuestro favor) dentro del mandato con utilidad en `[u, u + δ]`, donde `δ` es la utilidad de un paso de rejilla del issue resuelto; la oferta plana actual SHALL ser siempre candidata. `closest-to-rival-last` MUST elegir el candidato de menor distancia euclídea normalizada (cada issue dividido por `max − min`) a la oferta actual del rival; `opponent-model` MUST elegir el de mayor utilidad estimada para el rival con los pesos estimados del modelo del rival. Los empates SHALL resolverse por mayor utilidad nuestra y después por la oferta plana. Sin oferta del rival (o, en `opponent-model`, con confianza 0) SHALL usarse la oferta plana. Con un solo issue la oferta MUST ser la de hoy. La oferta elegida MUST NOT cruzar el mandato y MUST mantener nuestras ofertas monótonas en nuestra utilidad.

#### Scenario: Propiedad: misma utilidad que la oferta plana
- **WHEN** fast-check genera escenarios de 2 issues, utilidades objetivo y ofertas del rival con `isoUtility` encendida
- **THEN** `|u(iso) − u(plana)| ≤ δ` y `u(iso) ≥ u` objetivo

#### Scenario: Propiedad: sin cruzar el mandato
- **WHEN** fast-check genera mandatos, objetivos y ofertas del rival
- **THEN** `withinOfferMandate` es cierto para toda oferta elegida y la secuencia de nuestras utilidades nunca sube

#### Scenario: Un solo issue sin cambios
- **WHEN** el escenario tiene un solo issue y `isoUtility` es `closest-to-rival-last` u `opponent-model`
- **THEN** la decisión es idéntica a la de `isoUtility = off`

#### Scenario: Más cerca del rival
- **WHEN** en `pct-day-buyer-wide` el rival ofrece `{ pct: 3, day: 40 }` y `isoUtility = closest-to-rival-last`
- **THEN** la distancia normalizada de nuestra oferta a la del rival es menor o igual que la de la oferta plana con la misma utilidad

### Requirement: Búsqueda contra una utilidad abstracta
La búsqueda iso-utilidad SHALL depender solo de una interfaz `UtilitySpace` (`issues`, `utility(offer)`, `withinMandate(offer)`, `roundInFavor(offer)`, `gridStep(issue)`) y MUST NOT usar la forma lineal de la utilidad salvo a través de esa interfaz. Este cambio SHALL entregar la implementación lineal pct/día; la implementación TAE de la unidad de mandato `apr` llega con `causa-prima-arena`. Con más de dos issues la colocación SHALL ser la plana.

#### Scenario: Utilidad monótona no lineal
- **WHEN** se ejecuta la búsqueda con un `UtilitySpace` de prueba no lineal y monótono en cada issue
- **THEN** se cumplen las mismas propiedades de utilidad, mandato y monotonía

### Requirement: Decisiones idénticas con las opciones apagadas
Con `noFreeConcession` ausente e `isoUtility` ausente u `off`, la decisión del motor (acción, oferta, regla y `explain`) MUST ser idéntica byte a byte a la de antes de este cambio para cualquier entrada.

#### Scenario: Doradas y fixtures
- **WHEN** se ejecutan `test/golden.test.ts`, los fixtures del motor y la propiedad de equivalencia con las opciones ausentes
- **THEN** `JSON.stringify(decide(input))` coincide con el de la implementación anterior y no aparece `explain.offerRule`

### Requirement: Explicación de la regla de oferta
`explain` SHALL llevar un campo opcional `offerRule` con uno de `held-no-new-offer`, `held-partial`, `released-deadline`, `iso-utility-closest`, `iso-utility-model` o `iso-utility-plain` (iso encendido pero se usó la oferta plana), presente solo si alguna de las dos opciones está encendida. `offerRule` MUST NOT cambiar la decisión, MUST NOT contener cifras ni nuestra reserva, y sigue las reglas de `explain`: solo en la traza JSONL local, redactado en OTel/Langfuse y en pino.

#### Scenario: Retención explicada
- **WHEN** hay retención por falta de oferta nueva
- **THEN** `explain.offerRule = "held-no-new-offer"` y la regla de aceptación (`rule`) es la de siempre

#### Scenario: Redacción
- **WHEN** se juega un turno con `offerRule` y exportación OTel
- **THEN** los spans y los logs no contienen `offerRule` ni su valor

### Requirement: Valores por defecto solo por la puerta
Los valores de `noFreeConcession` e `isoUtility` en `config/champion.json` MUST cambiar solo mediante `pnpm promote` con la puerta superada (efecto ≥ `minEffectPp`, significativo, semillas nuevas, 0 violaciones y 0 fugas).

#### Scenario: Candidata que no pasa
- **WHEN** `pnpm promote <candidata con noFreeConcession> --dry-run` no supera la puerta
- **THEN** `config/champion.json` no cambia y `gate.json` registra qué comprobación falló
