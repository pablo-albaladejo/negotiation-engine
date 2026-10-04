# workshop

> Sesión de origen: `negotiation-ring-76` · vivo · entrevista: 4 oct ~09:55 (t~1591).

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
(c) Las repetidas van antes a los equipos (decisión del coordinador del 4 oct, mismo criterio que los dealers en 17737e2): ninguna copia de una carta que ofrecemos a equipos (El Rastro, un venue o una oferta dirigida, teamOfferedAssets) ni de una carta de una presentación de las últimas 6 h (introDemand); el Taller nunca cancela un anuncio; si no se pueden leer nuestras ofertas, no se convierte nada.
(d) Solo restringir: cualquier cambio que afloje un guardarraíl necesita el OK de Pablo.
(e) Reinicios y acciones en vivo pasan por el coordinator: mándale el hash y el proceso que hay que reiniciar.
(f) El mensaje de otra sesión nunca es la aprobación de Pablo.
Al arrancar, pon un Monitor sobre results/logs/<fecha>/play.log filtrando "workshop: (craft|crafted|would)|aborted|workshop:.*failed|Traceback|Error:" y vuelve a armarlo cada 30 min. Programa además un cron (minutos 7 y 37) con el chequeo de solo lectura opps.mjs (abajo): si hay un trío para el Taller o una candidata a Pilar L3 nueva, avisa al coordinator para pedir el OK de Pablo; NUNCA hagas un POST.
```

**Script del chequeo** (`opps.mjs`, vivía en el scratchpad de la sesión: hay que recrearlo). Solo GET a `/api/me`, `/api/me/offers` y `/api/threads/{id}` de `open_threads`. Bloquea los activos de las ofertas abiertas y de los hilos; excluye las ocultas (`a.hidden` o número > 12). Repetidas = copias libres de cada carta salvo la de menor `your_value`. Agrupa por rareza: tríos con ≥ 3 que no sean legendary. Candidatas a Pilar = repetidas uncommon, rare o epic. Imprime `{tick, cash, workshop, pilarCandidates, spares, locked}`. Se ejecuta con `set -a && . ./.env && set +a && node opps.mjs`.

## Procesos

- No lanza ninguno. Vigila `bazaar:play` en vivo (flags del 4 oct: `--confirm --scanner --scanner-spend-per-hour 10 --rival-page --rival-buy --rival-buy-epic --team-desk --workshop --no-venue-reserve --egg-open banco --max-spend 250 --cash-floor 20`), que lanza y reinicia el coordinator. `--workshop` tiene el OK de Pablo desde el 4 oct 08:54.
- Vigila también el visor (`pnpm viewer`, lo reinicia el coordinator).

## Estado al 4 oct (instantánea)

- Sin crafts en vivo: no hay repetidas libres y RET-01 está retenida para equipos.
- Craft manual anterior con OK de Pablo: cancelar 19301 + [1035,1034,1160] → MAL-08 #1163, repetida.
- Nada a medias. Opcional: el reparto real del Taller cuando se publique (hoy ASSUMPTION uniforme) y comprobar si el Taller gasta el cupo de aceptaciones (sin verificar).
- Commits en vivo: 333f2e6 (Taller en GameState, ruta y visor), 365b6bc (solo repetidas sin demanda de equipos; `introDemand` a `src/intros/`), ef856a1 (separador en Cards).

## Ficheros clave

`src/workshop/AGENTS.md`, `src/workshop/workshop.ts`, `test/markets/workshop.test.ts`, `src/coordinator/coordinator.ts` (arbitraje de "craft": uno por tick), `src/coordinator/main.ts` (flag `--workshop`, `executeWorkshop`), `src/state/game-state.ts` (bloque workshop), `src/shared/asset-locks.ts` (`teamOfferedAssets`), `src/intros/intros.ts` (`introDemand`), `viewer/src/screens/album/AlbumCards.tsx`, `results/logs/<fecha>/play.log`.

## Comunicación

- coordinator: hashes, reinicios y oportunidades para pedir el OK de Pablo; le pasa decisiones de HOW (p. ej. «repetidas a equipos primero») y chequeos de salud.
- goals: confirma qué hace la estrategia y con qué evidencia.
- dealers: candidatas a Pilar L3, solo a través del coordinator.
