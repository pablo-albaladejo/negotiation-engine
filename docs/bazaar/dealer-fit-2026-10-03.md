# Ajuste offline de Abuela y El Chato (3 oct 2026)

Análisis de solo lectura con **nuestros hilos más el feed público** (Abuela 29 conversaciones, 78 cifras; Chato 13, 47 cifras), mucho más fiable que el ajuste dentro del código, que solo vio 9 y 1 hilos nuestros. Solo cifras estructuradas (ofertas y precios de trato); del texto del dealer no sale ninguna cifra. Son estimaciones del lado del dealer: no hay valores privados nuestros. El método es rejilla con el redondeo entero exacto (L1 en P) y restricciones duras (`final` = límite redondeado; si acepta x, L ≤ x al vender y L ≥ x al comprar). Las estimaciones alimentan los priors de [`persona-fit.ts`](../../src/dealers/history/persona-fit.ts). Contexto del modelo: [`personas.md`](personas.md) § 3.

Ventana del feed: solo los ticks 143–159 (la API no da más atrás); la hora 1 solo se ve en nuestros hilos.

## Parámetros de persona

| Parámetro | Abuela (nivel 1) | El Chato (nivel 2) |
|---|---|---|
| opening_markup | **0,135** [0,122, 0,152], igual al comprar y al vender | **0,25** al vender [0,252, 0,255]; ~0,14 implícito al comprar |
| β | **3** [2,5, 3,5]: concede pronto (~60 % en la ronda 1, luego 1 P por ronda) | **0,35** [0,3, 0,4]: boulware (1–2 rondas en la apertura) |
| max_rounds | 6 [5, 7] | 5–6 |
| mirror | no identificable (la curva ya lo explica) | **sí**: hilo 298, el equipo sube +4 y él baja 4, 4, 4; hilo 286, +2 → 2, 2, 2, 2 |
| accept_margin | ≈ 0,02 (cota alta 0,035; rechazó 24 frente a su 25) | no identificable (ninguna aceptación suya) |
| walk_after_rounds | 5–6 (`final` en r = 4, 5, 6) | ≈ 7 [6, 8] |
| patience_jitter | ≥ 2 | ≥ 1 |
| limit_jitter | ≈ 0,05 [0,015, ~0,10] | ≈ 0,05 [0,018, ~0,10] |
| welcome_first_deal | **sí**: compró una común a 13 = 1,3 × book (`welcome_price_frac` ≈ 0,7) | probablemente no (su bienvenida es un sobre) |
| demand_markup, politeness_discount | no identificables | no identificables |

## Bandas (límite efectivo)

| Dealer · banda | book | Apertura (P) | Límite medio [lo, hi] (P) | frac del book [lo, hi] | n |
|---|---|---|---|---|---|
| Abuela vende barrio | 26 (list) | 29,05–29,95 | 19,6 [18,1, 21,0] | 0,75 [0,70, 0,81] | 2 |
| Abuela vende común | 10 | 11,05–11,95 | 8,6 [7,0, 10,0] | 0,86 [0,70, 1,00] | 5 |
| Abuela vende poco común | 25 | 28,05–28,95 | 21,6 [18,5, 24,8] | 0,86 [0,74, 0,99] | 4 |
| Abuela compra común | 10 | 5,0–5,8 | 5,8 [5,0, 6,9] | 0,58 [0,50, 0,69] | 6 |
| Abuela compra poco común | 25 | 12,0–12,9 | 14,6 [13,1, 16,0] | 0,58 [0,52, 0,64] | 2 |
| Chato compra poco común | 25 | 13,0–13,7 | 15,3 [13,0, 16,9] | 0,61 [0,52, 0,68] | 3 |
| Chato vende rara | 70 | 96,1–96,6 | 77 [66, 87] | 1,10 [0,94, 1,24] | 3 |
| Chato vende sobre de plata | 150 (list) | 187,8–189,3 | 169,5 [165,5, 173,5] | 1,13 [1,10, 1,16] | 1 |
| Chato vende poco común | 25 | 29–33 | 28,6 [28,1, 29,0] | 1,14 [1,12, 1,16] | 1 |

Chato no vende nunca por debajo de la lista (suelo ≈ 1,1 × book). Con `expected_book` (barrio 33,8; plata 160,8) las fracciones bajan (0,58 y 1,05) sin cambiar la curva.

## Error de predicción (dejando una conversación fuera)

| | Predicciones | MAE (P/ronda) | Exacta | ≤ 1 P | Repetir la última cifra (MAE) |
|---|---|---|---|---|---|
| Abuela | 56 (19 conv.) | **0,32** [0,13, 0,57] | 79 % | 95 % | 0,68 |
| Chato | 31 (10 conv.) | **0,29** [0,10, 0,52] | 77 % | 94 % | 0,97 |

El error se concentra en la ronda 1 de Abuela (0,75; el barrio llega a 5 P en un hilo entrenado solo con parciales) y en las rondas 2–3 de Chato.

## Qué no se puede identificar

- Abuela: espejo (la curva sola explica que su paso nunca supere el nuestro; haría falta un equipo que ceda menos que la curva en r = 1–2), cota baja de `accept_margin`, cota alta de `patience_jitter`, los 5 escalones del límite (se confunden con `limit_jitter`; nuestra secuencia sugiere un ciclo de 5, no probado), `demand_markup` (el barrio sube de 19 a 21 en la hora 2: demanda o jitter, n = 2) y `politeness_discount`.
- Chato: `accept_margin`, `demand_markup` y `politeness_discount`; ventas de poco común y plata con una sola muestra.
- Ambos: n de 1–6 conversaciones por banda y paciencia casi siempre censurada.

## Sorpresas

1. **La bienvenida de Abuela es muy generosa:** 13 P por una común (≈ 2,2 × su techo normal de ~5,8). La primera conversación con un dealer nuevo debería ser **venderle** algo.
2. **Asimetría de Abuela:** compra comunes a ~0,58 × book y las vende a ~0,86 × book; el barrio, a 0,75 × lista.
3. **El espejo de Chato es real:** su «1 P por mensaje» frente a nuestros pasos de 1 P era eco. Si damos pasos grandes, cede pasos grandes, hasta su curva.
4. **Anomalía abierta, la apertura de compra de Chato:** abre en 13 con techos de 15–16; con markup 0,25 haría falta un techo de 17,3–18,3. O su markup de compra es ~0,14, o el techo base es ~18 y los dos `final` vistos cayeron en escalones negativos. Es lo único que contradice el modelo del frontend.
5. **Hilo 294 (Chato):** respondió sin oferta tras pedirle 13 (igual que su puja): retirada en r = 4 sin `final`, o presupuesto de compra de la hora agotado. No encaja con `walk_after_rounds` ≈ 7.
6. **Hilo 290 (plata):** cerró en 181 con un límite estimado de 165–174: aceptamos demasiado pronto.
7. **Regalos de Abuela:** 21 en el día, sin efecto visible en los precios. Chato no regala (sus «welcome» son el sobre).

## Lectura práctica

- Abuela: contraofertas pequeñas; cede ~60 % en la ronda 1 y después 1 P por ronda hasta el suelo hacia r = 5.
- Chato: pasos grandes y constantes (el espejo los copia) y paciencia; no se mueve hasta r ≈ 2–3.

## Links

- ↑ [`docs/bazaar/`](AGENTS.md)
