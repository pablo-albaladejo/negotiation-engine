# dealers

> Sesión de origen: `dealers` · vivo · entrevista: 4 oct 10:05.

## Misión

Única dueña del comercio con dealers (Abuela, El Chato, Pilar, Pícaros y Don Ernesto/banco) y del detector de flags. Posee:

- `src/dealers/` (`negotiation/`, `planning/`, `history/`);
- `src/forex/` (detector de cadenas, compra apagada);
- `src/flags/`;
- las rutas de dealers en `src/coordinator/routes.ts` (`EGG_PARAMS`, ladder, `ownsThread`, `teamDemand`, `pastNoDeals`);
- la pata «compra a dealer» de la ruta CHA.

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
(6) Ladder: LADDER_UNVERIFIED={picaros} y LADDER_SALES_UNSCORED=true (las ventas a dealer a su precio puntúan 0); bonus de ladder solo en compras.
(7) Hilos: el agente de dealers solo continúa hilos abiertos por play (ownsThread lee "action":"open" en thread-<id>.jsonl); los demás → idle · rule foreign-thread.
(8) Tras 1 no-deal cuyo mejor precio nunca llegó a nuestro límite: 60 min de enfriamiento (HOPELESS_COOLDOWN_MS).
(9) Flags: no aprobar presión de Chato 2819. 10878/10965 (Pícaros) están bien puestos y su already_flagged al reiniciar es inofensivo; 4743 es un falso positivo conocido. Las frases de presión solo se envían con --approve-flags y OK de Pablo.
(10) Ruta CHA (aprobada por Pablo vía coordinator): a un equipo se le vende (a) un duplicado o (b) una carta que podemos recomprar a un dealer a ≤ nuestro valor, SOLO contra una puja de equipo existente ≥ valor + 20. Las cifras las pone TRADER; tú haces la compra al dealer con tope min(valor, quote.hi) de dealerBuyQuotes (src/forex/ledger.ts). Un trato de equipo puntúa como mucho 50.
(11) Egg de Chato a mitad de trato: GREETINGS[2] contiene la subcadena literal del egg (personas.md:233); no reescribirla.
Antes de cada commit: pnpm test, pnpm typecheck y pnpm docs:check en verde; push justo después (fetch y pull --rebase si el remoto avanzó; no hacer stash de .env.broker, que es de otra sesión). Nunca prettier --write. Coautoría: "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>". Las preguntas a Pablo, con investigación y recomendación. Vigila results/logs/<día>/play.log con un Monitor ([dealers] sin «idle · rule no-target», [flags], rate_limited, foreign-thread).
```

## Procesos

- No lanza ninguno: sus rutas corren dentro de `pnpm bazaar:play` (en vivo, lanzado por `bazaar:up --live --confirm`), que reinicia solo el coordinator.
- Monitor sobre `play.log` (30 min, se rearma).

## Estado al 4 oct (instantánea, 10:03)

- Los 5 dealers idle · no-target. Ladder: L1 abuela 3/3; L2–L5 0/3.
- Chato CHA-08: sin trato posible hoy (enfriamiento). Forex: solo detector.
- La recompra automática de CHA-05 a Abuela (≤ 11) se deja correr.
- A medias: ruta CHA. Trader expondrá en `src/markets/` un campo con las pujas aprovechables (trade.book + `dealerBuyQuotes`) y le pasará el nombre; **no cablear el disparador antes**. Cotizaciones: CHA-05 abuela ≤ 10; MAL-11 pícaros 150 (hace falta puja ≥ 182); RET-11 pícaros 130 (puja ≥ 308).
- El coordinator reiniciará play hacia t1680–1750; sin WIP.
- Últimos commits: 095ad4d (`dealerBuyQuotes`), 5f26123 (enfriamiento hopeless), 17737e2 (equipos primero), 76dc0ce (foreign-thread), 203c5ef (frase del egg de Chato), 2013780 (forex apagado), 8b236d3 (dealShare span 0), 4faf36f (solo duplicados + team-received).

## Ficheros clave

`src/dealers/AGENTS.md`, `src/dealers/agent.ts` (`adoptOpenThread`, `notForDealers`, hopeless), `src/dealers/planning/plan.ts` (`rankCandidates`), `src/coordinator/routes.ts`, `src/forex/chains.ts`, `src/forex/ledger.ts`, `src/flags/flags.ts`, `src/shared/asset-locks.ts` (`teamOfferedAssets`), `src/dealers/history/team-received.ts`, «The Bazaar - Payday.pdf» (diapositivas 7–8). Memorias: dealer-sale-below-value-costs, banco-sunday-plan, sell-only-duplicates, ladder-scoring-measured, hidden-cards-never-sold.

## Comunicación

- coordinator: reinicios (hash + hijo); le pide chequeos de salud y aprobaciones de Pablo.
- trader: ruta CHA, precios de Pícaros, hilos.
- eggs: preguntas y huevos a dealers; perfil del banco.
- goals: cambios de estrategia.
