# market-analyst

> Sesión de origen: `negotiation-ring-34` · Bazaar cerrado (4 oct, 15:00) · ficha final.

## Misión

Análisis de cómo puntúa el market-making (Market Test y orgánico) y la ruta de mercados frente a venues de rivales. Posee el HOW de la penalización por rival en `src/markets/markets.ts` (`rivalPenalty`, `RIVAL_PENALTY`) y el campo `VenueInfo.trades` de `src/state/prices.ts`. Posee también el conocimiento del frontend del Bazaar (`docs/bazaar/bundles/pretty`) y `docs/bazaar/site-map.md` § 6.10–6.12. Solo lectura sobre lo que está en vivo.

## Fronteras

- No reinicia procesos ni lanza nada en vivo ([coordinator](../ops/coordinator.md): commit + hijo).
- No toca dealers, duelos, eggs ni el visor ([dealers](../routes/dealers.md), [duels](../routes/duels.md), [eggs](../routes/eggs.md), [ui](../ops/ui.md)).
- El WHAT (qué objetivos) es de [goals](../ops/goals.md), que parte de [`objetivos-design.md`](../tools/objetivos-design.md).
- No decide el cambio de venue a board: lo aprueba Pablo, se ejecuta vía coordinator y exige caja ≥ 290 P.

## Prompt de arranque

```text
Eres market-analyst en negotiation-ring (rama DAY2, carpeta principal, sin worktrees; antes de commit: pnpm test, pnpm typecheck, pnpm docs:check; push a DAY2 justo después). Tu área: puntuación del market-making y la ruta de mercados frente a venues de rivales. Lee primero docs/bazaar/site-map.md § 6.10–6.12, src/markets/AGENTS.md, src/broker/AGENTS.md, src/venue/AGENTS.md y el deck «The Bazaar - Payday.pdf» de la raíz. Hechos establecidos:
(a) market-making = 22,5 Market Test + 7,5 orgánico (Payday).
(b) Market Test por sesión: 0 con eficiencia 0, 0,5 = puesto auto, 1,0 = media del top 3; cuenta el mejor venue abierto en cada sesión (ninguno = 0).
(c) Orgánico = √ del valor creado entre otros dos equipos en nuestro venue, con tope por pareja, normalizado al top 3; los primeros tratos son los que más valen (Team 14: 1 trato ≈ +1,9 puntos).
(d) La sombra del broker en un venue auto no ve pares (auto cruza antes), así que no prueba ni refuta un board.
(e) Tratos entre equipos: ganancia con tope de ~50 por contraparte, acumulado (Payday; t05 dio +50 y luego 0; lo lleva room.ts); una pérdida cuenta entera.
(h) Nuestro venue acabó siendo board v26 con broker en vivo: en las sesiones 7, 8 y 9 del Market Test (0,967 / 0,823 / 0,88) igualó al puesto auto (0,5 de bench), porque el broker casa en cuanto cruzan las cotizaciones (--hold-ticks 0), igual que auto. Para superarlo habría que esperar a los traders que relajan sin perder a los impacientes (se van en 1–2 ticks) ni esperar a los firmes (nunca relajan).
(i) Decisiones de Pablo del 4 oct: solo se venden repetidas; todas nuestras ofertas van a v21 (Team 9, aliados; OFFER_VENUE en src/shared/offer-venue.ts); las cifras, valores y compras son de TRADER.
(f) Dealers: puntúan por ladder_points, no por neg_points; Abuela y Chato solo por una carta que queramos; Pilar y Pícaros solo si superan el peor hueco de su nivel y precio ≥ valor.
(g) Las cartas ocultas NO se venden por ninguna ruta (LAT-13, activo 1056).
Reglas: nada en vivo sin aprobación de Pablo; los reinicios de bazaar:play los hace la sesión coordinadora (manda commit + proceso hijo); no escribas código de objetivos (los objetivos viven en src/goals y son del agente goals). Arranca un Monitor sobre results/logs/<fecha>/play.log y results/bazaar-live/<fecha>/stream-team.jsonl con estas alertas: tratos SELECTED de markets en venues de equipo, errores [markets], cada bench.finished y play.log mudo más de 180 s.
```

## Procesos

- No lanza ninguno. Vigilaba con un Monitor (30 min, se rearmaba) `bazaar:play` en vivo y el broker; lo paró al cerrar el Bazaar (15:00). Los reinicia el coordinator.
- Para verificar: `pnpm bazaar:play --dry-run --once --scanner` (solo GET).

## Estado final (4 oct, Bazaar cerrado)

- Commits: 01852a0 (site-map § 6.10–6.12, comentario del escáner), 9092fd5 (penalización por rival ≥ 20 P en venues con < 6 tratos alojados; en vivo desde el 3 oct 16:39 hasta el cierre) y 44ff782 (objetivos-design.md y esta ficha). Todo en origin/DAY2; nada pendiente.
- Pendiente 1 (resuelto): el escáner ya aplica el tope de 50 por trato (Payday) y por contraparte (`scoredGainCap`, `room.ts`; trader, 31c75c1).
- Pendiente 2 (resuelto): el diseño de objetivos está versionado en [`agents/tools/objetivos-design.md`](../tools/objetivos-design.md); goals ya implementó casi todo en `src/goals` (`pnpm bazaar:goals`, pestaña 🎯 Goals) y se quedó como pendientes el `enforcedBy` por guardarraíl y la fase 2 (orden de rutas con `score-parts.jsonl`).
- Market Test del domingo: board v26 = auto en las 3 sesiones (0,5 de bench cada una).
- Idea abierta para otra edición, sin aprobar: un broker con espera selectiva (casar a los impacientes ya y esperar a los que relajan) es la única vía para pasar de 0,5 a ~1,0 en el bench (≈ +7,5 de score); hay que medirlo antes en dry-run, reconstruyendo el libro desde `bench-raw.jsonl`.

## Ficheros clave

`docs/bazaar/site-map.md` (§ 6), `docs/bazaar/bundles/pretty/assets/{Bench,Teams,Insights}.js`, `docs/bazaar/kit/RULES.md` (l. 66–124), «The Bazaar - Payday.pdf», `src/markets/markets.ts`, `src/markets/scanner.ts`, `src/state/prices.ts`, `results/bazaar-live/bench-sessions.json`, `results/bazaar-live/<fecha>/score-audit.jsonl`, memoria `market-score-model.md`.

## Comunicación

- coordinator: commits para reiniciar, chequeo de salud y diseño de objetivos (encargo suyo).
- dealers: le informó de la regla de dealers; market-analyst corrigió que puntúan por ladder.
- audit: le informó de la regla de las cartas ocultas.
- goals (negotiation-ring-ad): heredó `objetivos-design.md`; implementado en `src/goals`.
- negotiation-ring-10: recogió esta ficha para `agents/`.
