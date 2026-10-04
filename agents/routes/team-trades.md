# team-trades

> Sesión de origen: `negotiation-ring-7a` (también «7a» o «intros») · estado final: Bazaar cerrado, 4 oct por la tarde.

## Misión

La mecánica de los tratos con otros equipos:

- publicar, retirar y el timing de reprecio de nuestros anuncios y pujas (desde el 4 oct solo en `OFFER_VENUE` = v21, el mercado de Team 9);
- los flujos de aceptación (`evaluateOffer`, ofertas dirigidas y ofertas estructuradas dentro de hilos de equipo, en El Rastro y en v21), con el tope de Payday por contraparte (`roomOf`/`MIN_ROOM`);
- los locks de activos;
- las presentaciones (intros) que mandan a otros equipos a nuestro venue v26, donde el broker los cruza (parte orgánica de la nota de market).

Carpetas: `src/trades/` (solo mecánica) y `src/intros/` (entera). En `src/markets/rival-page.ts`, solo la mecánica de qué ofertas propias toca (`foreignOfferIds`). En `src/shared/asset-locks.ts`, la parte de keepsakes. Estado: `results/bazaar-live/intros.json` (memoria de envíos). Log: `results/logs/intros.log`.

## Fronteras

- Cifras (valor, suelos, márgenes, asks, umbrales de `evaluateOffer`, compras, rival-buy, épicas, scanner, rival-swap) → [trader](trader.md). Cualquier cambio de cifra pasa antes por trader.
- Reinicios, lanzamientos y pedir el OK de Pablo para comportamiento nuevo → [coordinator](../ops/coordinator.md). Nunca reinicia ni lanza nada.
- Broker, venue v26 y emparejador (`src/broker/matchmaker.ts`, solo lectura) → [broker](broker.md).
- Dealers → [dealers](dealers.md).
- Contraofertas a ofertas de equipos (`src/teamdesk/`) → [trader](trader.md) (antes [team-desk](team-desk.md)).
- Registro de estrategias → [goals](../ops/goals.md). Eggs y cartas ocultas → [eggs](eggs.md).

## Prompt de arranque

```text
Eres la sesión team-trades (antes negotiation-ring-7a) de negotiation-ring, Equipo 2 (t02) de El Bazaar. Tu foco: la MECÁNICA de los tratos con otros equipos y las presentaciones (intros) hacia nuestro venue v26. Lee primero AGENTS.md, src/AGENTS.md, src/trades/AGENTS.md, src/intros/AGENTS.md y la memoria (MEMORY.md).

Reglas de Pablo además de AGENTS.md/CLAUDE.md:
- TRADER posee TODAS las cifras: modelo de valor, suelos, márgenes, asks de trades.ts, rival-page, rival-swap, umbrales de evaluateOffer, compras (rival-buy, scanner, vías épicas SAL-11/RET-11). Tú solo mecánica: publicar, hilos, flujos de aceptación, intros, locks, timing. Un cambio de cifra se consulta antes con TRADER.
- Solo se venden repetidas. Vender la última copia o romper una página completa exige el OK explícito de Pablo. Las repetidas van antes a los equipos que a los dealers.
- Las cartas ocultas (HIDDEN_REFS, p. ej. LAT-13), las de tirada 1 y las épicas o legendarias con your_value ≤ 0 nunca se venden, anuncian ni ofrecen (isKeepsake).
- Dealers: solo la sesión «dealers».
- En vivo: solo el coordinator reinicia hijos o lanza procesos. Comitea solo en verde (pnpm test, typecheck, docs:check) más un dry-run. Mándale el hash, el hijo afectado y, si el comportamiento es nuevo, los topes y una línea del dry-run. El OK de Pablo lo pide el coordinator.
- git: todo en DAY2. Stage con rutas explícitas (el índice es compartido). Push: git push -q origin DAY2 || (git pull -q --rebase --autostash origin DAY2 && git push -q origin DAY2).
- Mensajes a otros equipos: sin cifras, texto del juego en inglés marcado con // game text. Del rival solo se lee estructura.
- Avisa a goals de cada estrategia nueva o cambiada (nombre, dueño, estado, commit, aprobado por Pablo sí/no con hora, objetivo).
- El juego rechaza hilos en nuestro propio venue (self_venue). Las intros abren hilo en "rastro" y el texto apunta a v26.
- Límite de 5 req/s compartido por todos nuestros procesos con la misma clave. Envuelve las pasadas en try/catch.
- Las preguntas a Pablo van con investigación y recomendación (AskUserQuestion).
- Venue de publicación (Pablo, 4 oct ~13:05): todos nuestros anuncios y pujas van SOLO a OFFER_VENUE (src/shared/offer-venue.ts, v21 = mercado de Team 9, aliados, 0 % de comisión, board). Los que queden en El Rastro se cancelan («moved to v21»). Se leen y se pueden aceptar los tablones de El Rastro y de v21; nuestras propias ofertas se excluyen por id (en v21 el autor sale con seudónimo).
- Tope de Payday por contraparte: lo que puntúa un trato con un equipo es ≤ ~50 acumulado entre días (t05 y t13 agotados el 4 oct). evaluateOffer rechaza ofertas de un equipo con room < MIN_ROOM (10, motivo no-room) y ordena por min(ganancia, room) (src/markets/room.ts de TRADER). Los anuncios no se filtran (TRADER: una venta sobre el suelo a un equipo sin room da 0, no resta).
- Intros en modo «puja primero» (Pablo, 4 oct ~14:30): a cada pareja solo se le escribe al que le falta la carta para que puje en v26; las presentaciones de libro avisan al que la tiene cuando la puja está en el libro.

Al arrancar: arma un Monitor sobre results/logs/intros.log (sent to|book #|failed|still failing|closed thread|ELIFECYCLE|Error|REFUSED|off:) y renuévalo cada 30 min. Comprueba que el proceso intros --confirm está vivo (pgrep -fl intros/main). Si no lo está, pídeselo al coordinator.
```

## Procesos

- `pnpm bazaar:intros --confirm`, fuera de `bazaar:up`; lo reinicia a mano el coordinator (último 14:37 del 4 oct sobre f4fab21, «puja primero», con OK de Pablo). Con el Bazaar cerrado ya no hace falta. Flags por defecto: `--every-s 300`, `--rivals-file results/bazaar-live/rivals.json`, `--memo-file results/bazaar-live/intros.json`.
- La ruta El Rastro de trades corre dentro de `pnpm bazaar:play` (coordinator).
- Dry-run: `pnpm bazaar:intros --dry-run --once`.

## Estado final (4 oct, Bazaar cerrado)

- Sin trabajo a medias ni decisiones pendientes. Todo comiteado y empujado en DAY2.
- Resultado de las intros el 4 oct:
  - 7 parejas: 6 a dos bandas (LAT-02, RET-01, RET-03, LAT-06, LAV-08, SAL-03 → t04) y 1 con «puja primero» (SAL-03 → t15);
  - 4 presentaciones de libro (CHA-01 → t07 y t13; CHA-10 → t03 y t14, órdenes con seudónimo en v26).
  - **0 cruces orgánicos en v26.** Las órdenes de otros equipos caducaron sin puja. Lección: decirle a los dos lados «publicad en nuestro venue» no basta; el que busca la carta tiene que pujar primero y aun así hace falta tiempo. Si se repite el juego, medir «puja primero» desde el primer día.
- En El Rastro y v21: solo se anunciaba la repetida de RET-01 (8–14 P, sin venderse). CHA-05 (72 P de t05) lo llenó TRADER, no trades (que lo rechazó por last-free-copy).
- Avisos abiertos: si se enciende `--rastro-bids`, el planificador de pujas debe saltarse `foreignBidRefs` (RET-11; trader lo tiene apuntado).
- Commits del día:
  - f4fab21: intros «puja primero».
  - d059847: anuncios y pujas solo en v21.
  - 7e27716: tope por contraparte en aceptaciones.
  - c2be143: reintento de cierre de hilo.
  - 9714078: book intros.
  - 08df3ec: hilo siempre en rastro.
  - 015d184: intros por parejas.

## Ficheros clave

`src/intros/intros.ts`, `src/intros/main.ts`, `src/intros/AGENTS.md`, `src/trades/trades.ts` (`evaluateOffer`, `planTick`, `foreignBidRefs`, `isPostVenue`), `src/trades/agent.ts`, `src/shared/offer-venue.ts`, `src/markets/room.ts`, `src/shared/asset-locks.ts`, `src/markets/rival-page.ts` (`foreignOfferIds`), `src/broker/matchmaker.ts` (`matchPairs`, solo lectura), `results/logs/intros.log`, `results/bazaar-live/intros.json`, `results/bazaar-live/rivals.json`, `results/logs/<fecha>/play.log` (líneas "[trades]" y "to-me #"), `results/bazaar-live/<fecha>/broker.jsonl`. Memorias: trader-owns-figures, sell-only-duplicates, hidden-cards-never-sold, market-score-model.

## Comunicación

- coordinator: hash, hijo a reiniciar y topes; le trae OK de Pablo, health checks y avisos de docs:check rojo.
- trader: le avisa cuando toca `src/trades/` y team-trades revisa choques de mecánica; le pasa dudas de cifras.
- broker: cruces en v26 tras una intro.
- goals: intros por parejas, book intros. Su sesión ya no estaba activa al final del día; el cambio a «puja primero» quedó solo en el commit y en el aviso al coordinator.
- dealers: leen `introDemand(team)` de `intros.json` para no vender a dealers repetidas con demanda de equipos.
