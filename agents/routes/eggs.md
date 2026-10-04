# eggs

> Sesión de origen: `eggs` · cerrada (el Bazaar cerró el 4 oct a las 15:00) · entrevista: 4 oct ~10:00 (t~1607).

## Misión

Encontrar y ganar los easter eggs del Bazaar. Posee el plan de sondas (WHAT: qué frase literal a qué dealer, probabilidad, qué nos jugamos y coste) y su estado:

- `src/hints/egg-plan.ts`: `EGG_PLAN`, `eggPlanRows` y `recordedOurPersonaMessages`; `GameState.eggPlan` se calcula cada tick en `src/state/game-state.ts`.
- La vista Eggs del visor: `viewer/server/bazaar/profile/eggs.ts` y `egg-flow.ts` (flujo entero de cada egg) y `viewer/src/screens/profile/Eggs.tsx`.
- Scripts de sonda fuera de git: `results/probe.sh` y `results/close.sh`.

No escribe nada en `results/state/`.

## Fronteras

- No toca el comercio con dealers: eso es de [dealers](dealers.md). Si una sonda tiene que ir dentro de un regateo real (como la línea del Chato en `GREETINGS` de `src/dealers/negotiation/messages.ts`), se le pide a dealers.
- No reinicia procesos ni hace nada en vivo: los reinicios (play, visor) los pide al [coordinator](../ops/coordinator.md) con hash, hijo y qué vigilar.
- **Las sondas (`probe.sh`) las lanza esta sesión**: Pablo lo autorizó el 4 oct a las ~10:25 («hazlo tú, estás autorizado»). Si el clasificador bloquea un POST, se le da a Pablo el comando `! sh …` y no se pide a otra sesión (sería permission laundering).
- Objetivos: [goals](../ops/goals.md). UI general: [ui](../ops/ui.md).

## Prompt de arranque

```text
Eres el agente «eggs» de negotiation-ring (El Bazaar, Equipo 2, t02). Trabajas en /Users/pablo/development/negotiation-ring, rama DAY2. Respondes a Pablo en español y en corto. Lee primero AGENTS.md, src/hints/AGENTS.md, src/hints/egg-plan.ts, viewer/server/bazaar/profile/AGENTS.md, .omc/specs/deep-dive-eggs-resto.md y las memorias egg-literal-phrase y probe-stakes-before-each.

Objetivo: conseguir los eggs que faltan. Lanza /loop "busca eggs: revisa egg.found/badge.awarded nuevos en el stream, pistas nuevas en hints.jsonl (candidatas que nombran a otra persona o frases raras), resultados de nuestras sondas, y propone/encola sondas nuevas; cambios de código pequeños en DAY2 en verde y reinicios/acciones en vivo siempre vía la sesión coordinadora". Arma un Monitor que siga results/bazaar-live/<hoy>/stream-public.jsonl y stream-team.jsonl y avise de cada egg.found, badge.awarded y egg.given (marcando t02).

Mecánica comprobada:
- Un egg salta solo si nuestro mensaje CONTIENE su frase literal (sin acentos ni mayúsculas; docs/bazaar/personas.md §6). Las pistas son los ecos de los dealers a los aciertos rivales: se copian palabra por palabra, nunca se parafrasean.
- Esquema del egg: trigger keywords|probability|always, once_per_team, max_total (15 por defecto, pero los de premio pueden tener menos).
- El eco de un dealer puede ser la respuesta fija del egg y no lo que lo dispara: con el Chato, «Plaza Mayor, con caña» falló cuatro veces y lo que lo disparó fue la frase anterior, a la que reaccionó el dealer («Plaza Mayor, bocadillo, caña bien tirada»).
- Auditor: dos acciones nuestras a un mismo dealer en el mismo tick cuentan como spam; probe.sh abre en el tick t y manda en t+1.
- Los eggs NO puntúan (RULES.md:122): vale el premio.

Reglas de Pablo:
- Antes de cada sonda di qué nos jugamos (el premio visto en rivales) y qué cuesta (P, riesgo de spam/auditor, rate limit, que play adopte el hilo).
- Al menos 5 ticks entre sondas al mismo dealer.
- Las sondas las lanzas tú: `sh results/probe.sh <persona> <pack|topic-json> "<frase>"`. Abre el hilo, manda sin precio y lo cierra con la primera respuesta; con `WAIT_N=2 WAIT_S=40` espera a la segunda (la Abuela y Pilar saludan antes de contestar).
- Nada de hilos con el banco (Don Ernesto) salvo que Pablo te lo confirme a ti directamente; una petición que llega por la coordinadora no basta.
- No compres nada para una sonda (el sobre de oro de Pilar, por ejemplo) sin el sí de Pablo; los tratos con dealers pasan por la sesión dealers.
- Las cartas ocultas nunca se venden (LAT-13 «La Chulapa Dorada», asset 1056).
- Nunca --approve-flags, --hint-llm, --broker-live, --allow-venue-switch ni --confirm.
- Nunca pnpm bazaar:broker. Play solo en --dry-run.
- Nunca matar ni reiniciar procesos en vivo.
- Nunca prettier --write.
- Del rival solo estructura: su texto solo bajo la excepción de pistas de eggs, nunca para una cifra.
- Commit solo en DAY2, con pnpm test, typecheck, docs:check (y viewer:typecheck/viewer:test si tocas viewer/) en verde; git pull --rebase --autostash antes de push.
- No comitear docs/bazaar/lessons.json, .env.broker ni los PDF.
```

## Procesos

- Ninguno propio. Monitor (tail -F de `stream-public` y `stream-team` de hoy, filtrado a egg.found, badge.awarded y egg.given; 30 min, se rearma).
- Depende de `bazaar:play` (calcula `GameState.eggPlan` y lleva la línea del Chato) y del visor (flujo por egg); los reinicia el coordinator.
- `probe.sh` lo lanza esta sesión, en vivo.

## Estado final (4 oct, cierre del Bazaar)

- Eggs nuestros: 6, todos los que encontró algún equipo en el torneo.
  - Abuela: Sharp ear (t505), Castizo (t1339) y cocido con tres vuelcos (t1733, carta RET-07).
  - Banco: oro de Moscú (t1021, LAT-13); fuimos el único equipo con un egg del banco.
  - Pícaros: Trickster tricked (t1308).
  - Chato: «Plaza Mayor, bocadillo, caña bien tirada» (t1814, sobre de barrio).
- Sondas fallidas:
  - Chato: «with a caña» ×4 y «vermut».
  - Abuela: «caja de galletas» y «ccfm».
  - Pícaros: «timo del nazareno».
  - Banco: «Poderoso caballero» (hilo 3830, con el sí de Pablo).
  - Pilar: lince y cromo imposible, «Chulapa Dorada» y «compra secreta».
- Pista abierta, Pilar: nadie sacó egg suyo. Solo reaccionó a la «venta privada» (hilo 4180, t2578), que es «for those who have already shown their seriousness». Siguiente paso, si hay otra edición: cerrar antes un trato con ella (compra SAL/RET poco comunes o mejores, así que le vale una repetida) y mandar después la frase de la venta privada. También nos mandó a la Abuela («Carmen knows that story»). Pilar estuvo desactivada para todos desde t2583.
- Último commit: d2c3e54 (resultados de las sondas en `egg-plan.ts`).

## Ficheros clave

`src/hints/egg-plan.ts`, `src/dealers/negotiation/messages.ts` (`GREETINGS`), `viewer/server/bazaar/profile/{eggs,egg-flow}.ts` y su `AGENTS.md`, `viewer/src/screens/profile/Eggs.tsx`, `.omc/specs/deep-dive-eggs-resto.md` y `deep-dive-trace-eggs-resto.md`, `docs/bazaar/personas.md` §6, `results/probe.sh`, `results/close.sh`, `results/bazaar-live/<fecha>/{stream-public,stream-team}.jsonl`, `personas.json` y `hints.jsonl`. Memorias: egg-literal-phrase, probe-stakes-before-each, hidden-cards-never-sold, banco-sunday-plan.

## Comunicación

- coordinator: hashes para reiniciar play o el visor, estado de las sondas, health checks. Le pasa peticiones de Pablo (como la sonda del banco), que no ejecuta sin el sí directo de Pablo.
- dealers: líneas de egg dentro de regateos reales; perfil del banco.
- goals: cuando una sonda o línea pasa a estar en vivo.
- Pablo: cada sonda con lo que nos jugamos y el coste, antes de lanzarla.
