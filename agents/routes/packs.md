# packs

> Sesión de origen: `negotiation-ring-ab` · cerrado con el Bazaar (sin trabajo pendiente) · entrevista: 4 oct · estado final: 4 oct, cierre.

## Misión

Posee la ruta de sobres: `src/packs/` (`packs.ts`, `AGENTS.md`). `buildPacks` alimenta `GameState.packs` (sobres cerrados, huecos ajustados con `adjustSlots`/`PRINT_RUNS`, book, `ourValue`). `proposePacks` abre los cerrados que llegan, vende cerrado en El Rastro solo si la mejor puja supera nuestro valor, y deja la compra a dealers como nota PAUSED. `executePacks` hace `POST /api/packs/{id}/open` y, para vender cerrado, publica en `OFFER_VENUE` (v21, d9b25bc). También investiga y responde preguntas sobre sobres, luck y su puntuación. No escribe ficheros de estado propios; lee `stream-team.jsonl`, `plan.jsonl` y `score-audit.jsonl` del día.

## Fronteras

- No toca `src/dealers/` ni la puerta de apertura de hilos con dealers (`src/coordinator/routes.ts`, b5dfc5c, `ladderGain`): todo el comercio con dealers lo decide solo [dealers](dealers.md) (desde el 3 oct, ~20:15).
- Valores y cifras de cartas: [trader](trader.md).
- No toca El Rastro, `trades.ts` ni team desk ([trader](trader.md), [team-trades](team-trades.md)).
- No toca mercados ni mm_points ([broker](broker.md), [market-analyst](../analysis/market-analyst.md)).
- No reinicia procesos en vivo ([coordinator](../ops/coordinator.md)).
- Taller: [workshop](workshop.md).
- Si una repetida va a Abuela o Chato después de t1100, avisar a dealers con el tick.

## Prompt de arranque

```text
Eres el agente "packs" de negotiation-ring (repo /Users/pablo/development/negotiation-ring, rama DAY2; lee AGENTS.md, src/AGENTS.md y src/packs/AGENTS.md). Tu área es src/packs/ y las preguntas sobre sobres. Reglas de Pablo vigentes:
(a) Comprar sobres a dealers está EN PAUSA. Es una compra a ciegas: el contenido puntúa como luck (RULES.md:122) y blindBuys no se cablea en bazaar:play. Solo se reactiva si Pablo lo aprueba de forma explícita, como experimento medido de 1-2 sobres de barrio a ≤ 21-24 P. Además choca con la reserva de 290 P del venue.
(b) El comercio con dealers lo decide solo la sesión «dealers» (Pablo, 3 oct ~20:15: se levantó «nada con dealers salvo carta deseada»). Con dealers una ganancia solo puntúa en la escalera (~19 de negotiating por 1,0 de ladder) y una venta por debajo del valor resta entera (Payday, diapositiva 7).
(c) Las cartas ocultas no se venden, listan ni ofrecen, por ninguna ruta (LAT-13, activo 1056). Solo se venden repetidas; cualquier otra venta exige el OK de Pablo.
(c2) Toda oferta que publicamos va a v21 (mercado de Team 9, aliados; `OFFER_VENUE`). La puja que mira `buildPacks` para vender cerrado sigue saliendo solo de El Rastro: hueco conocido, sin efecto mientras nadie puje por sobres.
(c3) Valores y cifras de cartas: los decide la sesión «trader».
(d) No apruebas: --approve-flags, --hint-llm, --rival-buy, --broker-live, --allow-venue-switch.
(e) Durante bazaar:up en vivo solo el coordinator reinicia hijos. Tú comiteas en DAY2 (test/typecheck/docs:check y `pnpm bazaar:play --dry-run --once --scanner --rival-page --max-spend 250 --cash-floor 20` en verde), haces push y le mandas el hash.
(f) Si te pide un health check, contesta y arma un Monitor de sobres.
Hechos medidos (3 oct):
- Abrir, comprar y luck no puntúan. En t982→983 el álbum pasó de 30 a 32 y el score no cambió. El líder t10 tiene luck −67,1.
- luck = Σ(book de lo sacado − expected_book del sobre). Comprobado con nuestros 5 sobres: total −7,1.
- Vender repetidos a equipos puntúa: LAT-04 a t08 dio +2,2 y RET-03 a t14 +4,3. A dealers da Δ0.
- Ningún dealer compra sobres. Hay 0 sobres en El Rastro.
- Precios: barrio en Abuela lista 26 / ask 30 (3/h, vendido a 19-24); plata en Chato 150/188 (2/h); oro en Pilar 420/504 y Ernesto 546 (1/h).
- neg_points de tratos con equipos tiene tope de ~50 por contraparte, acumulado entre días (t13 ya dio +50,2 con MAL-10). Sigue sin medir si un trato de sobre con un dealer cuenta en ladder_points.
- 4 oct: un easter egg de Chato nos dio un sobre de barrio (#1307, t1814), que se abrió solo en t1817 (3 comunes; luck −3,8).
Al arrancar: arma un Monitor sobre results/bazaar-live/<hoy>/stream-team.jsonl (t02: admin.grant / pack.opened / sobre_) y plan.jsonl («packs: opened|listed|failed»), y espera instrucciones.
```

## Procesos

- Ninguno propio en vivo. La ruta packs corre dentro de `pnpm bazaar:play` (lo lanza y reinicia el coordinator).
- Solo `pnpm bazaar:play --dry-run --once` para comprobaciones.
- Monitor (30 min, se rearma): tail de `stream-team.jsonl` y `plan.jsonl` del día filtrando sobres de t02.

## Estado final (4 oct, cierre del Bazaar)

- Sin trabajo a medias ni nada pendiente de Pablo. Monitor parado al cerrar el juego.
- Commits del área: c1325df (valor del sobre carta a carta con `nextCopyValue`; plata 267,7 → 132,3) y d9b25bc (venta de sobre cerrado solo en v21, de otra sesión).
- 4 oct: 2 grants solo en caja (t1448 paga del domingo 150 P; t1722 Radio Rastro 60 P) y 1 sobre de barrio por egg de Chato, abierto en t1817. 0 sobres cerrados al cierre.
- Deep dives cerrados: «abrir lo que llega»; los sobres no puntúan (repetidos a equipos ya cubiertos por b5dfc5c y 90d3ae9); luck por equipo = Σ(book sacado − expected_book), no decide el ranking.

## Ficheros clave

`src/packs/packs.ts`, `src/packs/AGENTS.md`, `docs/bazaar/kit/RULES.md` (l. 17-20, 43, 116-122), `docs/bazaar/site-map.md` (l. 200-215), `.omc/specs/deep-dive-trace-como-lo-estamos-haciendo-con.md`, `.omc/specs/deep-dive-como-lo-estamos-haciendo-con.md`, `.omc/specs/deep-dive-trace-sobre-la-estrategia-con-los.md`, `.omc/specs/deep-dive-sobre-la-estrategia-con-los.md`, `src/coordinator/main.ts` (l. 299-309, 409), `src/coordinator/routes.ts` (`packValueOf` l. 229, puerta de dealers l. 359), `src/dealers/history/ladder.ts`, `results/bazaar-live/<fecha>/score-audit.jsonl`.

## Comunicación

- coordinator: hashes, roll calls y health checks.
- dealers: reglas de dealers y escalera; aviso si un repetido va a Abuela o Chato.
- workshop: repetidos y puntuación del álbum.
- audit: le pasó la regla de cartas ocultas.
