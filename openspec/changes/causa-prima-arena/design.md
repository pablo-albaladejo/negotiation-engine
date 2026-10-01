# Design: causa-prima-arena

## Context

Ver proposal.md. Motor actual: utilidad lineal aditiva por issue y mandato por issue (`src/engine/issues.ts`, `guardrails.ts`). El pipeline repite guardarraíles y aceptabilidad antes de enviar (`src/pipeline/pipeline.ts#checkDecision`). La arena valida las salidas con `createProtocolSchemas` y hoy registra un fallo de esquema como `rival-error`/`agent-error` (`src/arena/runner.ts`).

## Decisions

### D1. Conversión pct/día ↔ TAE
Oferta "pct % de descuento por pagar el día `day`" frente al plazo original `baseDays` (net 30/60). Quien paga antes adelanta `100 − pct` para ahorrarse `pct` durante `baseDays − day` días:

`TAE(pct, day) = pct/(100 − pct) × 365/(baseDays − day) × 100`

Es la fórmula estándar de coste anual de un descuento por pronto pago (2/10 net 30 → 37,24 %): rendimiento sobre el importe realmente adelantado, anualizado de forma simple (sin capitalizar, como lo cotiza el sector y lo muestra la UI). Inversa a día fijo: `k = TAE/100 × (baseDays − day)/365`, `pct = 100·k/(1 + k)`. Crece con `pct` y con `day`: el comprador (cobra el descuento) quiere TAE alta y el vendedor baja, igual que la dirección `higher-better` de pct y day ya declarada desde el comprador. Se exige `day.max < baseDays` y `pct.max < 100`.

### D2. Motor en TAE por reducción a un issue
Con `mandate.apr`, `decide` delega en `decideApr`: construye un issue sintético `apr ∈ [min, max]` con la banda, reserva en el borde desfavorable, convierte nuestras ofertas y las del rival a TAE y llama al mismo `decide` lineal. La TAE decidida se traduce a `{ pct, day }` en el día de referencia del mandato (el día de su reserva por issue), con `pct` redondeado a 2 decimales hacia dentro de la banda, y pasa por `enforceAprGuardrails` (banda + monotonía en TAE). Así Boulware, aceptación y modelo del rival no cambian, y sin `apr` el camino es exactamente el anterior. Una aceptación de una oferta fuera de la banda (mejor que nuestro ancla) se sustituye por repetir nuestra última oferta: la banda es límite duro por ambos lados.

### D3. Despacho en el pipeline
`offerGuardrails` y `acceptable` (en `src/engine/apr.ts`) eligen guardarraíl TAE o por issue según `mandate.apr`; el pipeline los usa donde antes llamaba a `enforceOfferGuardrails` y `acceptableForUs`. La reserva por issue del escenario apr es la esquina (pct, día de referencia) dentro de la banda, así los bots lineales existentes tampoco cruzan su TAE.

### D4. Bot causa-prima-engine
Valor propio `v` = TAE (con `apr`) o utilidad lineal; ancla = extremo favorable de su banda (`v = 1` en lineal), reserva = el otro extremo. La k-ésima oferta está en `ancla − schedule[k]·(ancla − reserva)` (por defecto `[0, .15, .3, .45, .6, .75, .9, 1]`), recomprobada contra el mandato antes de enviar. Acepta si la oferta del rival está dentro de la banda; `no_convergence` si la distancia (en `v`) no baja en 3 rondas seguidas; `round_limit` al pasar su límite.

### D5. Violación de protocolo
`protocol_violation` (literal pedido; el resto del enum usa guion): fallo del esquema canónico, `sessionId` distinto o `round` distinto del turno. Errores de red o de tiempo siguen siendo `*-error`. Valor 0 para ambos (sin penalización: no hay base para calibrarla). Cuenta en la tasa de acuerdo como no acuerdo.

### D6. Opt-in
`optIn: true` en escenarios y un registro `OPT_IN_BOTS` separado de `BOTS`: la ejecución por defecto, la promoción y el ajuste no los ven salvo que se pidan por nombre.

## Risks

- La forma real del motor de Causa Prima es inferida; el bot es una aproximación.
- Fijar el día de referencia deja sin negociar la dimensión día en nuestro agente apr (aceptamos cualquier día si la TAE entra en banda).
