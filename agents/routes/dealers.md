# dealers

> Sesión de origen: `dealers` · Bazaar cerrado · estado final: 4 oct (cierre del día 2).

## Misión

Única dueña del comercio con dealers (Abuela, El Chato, Pilar, Pícaros y Don Ernesto/banco) y del detector de flags. Posee:

- `src/dealers/` (`negotiation/`, `planning/`, `history/`);
- `src/forex/` (detector de cadenas, compra apagada);
- `src/flags/`;
- las rutas de dealers en `src/coordinator/routes.ts` (`EGG_PARAMS`, ladder, `ownsThread`, `teamDemand`, `pastNoDeals`);
- la pata «compra a dealer» de la ruta CHA y las compras de álbum aprobadas (`ALBUM_BUYS`).

Alimenta `results/bazaar-live/<día>/`: `dealer-trades.json`, `forex.json`, `team-received.json`, `flags.json`, `thread-*.jsonl`, y `docs/bazaar/lessons.json`.

## Fronteras

- No reinicia procesos → [coordinator](../ops/coordinator.md) (hash + hijo).
- Cifras de ventas y compras entre equipos, El Rastro y la ruta CHA del lado equipo → [trader](trader.md).
- Preguntas y huevos a dealers → [eggs](eggs.md) (las frases de egg se coordinan con ellos).
- Objetivos y estrategia → [goals](../ops/goals.md): avisar de cada cambio.
- Duelos → [duels](duels.md). Visor → [ui](../ops/ui.md).
- No toca `src/markets/`, `src/trades/`, `src/duels/` ni `viewer/`.

## Prompt de arranque

```text
Eres la sesión "dealers" de negotiation-ring (rama DAY2, carpeta principal, sin ramas ni worktrees ni PR). Eres la ÚNICA dueña del comercio con dealers (src/dealers/, src/forex/, rutas de dealers de src/coordinator/routes.ts) y de los flags (src/flags/). Lee AGENTS.md, src/AGENTS.md, src/dealers/AGENTS.md, src/forex/AGENTS.md, src/flags/AGENTS.md y la memoria (MEMORY.md).

Reglas de Pablo además de AGENTS.md/memoria:
(1) Payday, diapositiva 7: un trato puntúa valor añadido − precio pagado + precio cobrado. Con un dealer, la ganancia solo cuenta en la ladder y la pérdida cuenta ENTERA. Así que nunca vendas a un dealer por debajo de your_value, y comprar a un dealer no suma neg.
(2) Solo se venden duplicados; la última copia necesita el OK de Pablo. Las cartas ocultas (LAT-13, asset 1056) nunca se venden.
(3) Una carta recibida de otro equipo hoy (team-received.json), o ofrecida o demandada por equipos (open offers con venue o to=tNN, intros.json ≤ 6 h), nunca se ofrece a un dealer (equipos primero).
(4) Forex: compra apagada (FOREX_AUTOMATED=false); se muestra, no se ejecuta. La cadena de ladder (épica Pícaros → banco) quedó RETIRADA: no reaplicarla.
(5) Don Ernesto: Pablo decidió no tratar con él (suelo ≈ 730 > valor de cualquier legendaria; RET-12 720). Revisar solo si una legendaria pasa de ~730 de your_value o cambia su menú.
(6) Ladder: una venta o compra NEGOCIADA con un dealer con hueco sí puntúa ladder (Pilar MAL-08 @19: +0,040; Pícaros CHA-09 @59: +0,045); la cerrada a su precio fijo de apertura (span 0) puntúa 0 con cualquier dealer. LADDER_UNVERIFIED está vacío (167df38: Pícaros salió). LADDER_SALES_UNSCORED=true sigue: sin bonus de ladder en ventas al arbitrar (propuesta de reactivarlo pendiente de OK del coordinator), y el descuento de ladder sobre el mínimo de venta queda en 0 siempre (pérdida con dealer = entera).
(7) Hilos: el agente de dealers solo continúa hilos abiertos por play (ownsThread lee "action":"open" en thread-<id>.jsonl); los demás → idle · rule foreign-thread.
(8) Tras 1 no-deal cuyo mejor precio nunca llegó a nuestro límite: 60 min de enfriamiento (HOPELESS_COOLDOWN_MS).
(9) Flags: no aprobar presión de Chato 2819. 10878/10965 (Pícaros) están bien puestos y su already_flagged al reiniciar es inofensivo; 4743 es un falso positivo conocido. Las frases de presión solo se envían con --approve-flags y OK de Pablo.
(10) Ruta CHA (aprobada por Pablo vía coordinator): a un equipo se le vende (a) un duplicado o (b) una carta recomprable a un dealer a ≤ nuestro valor. La puerta de venta es de TRADER en team-desk: dealerBuyQuotes no vacío y quote.hi ≤ floor(valor × safety), min(precio − valor, roomOf(equipo)) ≥ 20 y roomOf ≥ MIN_ROOM (src/markets/room.ts; el tope Payday es ~50 por contraparte, acumulado). Tu pata no tiene código propio: el planificador del álbum recompra la carta que falta a ≤ valor × safety. dealerBuyQuotes excluye a los dealers de CHA_REBUY_OFF (Pícaros) hasta que Pablo apruebe P2.
(12) Ningún dealer compra una carta para la que tenemos una puja abierta (ourBidRefs en src/shared/asset-locks.ts; si falla la lectura de ofertas, no compra: falla cerrado).
(13) ALBUM_BUYS (src/dealers/agent.ts): compras de álbum aprobadas por Pablo, fuera del tope horario, con su propio tope y suelo de caja; una por carta y solo si no la tenemos ni hay puja nuestra. La única entrada (CHA-09/10 a Pícaros, ≤ 70, caja ≥ 50) ya se cumplió: Chamberí 10/10. Una nueva entrada exige OK de Pablo vía coordinator.
(11) Egg de Chato a mitad de trato: GREETINGS[2] contiene la subcadena literal del egg (personas.md:233); no reescribirla.
Antes de cada commit: pnpm test, pnpm typecheck y pnpm docs:check en verde; push justo después (fetch y pull --rebase si el remoto avanzó; no hacer stash de .env.broker, que es de otra sesión). Nunca prettier --write. Coautoría: "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>". Las preguntas a Pablo, con investigación y recomendación. Vigila results/logs/<día>/play.log con un Monitor ([dealers] sin «idle · rule no-target», [flags], rate_limited, foreign-thread). Los foreign-thread suelen ser sondas a mano de eggs: confirmar con ellos, no tocar. El play.log arranca con --max-spend-hour 60 (por defecto): una compra a dealer con lista > 60 no tiene hueco salvo por ALBUM_BUYS o cambiando el flag con un up completo de Pablo.
```

## Procesos

- No lanza ninguno: sus rutas corren dentro de `pnpm bazaar:play` (en vivo, lanzado por `bazaar:up --live --confirm`), que reinicia solo el coordinator.
- Monitor sobre `play.log` (30 min, se rearma).

## Estado final (4 oct, cierre del Bazaar)

- Chamberí completa (10/10): CHA-09 @59 (hilo 3009) y CHA-10 @60 (hilo 3044) a Pícaros por `ALBUM_BUYS`; caja 130. La CHA-05 vendida a t05 @72 (+50 neg) se recompró a Abuela @10 (hilo 2569).
- Pilar: MAL-08 repetida vendida @19 (hilo 2689), ladder +0,040.
- Ladder al cierre: L1 abuela 3/3 · L3 pilar 1/3 · L4 pícaros 1/3 · L2 chato y L5 banco 0/3.
- Don Ernesto: sin tratos (decisión de Pablo). Forex: solo detector.
- Flags: sin nuevos; 10878/10965 ya denunciados.
- Pendiente (no urgente): bonus de ladder en ventas negociadas en el arbitraje (`LADDER_SALES_UNSCORED` → false solo para el bonus), propuesto al coordinator sin respuesta.
- Commits del día 2: 167df38 (Pícaros fuera de `LADDER_UNVERIFIED`), 5600408 (`ALBUM_BUYS`), 44f3f6b (`ourBidRefs`), ba0ca48 (`CHA_REBUY_OFF`), 095ad4d (`dealerBuyQuotes`), 5f26123 (enfriamiento hopeless), 17737e2 (equipos primero), 76dc0ce (foreign-thread), 203c5ef (frase del egg de Chato), 2013780 (forex apagado), 8b236d3 (dealShare span 0), 4faf36f (solo duplicados + team-received).

## Ficheros clave

`src/dealers/AGENTS.md`, `src/dealers/agent.ts` (`adoptOpenThread`, `notForDealers`, hopeless), `src/dealers/planning/plan.ts` (`rankCandidates`), `src/coordinator/routes.ts`, `src/forex/chains.ts`, `src/forex/ledger.ts`, `src/flags/flags.ts`, `src/shared/asset-locks.ts` (`teamOfferedAssets`, `ourBidRefs`), `src/markets/room.ts` (room por contraparte, de trader), `src/dealers/history/team-received.ts`, «The Bazaar - Payday.pdf» (diapositivas 7–8). Memorias: dealer-sale-below-value-costs, banco-sunday-plan, sell-only-duplicates, ladder-scoring-measured, hidden-cards-never-sold, payday-cap-per-counterparty, team-buy-high-value-scores.

## Comunicación

- coordinator: reinicios (hash + hijo); le pide chequeos de salud y aprobaciones de Pablo.
- trader: ruta CHA (puerta de venta en team-desk), room por contraparte, compras de álbum frente a pujas (avisar al cerrar cada carta).
- eggs: preguntas y huevos a dealers; perfil del banco.
- goals: cambios de estrategia.
