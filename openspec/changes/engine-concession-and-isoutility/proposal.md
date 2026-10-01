complexity: high

# Proposal: sin concesión gratis e iso-utilidad (engine-concession-and-isoutility)

## Why

El documento de algoritmo del equipo pide dos cosas que el motor no hace:

1. **"Si no hay oferta nueva, repetimos la nuestra (no conceder gratis)".** Hoy `decide` (`src/engine/engine.ts:142-149`) llama a `generateOffer` en cada turno con el `t` del reloj, y `nextUtility` (`src/engine/offer.ts:57-65`) baja nuestra utilidad hasta el objetivo Boulware sin mirar al rival. Lo único que depende del rival es el factor de reciprocidad (`offer.ts:34-38`, aplicado en `engine.ts:137-141`), que está apagado en la campeona (`config/champion.json` no tiene `reciprocity`). Los guardarraíles (`src/engine/guardrails.ts:64-66`) solo impiden subir nuestra utilidad, no impiden bajarla. Resultado: si el rival repite su oferta, manda solo palabras o cifras sin confirmar, concedemos igual.
2. **"Elegir el (%, día) que prefiere el rival con la misma utilidad para nosotros".** Hoy la oferta de utilidad objetivo `u` la coloca `offerAboveReservation` (`offer.ts:71-79`): cada issue se interpola entre su nivel de reserva y 1 con el mismo λ (`ℓᵢ = rᵢ + λ(1 − rᵢ)`), y luego `roundInFavor` (`src/engine/issues.ts:73-85`) redondea cada issue a 0,01 a nuestro favor. Es un punto fijo de la curva de iso-utilidad que depende solo de nuestra reserva: nunca del rival.

Punto débil conocido: de comprador contra `boulware` en `pct-day-buyer-wide` capturamos un 8,5 % del excedente, y en torno al 15 % contra `tit-for-tat`.

## What Changes

- **`noFreeConcession`** (opcional; ausente = apagada): si en este turno el rival no hizo una oferta nueva (no hay oferta, o es igual, o no mejora nuestra utilidad en más de `epsilon` respecto a su mejor oferta anterior), repetimos literalmente nuestra última oferta (o concedemos solo la fracción `fraction` del paso Boulware). Se libera cerca del plazo (`t ≥ releaseT`, último movimiento, horizonte por defecto) para no acabar sin acuerdo cuando lo había.
- **Entrada nueva del motor** `state.rivalOfferedThisTurn` (la fija el pipeline): distingue "sin oferta este turno" de "repitió la misma".
- **`isoUtility`** (`off` | `closest-to-rival-last` | `opponent-model`; ausente = `off`): entre las ofertas de la rejilla con nuestra utilidad objetivo (redondeadas a nuestro favor y dentro del mandato), elige la más cercana a la última oferta del rival o la de mayor utilidad estimada para el rival según el modelo del rival. Se busca contra una función de utilidad abstracta (`UtilitySpace`) para que sirva con la utilidad lineal pct/día y con la utilidad TAE de `causa-prima-arena`.
- **`explain.offerRule`** (opcional, solo local y redactado como hoy): qué regla de colocación decidió la oferta (`held-no-new-offer`, `iso-utility-closest`, …).
- **Medición**: candidatas con y sin cada opción por el runner pareado y `pnpm promote --dry-run`; los valores por defecto de la campeona solo cambian si pasa la puerta (design.md, "Medición").

## Capabilities

### New Capabilities
- Ninguna.

### Modified Capabilities
- Ninguna en `openspec/specs/` (no existe todavía). Se añaden requisitos a `negotiation-engine` como delta `ADDED`; no modifica requisitos de `add-agent-architecture` ni de `add-arena-viewer`.

## Impact

- **Código**: `src/engine/engine.ts` (parámetros, entrada `rivalOfferedThisTurn`, regla de retención, `explain.offerRule`), `src/engine/offer.ts` (colocación de la oferta), nuevo `src/engine/iso-utility.ts` (búsqueda y `UtilitySpace` lineal), `src/engine/config.ts` (claves de configuración), `src/pipeline/pipeline.ts` (mapeo de parámetros y `rivalOfferedThisTurn`), `src/arena/cli.ts` y `src/arena/results-schema.ts` (parámetros en el resumen), `viewer/` (mostrar `offerRule`).
- **Configuración**: `config/champion.json` no cambia en este cambio; candidatas nuevas en `config/baselines/`.
- **Dependencia**: la búsqueda con utilidad TAE depende de `causa-prima-arena` (unidad de mandato `apr`); esas tareas llevan `[aplazada: tras causa-prima-arena]`.
- **Compatibilidad**: con ambas opciones ausentes las decisiones son idénticas byte a byte (doradas y fixtures).
