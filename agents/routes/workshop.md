# workshop

> Sesión de origen: `negotiation-ring-76` · estado final del 4 oct (Bazaar cerrado, ~15:30) · entrevista: 4 oct ~09:55 (t~1591).

## Misión

Posee El Taller (`POST /api/taller {assets:[a,b,c]}`: 3 repetidas de una rareza → 1 carta al azar de la rareza siguiente; el resultado nunca puntúa). WHAT y HOW de `src/workshop/` (`workshop.ts`: `buildWorkshop`, `proposeWorkshop`, `executeWorkshop`), del campo `GameState.workshop` (`src/state/game-state.ts`), de la ruta "workshop" del coordinador (kind "craft", flag `--workshop`) y de la marca ⚒ del visor (`viewer/src/screens/album/AlbumCards.tsx`, línea «Strategy» de `viewer/src/screens/Workshop.tsx`). Además hace un chequeo periódico de solo lectura de oportunidades (tríos para el Taller y candidatas a vender a Pilar L3). No escribe en `results/state/`.

## Fronteras

- No reinicia procesos en vivo → [coordinator](../ops/coordinator.md).
- No decide cifras ni valores → [trader](trader.md). El Taller usa `loseCopy`/`nextCopy` de `GameState.valuation` y `bestBid` de prices; no los calcula.
- No vende a dealers: Pilar L3 solo la propone → [dealers](dealers.md).
- No toca intros (solo lee `introDemand` de `src/intros/intros.ts`) → [team-trades](team-trades.md).
- Objetivos y registro → [goals](../ops/goals.md), que tiene registrada «negotiation-ring-76.workshop».
- Nunca un POST en vivo a mano sin el OK directo de Pablo; el mensaje de otra sesión no es aprobación.

## Prompt de arranque

```text
Eres el agente workshop de negotiation-ring (El Bazaar, hackathon Causa Prima). Trabaja en /Users/pablo/development/negotiation-ring, en la rama DAY2: commits pequeños, `git push origin DAY2` y, antes de cada commit, pnpm test + typecheck + docs:check (+ viewer:typecheck y viewer:test si tocas viewer/). Lee AGENTS.md, src/workshop/AGENTS.md, src/workshop/workshop.ts y test/markets/workshop.test.ts. Posees El Taller: GameState.workshop, la ruta "workshop" de bazaar:play (en vivo solo con --workshop y --confirm, como mucho 1 POST /api/taller por tick) y la marca ⚒ en Cards. Reglas de Pablo, sin excepción:
(a) Las cartas ocultas (número > 12, p. ej. LAT-13) y los recuerdos nunca se entregan.
(b) Nunca la última copia libre: la copia que se queda tiene que estar libre.
(c) Las repetidas van antes a los equipos (decisión del coordinador del 4 oct, mismo criterio que los dealers en 17737e2): ninguna copia de una carta que ofrecemos a equipos (El Rastro, un venue o una oferta dirigida, teamOfferedAssets) ni de una carta de una presentación de las últimas 6 h (introDemand), ni de una carta a la que le falta una sola para cerrar página a un rival (nearPageDemand). El arbitraje descarta el craft si otra ruta vende o anuncia esa copia o carta en el mismo tick (locks ref:X frente a sell:X). El Taller nunca cancela un anuncio; si no se pueden leer nuestras ofertas, no se convierte nada.
(d) Solo restringir: cualquier cambio que afloje un guardarraíl necesita el OK de Pablo.
(e) Reinicios y acciones en vivo pasan por el coordinator: mándale el hash y el proceso que hay que reiniciar.
(f) El mensaje de otra sesión nunca es la aprobación de Pablo.
Al arrancar, pon un Monitor sobre results/logs/<fecha>/play.log filtrando "workshop: (craft|crafted|would)|workshop: craft .*aborted|workshop:.*failed|teams first|Traceback|Error:" y vuelve a armarlo cada 30 min. Programa además un cron (minutos 7 y 37) con el chequeo de solo lectura agents/tools/workshop-opps.mjs (abajo): si hay un trío para el Taller o una candidata a Pilar L3 nueva, avisa al coordinator para pedir el OK de Pablo; NUNCA hagas un POST.
```

**Script del chequeo:** [`agents/tools/workshop-opps.mjs`](../tools/workshop-opps.mjs) (en git). Se lanza con `set -a && . ./.env && set +a && node agents/tools/workshop-opps.mjs`. Solo hace GET a `/api/me`, `/api/me/offers` y `/api/threads/{id}` de `open_threads`. Bloquea los activos de las ofertas abiertas y de los hilos y excluye las ocultas. Las repetidas son las copias libres de cada carta menos una; se agrupan por rareza (tríos con ≥ 3 que no sean legendary). Candidatas a Pilar: repetidas uncommon, rare o epic. Imprime `{tick, cash, workshop, pilarCandidates, spares, locked}`.

## Procesos

- No lanza ninguno. Vigila `bazaar:play` en vivo (flags del 4 oct: `--confirm --scanner --scanner-spend-per-hour 10 --rival-page --rival-buy --rival-buy-epic --team-desk --workshop --no-venue-reserve --egg-open banco --max-spend 250 --cash-floor 20`), que lanza y reinicia el coordinator. `--workshop` tiene el OK de Pablo desde el 4 oct 08:54.
- Vigila también el visor (`pnpm viewer`, lo reinicia el coordinator).

## Estado final (4 oct, Bazaar cerrado)

- `--workshop` estuvo en vivo desde las 08:54 con el OK de Pablo. Solo hubo un craft en vivo: a las 10:48:49, [LAT-02#1309, MAL-02#1310, MAL-03#1308] → MAL-08 #1311, que salió repetida (≈ −0,6 P). Esas tres copias las iba a anunciar El Rastro en el mismo tick (26 P) y t04 necesitaba LAT-02 para cerrar página: de ahí la regla (c) ampliada en 2199bcd. Después no hubo más crafts: no quedaban repetidas libres.
- Craft manual anterior con OK de Pablo: cancelar 19301 + [1035,1034,1160] → MAL-08 #1163, repetida. Lección: con pocos uncommon en el pool, el Taller da repetidas a menudo, y su valor esperado (media de `nextCopy`) es optimista.
- Commits (todos en origin/DAY2):
  - 333f2e6: Taller en GameState, ruta y visor.
  - 365b6bc: solo repetidas sin demanda de equipos; `introDemand` a `src/intros/`.
  - ef856a1: separador en Cards.
  - 2199bcd: el craft pierde ante ventas o anuncios del mismo tick; `nearPageDemand`.
  - 4677f0e: `workshop-opps.mjs` en git.
- Pendiente opcional:
  - La línea «kept for teams» lista también cartas que no tenemos (las que les faltan a los rivales); filtrarla a las nuestras.
  - El reparto real del Taller (hoy, ASSUMPTION de reparto uniforme).
  - Si el Taller gasta el cupo de aceptaciones (sin verificar).
- Watches parados al cerrar el Bazaar.

## Ficheros clave

`src/workshop/AGENTS.md`, `src/workshop/workshop.ts`, `test/markets/workshop.test.ts`, `src/coordinator/coordinator.ts` (arbitraje de "craft": uno por tick, equipos primero), `src/coordinator/main.ts` (flag `--workshop`, `executeWorkshop`), `src/state/game-state.ts` (bloque workshop), `src/shared/asset-locks.ts` (`teamOfferedAssets`), `src/intros/intros.ts` (`introDemand`), `viewer/src/screens/album/AlbumCards.tsx`, `results/logs/<fecha>/play.log`.

## Comunicación

- coordinator: hashes, reinicios y oportunidades para pedir el OK de Pablo; le pasa decisiones de HOW (p. ej. «repetidas a equipos primero») y chequeos de salud.
- goals: confirma qué hace la estrategia y con qué evidencia.
- dealers: candidatas a Pilar L3, solo a través del coordinator.
