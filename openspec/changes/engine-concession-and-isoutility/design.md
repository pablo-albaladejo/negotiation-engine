# Design: sin concesión gratis e iso-utilidad

## Context

Estado actual verificado en el código:

- **Concesión**: `decide` (`src/engine/engine.ts:142-149`) genera la contraoferta en cada turno con `generateOffer(..., time.t, epsilon, ourLast, factor)`. `nextUtility` (`src/engine/offer.ts:57-65`) da `u(última) − max(0, u(última) − objetivo)·(1+ε)·factor`: con `factor = 1` bajamos hasta la curva Boulware aunque el rival no se haya movido. El único freno es `reciprocityFactor` (`offer.ts:34-38`), apagado en la campeona. `enforceOfferGuardrails` (`src/engine/guardrails.ts:64-66`) solo devuelve la oferta anterior si la nueva nos da **más** utilidad.
- **Oferta nueva**: el pipeline solo añade a `rivalOffers` cuando la regla de enlace da `offer` (`src/pipeline/pipeline.ts:332-334`). El motor es puro y no sabe si `rivalOffers.at(-1)` llegó en este turno o en uno anterior; solo sabe `currentOfferUnconfirmed` (`pipeline.ts:126`).
- **Colocación**: `offerAboveReservation` (`offer.ts:71-79`) usa el mismo λ en todos los issues y `roundInFavor` (`src/engine/issues.ts:73-85`) redondea cada issue a 0,01 a nuestro favor. En `pct-day-buyer-wide` (pesos 0,7/0,3, reservas `{pct: 2, day: 15}` y `{pct: 6, day: 45}`) la oferta es siempre el punto de λ común, sin mirar al rival.
- **Modelo del rival**: `OpponentModel.summary()` (`src/engine/opponent.ts:92-115`) da `bestOffer`, `lastConcession` y `estimatedWeights` (frecuencias: el issue que menos mueve pesa más) con `confidence`. El motor no le pasa `t` (`engine.ts:122`), así que la regresión no corre en el motor.
- **Bots de la arena**: usan los mismos issues y pesos del escenario (`src/bots/bot.ts:89`). Con pesos idénticos y direcciones opuestas `u_rival = 1 − u_nuestra`: el juego es de suma cero en utilidad y la iso-utilidad no puede mejorar a nadie contra estos bots (ver "Medición").

## Goals / Non-Goals

- Goals: no conceder sin movimiento del rival sin perder acuerdos por el plazo; colocar la oferta en la curva de iso-utilidad a favor del rival; medirlo todo con la puerta; decisiones idénticas con las opciones apagadas.
- Non-Goals: cambiar la curva Boulware, la aceptación o el modelo del rival; rejillas por issue (día entero) — el paso sigue siendo `OFFER_DECIMALS = 2`; colocación iso con más de 2 issues; cambiar `config/champion.json` en este cambio.

## Decisions

### 1. Apagadas por defecto
Ambas claves ausentes = comportamiento actual. Razón: contra `tit-for-tat` la retención provoca retención mutua hasta `releaseT` y puede bajar la tasa de acuerdo; contra los bots actuales la iso-utilidad no cambia la utilidad de nadie. Que lo decida la puerta pareada, no el documento.

### 2. Oferta nueva = mejora estricta sobre su mejor oferta anterior
Comparar con la **mejor** oferta anterior (no con la inmediatamente anterior) evita que un rival que oscila (empeora y vuelve) cobre una concesión gratis. `epsilon` está en nuestra utilidad; 0,001 está por encima del ruido de redondeo de un paso de 0,01 en pct (0,0007 con peso 0,7 y rango 10). `rivalOfferedThisTurn` lo fija el pipeline (`binding.kind === "offer"`); ausente, el motor supone que la oferta actual es de este turno (las llamadas directas a `decide` de tests y herramientas siguen funcionando).

### 3. Retención literal, no recolocación
Con `fraction = 0` se devuelve `pickIssues(ourLast)` sin pasar por `nextUtility`/colocación: así es la misma oferta exacta (no otro punto de la misma utilidad), lo que el rival percibe como "no me muevo", y la propiedad es trivial de comprobar. Con `fraction > 0` se pasa `fraction` como factor en lugar del de reciprocidad (mismo mecanismo que `nextUtility` ya tiene). Alternativa descartada: recolocar en la iso-curva al retener (concesión "gratis" integrativa): queda como pregunta abierta.

### 4. Liberación por plazo
Sin retención si `t ≥ releaseT` (por defecto `acTimeThreshold`, 0,9 en la campeona), `isLastMove` o `defaultHorizonReached`. Al liberar, `nextUtility` salta del valor retenido al objetivo Boulware: la concesión se concentra al final, que es el comportamiento Boulware buscado. La aceptación no cambia: AC_time, `last-move` y `default-horizon` siguen igual, y con retención AC_next compara con la oferta retenida (lo que enviaríamos de verdad).

### 5. Iso-utilidad: barrido de rejilla en 2 issues
`isoUtilityOffer(space, u, plain, rival)`: el issue libre es el de menos puntos de rejilla entre su límite de mandato y su mejor valor (pct: ≤ 1001 puntos); para cada valor `a` se busca el menor `b` en rejilla del otro issue con `u(a, b) ≥ u` (búsqueda binaria sobre la rejilla en lugar de forma cerrada, válida para cualquier utilidad monótona por issue), se descarta si cruza el mandato o si `u(a, b) > u + δ`. Puntuación: distancia normalizada a la oferta actual del rival (`closest-to-rival-last`) o `Σ ŵᵢ (1 − normᵢ(x))` con `estimatedWeights` (`opponent-model`, solo con `confidence > 0`). Determinista, sin RNG; coste ≈ 1001 · log₂(6001) evaluaciones, muy por debajo del presupuesto de turno. Después pasa por `enforceOfferGuardrails` (si queda por encima de nuestra última utilidad por `δ`, se repite la anterior). La monotonía es en NUESTRA utilidad: un issue puede moverse en contra del rival entre turnos (p. ej. menos día y más pct).

### 6. `UtilitySpace`
```ts
interface UtilitySpace {
  issues: readonly Issue[];
  utility(offer: Offer): number;
  withinMandate(offer: Offer): boolean;
  roundInFavor(offer: Offer): Offer;
  gridStep(issue: Issue): number;
}
```
`linearSpace(issues, mandate)` envuelve `utility`, `withinOfferMandate` y `roundInFavor` de `issues.ts`. `causa-prima-arena` añade la unidad `apr` con su utilidad y su guardarraíl; su `UtilitySpace` TAE se enchufa sin tocar la búsqueda (tareas `[aplazada: tras causa-prima-arena]`).

### 7. Explicación
`explain.offerRule` es un código cerrado, sin cifras; se añade a `ExplainSchema` (`engine.ts:59-72`, `.strict()`) como opcional y solo se rellena si alguna opción está encendida, para que con las opciones apagadas el JSON sea idéntico. La redacción ya cubre todo `explain` (`src/pipeline/otel.ts:6`, `src/pipeline/log.ts:19-20`). El visor muestra el código en el panel de la ronda.

### 8. Medición
- Candidatas en `config/baselines/`: `nfc.json` (campeona + `noFreeConcession` por defecto), `nfc-f25.json` (`fraction 0,25`), `iso-closest.json`, `iso-model.json`, `nfc-iso.json`.
- `pnpm promote <candidata> --dry-run` sobre los escenarios estructurados y `pct-day-*`, rivales `boulware`, `conceder`, `tit-for-tat` (y el bot Causa-Prima-engine y los escenarios `apr` cuando `causa-prima-arena` esté en main).
- Métricas por candidata frente a la campeona: diferencia media de excedente capturado (pp, pareada), tasa de acuerdo, violaciones y fugas (0), excedente por clúster escenario × rival (objetivo: `pct-day-buyer-wide` × `boulware` desde 8,5 % y × `tit-for-tat` desde ~15 %), histograma de la regla de aceptación (para saber si el 8,5 % lo decide AC_time: si es así, la palanca es `acTimeThreshold`, no esta regla) y, para iso, la utilidad nuestra media del acuerdo.
- **Aviso sobre iso**: `surplusShare` (`src/arena/metrics.ts:44-58`) pondera por el ancho de la ZOPA de cada issue, no por el rango: su relación marginal día/pct (0,057) difiere de la de la utilidad (0,071), así que moverse por nuestra iso-curva cambia `surplusShare` sin cambiar ninguna utilidad. Una mejora de iso solo cuenta si también mejora (o no empeora) la utilidad nuestra del acuerdo y la tasa de acuerdo, y su beneficio integrativo solo se puede ver con un rival de pesos distintos (pregunta abierta 1).
- **Cambio de valores por defecto**: la puerta completa (efecto ≥ 1 pp y significativo en ajuste y revalidación con semillas nuevas, ≥ 0 en reservadas, 0 violaciones, 0 fugas) y además: tasa de acuerdo global sin caer más de 2 pp y ningún clúster `price-*-narrow*` con caída de acuerdo > 5 pp.

## Risks / Trade-offs

- Retención mutua contra `tit-for-tat` → menos acuerdos; se ve en la tasa de acuerdo por clúster y se mitiga con `releaseT` y `fraction`.
- Iso-utilidad que "gana" la puerta solo por el sesgo de `surplusShare` → exigida la utilidad del acuerdo como métrica de control.
- `rivalOfferedThisTurn` mal fijado (siempre `true`) → concesión por una mejora de un turno anterior; test del pipeline con turno de solo texto.

## Migration Plan

Aditivo: claves opcionales; `config/champion.json`, doradas y trazas existentes sin cambios. Rollback = quitar la clave de la candidata.

## Open Questions

1. ¿Añadimos a la arena pesos distintos por rol (p. ej. `weightsByRole` en el escenario) para medir el beneficio integrativo? Por defecto: sí, como tarea `[aplazada: sábado]` con su delta de `arena`.
2. ¿Al retener, recolocamos en la iso-curva hacia el rival (misma utilidad nuestra) en vez de repetir literalmente? Por defecto: no, repetición literal.
3. ¿Monotonía por issue además de en utilidad (que ningún issue retroceda frente al rival)? Por defecto: no.
4. ¿`releaseT` por defecto `acTimeThreshold` o un valor propio (0,8)? Por defecto: `acTimeThreshold`.
5. ¿Día de pago en enteros (rejilla por issue)? Por defecto: fuera de alcance, sigue a 0,01.
