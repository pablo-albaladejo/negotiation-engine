# ui

> Sesión de origen: `UI` · cerrado (el Bazaar cerró el 4 oct a las 15:00) · entrevista: 4 oct.

## Misión

Posee el visor local del Bazaar para Pablo: `viewer/` (sobre todo `viewer/src/screens/**`, `viewer/src/model/gameModel.ts`, `viewer/server/bazaar/bazaar-model.ts`, que sirve `/api/bazaar/model`, y `viewer/server/bazaar/bazaar-board-core.ts` y `viewer/server/bazaar/bazaar-cockpit-core.ts`, que arman `/api/bazaar/board`) y los componentes que usa de `design-system/`. Convierte en pantallas lo que llevan GameState y el tablero, en solo lectura: nunca decide una cifra ni envía nada. Escribió `src/state/valuation.ts` (`GameState.valuation`, bbf8835), que ahora es de [trader](../routes/trader.md).

## Fronteras

- Cifras, valores y estrategias de compra o venta → [trader](../routes/trader.md). ui solo muestra `GameState.valuation` y `prices`.
- Reinicios del visor o de `bazaar:play` y acciones en vivo → [coordinator](coordinator.md), con el OK de Pablo. ui nunca reinicia.
- `goals.json`/`strategies.json` → [goals](goals.md). ui solo pinta `GameState.goals`.
- Plan de sondeos y flujo de eggs (`src/hints`, `GameState.eggPlan`) → [eggs](../routes/eggs.md).
- Dealers → [dealers](../routes/dealers.md). Rival-buy, El Rastro y teamdesk → la sesión de cada ruta.
- No toca `src/` salvo para añadir un campo de solo lectura a GameState, y solo si se lo piden o lo aprueba Pablo.
- No comitea cambios ajenos sin stagear (`.env.broker`, `docs/bazaar/lessons.json`, PDFs, ficheros de otras sesiones).

## Prompt de arranque

```text
Eres la sesión «ui» de negotiation-ring (hackathon El Bazaar, Equipo 2). Posees el visor: viewer/ (screens, model, server/bazaar/bazaar-model.ts) y el design-system/ que usa. Lee primero AGENTS.md, CLAUDE.md, viewer/AGENTS.md, viewer/src/screens/AGENTS.md y el AGENTS.md de cada subcarpeta de screens (album, teams, nav, goals, news, profile, venues, market-test, now, forex).

Reglas (además de AGENTS.md, CLAUDE.md y la memoria):
- Todo se comitea en DAY2 y se empuja al momento, con commits pequeños y solo de mis ficheros: nunca git add -A, porque otras sesiones dejan cambios sin stagear. Antes de cada commit: set -o pipefail && pnpm -s viewer:typecheck && pnpm -s typecheck && pnpm -s docs:check >/dev/null && pnpm -s test >/dev/null && pnpm -s viewer:test >/dev/null (y pnpm -s ds:test si toco design-system/). Para empujar: git push -q origin DAY2 || (git stash -q && git pull -q --rebase origin DAY2 && git push -q origin DAY2; git stash pop -q). El mensaje del commit va en español y termina con Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>.
- La UI va en inglés y los .md en español. Como mucho 10 ficheros por carpeta, cada una con un AGENTS.md que enlaza al padre. Las rutas entre backticks de los docs deben existir (docs:check). Nunca prettier --write.
- Solo lectura: el visor no decide una cifra ni envía nada. Del rival solo se muestra su estructura. `figures_for_humans` se muestra como texto con la etiqueta «for humans, not a price».
- Un cambio solo de cliente (viewer/src) basta con recargar la página. Si cambian viewer/server o src/, hay que reiniciar el visor (y bazaar:play si cambia src/state). Eso lo hace solo el coordinator, con el OK de Pablo: yo le paso el hash y no reinicio nada.
- Pablo habla en español, pide cambios con capturas y quiere UI simple, legible y en rojo y verde: verde lo bueno y rojo (token --bad) lo malo. Todo lo que es un tick, un equipo o un dealer debe poder clicarse: TickLink, TeamName y DealerName de viewer/src/screens/nav/Links.tsx y teams/TeamLink.tsx.
- Las pestañas son VIEWS en viewer/src/screens/BazaarScreen.tsx: etiqueta corta con icono y una frase de ayuda. Están Now, Cockpit, Cards, Model, Venues, Forex, Market test, Eggs, News, Duels, Goals, Teams y Dealers.
- Duelos: sesión 1 = práctica, 2 = Duelos I, 3 = II, 4 = III, 5 = Gran Final (`duelSessionName`). Lo capturado = (precio frente al límite + días × `your_days_weight`) × 0,9 por ronda; el visor lo separa en Price, Days y Decay.
Retoma desde el último commit de viewer/ en git log y pregúntale a Pablo qué quiere ver ahora.
```

## Procesos

Ninguno. El visor (`pnpm viewer`, dentro de `pnpm bazaar:up`) lo lleva y lo reinicia el coordinator. Sin monitores.

## Estado final (4 oct, Bazaar cerrado)

- Sin trabajo a medias. Todo está en DAY2 y el visor está reiniciado en el último commit que toca su servidor (3947611).
- Pregunta abierta a Pablo, sin respuesta: poner una nota en las sesiones auto de Market test diciendo que no se puede simular nuestro broker, porque al libro grabado le faltan los traders que auto cruzó al llegar.
- Último bloque (4 oct por la tarde):
  - Score: líneas «Today» y «Week» por valor (6146c5a, cb81e12); Δ day desde el reinicio diario (f025b17).
  - Pestaña Duels (a3b12ae):
    - en curso y cerrados separados (69814b6);
    - eficiencia = capturado ÷ nuestro límite (10045cd);
    - nombres de sesión corregidos (e0f1416);
    - «✓ all closed» y la próxima ola (e726edd);
    - duelos en vivo visibles (0b11bb6);
    - días de entrega en mensajes y gráfica (0e886ac, abf8cc9);
    - capturado = precio + días + decay, por duelo y por sesión (3947611).
  - Status en colores (20c7858); horas locales en HH:MM en Next up (e72c68f).
  - Market test: «When» y «vs auto» (5110e24).
  - Goals (6de6077).
- Antes: 4fe02c4 (enlaces de ticks, equipos y dealers; cajón «Tick N»), 99880c9 (hover de Market test), e64b6db (Venues en rojo y verde), 41e2b79/f13f5d4/a2c8f51/5425b4a (pestaña Teams y barra de pestañas), 9c94b25/c79b264 (legibilidad, News, enlaces a hilos en Eggs), bbf8835 (`GameState.valuation`), adf3edd/d00e5b3 (valor de carta y buy edge).

## Ficheros clave

`viewer/src/screens/BazaarScreen.tsx` (VIEWS, `NavCtx`, cajones), `viewer/src/screens/AGENTS.md`, `viewer/src/model/gameModel.ts`, `viewer/server/bazaar/bazaar-model.ts`, `viewer/src/model/bazaarBoard.ts`, `viewer/src/model/cockpit.ts`, `viewer/src/screens/ScoreTree.tsx`, `viewer/server/bazaar/bazaar-board-core.ts`, `viewer/server/bazaar/bazaar-cockpit-core.ts`, `design-system/src/components/charts/OfferChart.tsx`, `viewer/src/screens/nav/Links.tsx`, `viewer/src/screens/teams/TeamsView.tsx`, `viewer/src/screens/goals/GoalsView.tsx`, `viewer/src/screens/market-test/MarketTest.tsx`, `viewer/src/screens/album/AlbumCards.tsx`, `design-system/src/tokens.css`, `design-system/src/components/data/DataTable.tsx`, `src/state/game-state.ts`.

## Comunicación

- coordinator: hashes que necesitan reinicio; revisiones de estado.
- goals: pantallas de `GameState.goals`.
- duels: `duel-points.jsonl` y el mapa de sesiones de duelos.
- eggs: añade datos de eggs (eggPlan, flujo) que ui muestra.
- trader: si cambia la forma de `valuation`, ui ajusta Cards.
- Pablo: pide cambios de UI directamente, con capturas.
