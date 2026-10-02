# src/bazaar/sim/ — Abuela Carmen simulada (offline)

Simulador de dealers del Bazaar guiado por sus rasgos, y un arnés que enfrenta nuestro negociador (`decide`, sin cambios) y el "starter_agent.py" del kit contra él. Sirve para ajustar el agente antes de jugar en vivo. **Nunca habla con el servidor**: todo es local y determinista por semilla.

## Archivos

- **`model.ts`** — `DealerProfileSchema` (ficha de `GET /api/dealers/{id}`), `loadDealerProfile` (por defecto la ficha real guardada en [`test/fixtures/bazaar/dealer-abuela.json`](../../../test/fixtures/bazaar/dealer-abuela.json)), `deriveParams` (rasgos → `SimParams`, cada campo documentado REAL o ASSUMPTION), `menuItems` y `limitFor`.
- **`mood.ts`** — `classifyTone`: palabras clave → amable, rudo, inyección. Nunca lee cifras.
- **`dealer.ts`** — `DealerSim`: hilos con la misma forma que la API (mensajes con `price`, `standing_offers` con `final`, estado `open`/`deal`/`walked`/"cooloff"/"closed" y `closed_reason`), un mensaje por hilo y tick, una aceptación por tick, cuotas por hora y libro de tratos (`deals`, con `atOpening`, `counts` y `share`). `secret` expone el límite y la paciencia solo para tests y métricas.
- **`api.ts`** — `SimApi`: el simulador detrás de `BazaarApi` (la interfaz que usa `BazaarAgent`); cada respuesta pasa por los esquemas Zod reales.
- **`policies.ts`** — `oursPolicy` (mismas llamadas que el bucle del agente: `threadPrices` → `decide` → plantillas) y `naivePolicy` (pasos de +2 P del starter).
- **`harness.ts`** — `runEpisode`, `runGrid`, `stats`, `summarize`, `formatTable`; escenarios en `ABUELA_SCENARIOS`.
- **`sim-main.ts`** — CLI `pnpm bazaar:sim`.

## Uso

```bash
pnpm bazaar:sim                                   # 200 semillas × 5 suelos × 5 artículos × 2 políticas
pnpm bazaar:sim --seeds 50 --floors 0.2,0.3       # más rápido
pnpm bazaar:sim --ours sellAnchorMult=2.5         # probar parámetros del negociador
pnpm bazaar:sim --sim reciprocity=0.6,patienceScale=6 --no-write
```

Flags: `--seeds`, `--floors`, `--dealer` (otra ficha JSON), `--scenarios` (lista de nombres), `--ours` y `--sim` (`k=v,...` sobre `NegotiatorParams` y `SimParams`), `--max-ticks`, `--out`, `--no-write`. Escribe `results/bazaar-sim/<timestamp>/summary.json` (parámetros usados y tablas por artículo, por suelo y total).

Columnas: `deal%`; `share/deal` = parte media del tramo apertura→límite capturada en los tratos que cuentan; `share/all` = lo mismo con 0 para episodios sin trato; rondas y ticks medianos; `@open%` = tratos a su precio de apertura (no cuentan en la escalera; el nuestro debe ser 0); `final%` y `final taken%`; `walk%`, `closed%` (cerramos nosotros), `cooloff%`.

## El modelo

Un hilo tiene apertura *O* y límite secreto *L* (suelo cuando ella vende, techo cuando compra). Con cada mensaje nuestro con precio:

1. **Reciprocidad.** Nuestro paso = mejora de nuestro precio frente al mejor que ya dimos. Paso ≤ 0 (repetir o retroceder) → no se mueve. Si no, su paso = redondeo estocástico de `min(paso × r, maxStepFrac × |O − L|)`; con nuestro primer precio concede `firstMoveFrac × |O − L|`. Nunca cruza *L*.
2. **Acepta nuestro precio** si queda a menos de `acceptGapFrac × |O − L|` de su nuevo precio y respeta *L*.
3. **Paciencia.** Cada mensaje (con o sin precio) gasta una ronda. Al llegar a `patienceBase + patience × patienceScale` (± `patienceJitter`, más el efecto del tono) nombra una **oferta final** (`final: true`) que cierra `finalFrac` del hueco hasta *L*. Cualquier mensaje después → `walked`.
4. **Tono.** Amable: + rondas y + reciprocidad (con tope). Rudo: − rondas y − reciprocidad, escalado por strictness. Inyección: − rondas y, con probabilidad `injectionCooloffProb`, "cooloff" con `until_tick`; nunca entra en el cálculo de precios (flujos aleatorios separados). Al acabar un hilo, el recuento pasa al siguiente multiplicado por memory.
5. **Cuotas.** Abrir con `deals_per_team_per_hour` tratos en la hora, o con `per_team_per_hour` sobres → "persona_quota".
6. **Charlatanería.** Solo el número de frases de relleno; la única cifra del texto es el precio.

Escala de la escalera: `share = (O − precio) / (O − L)` al comprar, `(precio − O) / (L − O)` al vender; 0 si el precio es su apertura (o peor).

### REAL vs ASSUMPTION

| Parámetro | Origen | Valor para Abuela |
|---|---|---|
| Rasgos (patience 0,85, generosity 0,8, shrewdness 0,2, memory 0,15, strictness 0,1, chattiness 0,75) | REAL (`/api/dealers/abuela`) | — |
| Sobre: list 26, apertura 30, 3 por hora; comunes list 10, infrecuentes list 25; 8 tratos por hora | REAL (menú) | — |
| Solo se mueve si nos movemos; repetir no gana nada; pasos pequeños → pasos pequeños; final y luego se va; un límite secreto por hilo; cooloff con `until_tick`; trato a la apertura no cuenta | REAL (RULES.md), forma exacta ASSUMPTION | — |
| Apertura sin `opening_ask` = list × `openingMarkup` | ASSUMPTION (30/26) | 1,15 → común 12, infrecuente 29 |
| Suelo = list × (1 − f), f = `floorFrac` × (1 ± `floorJitter`) | ASSUMPTION; f barrido 0,15–0,35 | 0,26 ± 20 % |
| Al comprar: puja inicial list × `buyOpenFrac`, techo list × (1 − f) × `buyMargin` (list de su venta de la misma rareza) | ASSUMPTION (`buys` no trae precio) | 0,40 y 0,8 |
| `reciprocity` = 0,5 + 0,4 × generosity − 0,3 × shrewdness | ASSUMPTION | 0,76 |
| `firstMoveFrac`, `maxStepFrac`, `acceptGapFrac` | ASSUMPTION | 0,09; 0,25; 0,08 |
| Rondas = 2 + 9 × patience (± 1) | ASSUMPTION | ≈ 10 (8–11) |
| `finalFrac` = 0,5 × generosity | ASSUMPTION | 0,4 |
| Tono: amable +0,5 rondas (tope 2) y +0,03 r (tope 0,1); rudo −1,2 rondas y −0,06 r; inyección cooloff 0,5 × strictness, 8 ticks | ASSUMPTION ("Abuela likes kindness" es REAL) | — |
| Cuota excedida al abrir → error "persona_quota" | ASSUMPTION (el código es REAL; si llega como error o como hilo cerrado, no) | — |
| `closed_reason` `walked` y "closed_by_team" | ASSUMPTION (nombres no documentados) | — |
| Los tratos se liquidan en el acto | ASSUMPTION (en vivo, al tick siguiente) | — |

**Lo que el modelo no tiene** (y puede sesgar el ajuste): castigo por anclas insultantes (hoy un ancla más extrema solo cuesta rondas), spam por repetir las mismas palabras, mentiras del dealer, stock por rareza ("sold_out"), memoria de precios entre hilos.

## Recalibrar con trazas en vivo

`pnpm bazaar` escribe `results/bazaar-live/<fecha>/decisions.jsonl` y `thread-<id>.jsonl` (tick, su precio, el nuestro, `final`, estado y `closed_reason`). De ahí:

- **Apertura y `openingMarkup`/`buyOpenFrac`**: primer precio de ella por artículo.
- **`reciprocity`**: regresión de su paso sobre nuestro paso (pares de mensajes consecutivos con paso > 0); comprobar que un paso repetido da 0.
- **`patienceBase`/`patienceScale`**: ronda en la que aparece `final: true`, por hilo.
- **`finalFrac` y el suelo**: el precio final acota el límite por abajo (al vender) o por arriba (al comprar); la cota más baja vista entre hilos da `floorFrac` mínimo.
- **Tono**: repetir hilos con plantillas neutras frente a amables y comparar rondas hasta la final.

Después: `pnpm bazaar:sim --sim reciprocity=...,patienceScale=...,floorFrac=...` y comparar con la tabla anterior.

**TODO (calibración):** script `pnpm bazaar:calibrate` que lea `results/bazaar-live/*/thread-*.jsonl`, estime los parámetros de arriba (con intervalo) y escriba un JSON de overrides que `--sim` pueda cargar. Aún no existe; hace falta antes un puñado de hilos reales.

## Links

- ↑ [`src/bazaar/`](../AGENTS.md)
- → [`test/bazaar/`](../../../test/bazaar/) — [`test/bazaar/sim-dealer.test.ts`](../../../test/bazaar/sim-dealer.test.ts) (mecánicas) y [`test/bazaar/sim-harness.test.ts`](../../../test/bazaar/sim-harness.test.ts) (arnés)
