# src/dealers/history/ — Memoria de las conversaciones

Qué pasó en cada conversación con un dealer y qué aprendimos. Solo escribe trazas y `docs/bazaar/lessons.json`; nunca decide una cifra.

## Archivos

- **`thread-log.ts`** — `ThreadSummary` por conversación: cartas, recibidas, copias antes/después, tratos con ese dealer en la última hora, tick/ts, su lista, apertura y final, nuestros precios y los suyos, paciencia, resultado (no_progress cuenta como walked), valor creado a nuestro valor y, con `welcome-first-deal`, el límite medido (*measuredLimit*); `formatThreadSummary` imprime la línea SUMMARY.
- **`lessons.ts`** — `appendLesson` añade una entrada por conversación a `docs/bazaar/lessons.json` (schema bazaar-lessons/v1) sin reescribir las existentes (inserción en el texto, validada con JSON.parse, rename atómico); `deriveLessons` (límite medido en la primera conversación (*measured_limit*), no se movió, por debajo de su lista, repetida recibida, final tras N mensajes, valor negativo...); `PendingLessons` espera a que neg_points se mueva (o 5 ticks) para anotar neg_points_delta y ladder_points_after.
- **`persona-fit.ts`** — ajuste de la curva del dealer por PERSONA (personas.md § 3.3): `fitPersona` estima `opening_markup`, β, `max_rounds` y `walk_after_rounds` compartidos por todas sus conversaciones y bandas (mínimos cuadrados con el redondeo ceil/floor de lo que dice, priors del editor y, para Abuela y El Chato, los medidos offline con el feed público (`PERSONA_PRIORS`, [dealer-fit-2026-10-03](../../../docs/bazaar/dealer-fit-2026-10-03.md)): markup, β, max_rounds, walk, espejo de Chato, markup de compra aparte (opening_markup_buy) y límite por banda; pesan `priorWeight` seudo-observaciones y el ajuste en vivo parte de ahí y se mueve con cada dato), el espejo (`personaMirror`; con espejo, los pasos recortados por nuestro paso no entran en β) y solo el límite por banda y conversación (± limit_jitter): su final ES su límite de esa conversación; comprando ella, techo = apertura ÷ (1 − markup). Por banda (`sells:<rareza>` vende ella, `buys:<rareza>` compra ella): límite media/lo/hi, muestras, la más favorable y *fewSamples* (< 3: abrir más conversaciones, baja prioridad). `updatePosterior` suma las conversaciones del tick y reajusta; el posterior (observaciones y estimaciones con su historia) persiste en `results/bazaar-live/persona-posterior.json` (`loadPosterior`, `savePosterior`; solo GET, se guarda también en dry-run) para que una conversación nueva parta de lo aprendido. `offerCap`: nunca ofrecer más allá de su límite previsto más un margen (2 % del book, mínimo 1 P); solo estrecha la reserva de la oferta, la aceptación sigue con la reserva privada. Privado: nunca en un mensaje.

**Etiqueta `welcome: true`** en una observación de results/bazaar-live/persona-posterior.json: la primera conversación del equipo con esa persona (*welcome_first_deal*: su apertura es su límite y se queda plana; p. ej. hilo 56 con Abuela, 13 plana 7 rondas). `updatePosterior` marca como bienvenida la de menor id de cada persona que aún no tenga ninguna y la conserva. Esas conversaciones miden el límite de bienvenida (`estimates.welcome`: límite en P, fracción del book y `n`; con `n` 0 es el prior) pero quedan FUERA del ajuste de la curva (β, max_rounds, markups, espejo y bandas).

### Formas para el visor (estables, en inglés)

En cada `Conversation` con dealer, *prediction*; en cada `Persona`, *estimates*:

```
prediction: { herNext?, herLimit: { mean, lo, hi }, curve: [{ round, price, lo, hi }], walkRound: { mean, lo, hi }, mirror: true | false | "unknown", fittedFrom }
estimates: { opening_markup: { mean, lo, hi }, beta: { mean, lo, hi }, max_rounds: { mean, lo, hi }, accept_margin, walk_after_rounds: { mean, lo, hi },
             mirror: true | false | "unknown", bands: { "<sells|buys>:<rarity>": { limit: { mean, lo, hi }, samples, fewSamples, best } },
             fittedFrom, history: [{ tick, param, value }] }
```

## Links

- ↑ [`src/dealers/`](../AGENTS.md)
- → [`docs/`](../../../docs/AGENTS.md) — donde viven las lecciones
