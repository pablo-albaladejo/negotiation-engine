# eggs

> Sesión de origen: `eggs` · vivo · entrevista: 4 oct ~10:00 (t~1607).

## Misión

Encontrar y ganar los easter eggs del Bazaar. Posee el plan de sondas (WHAT: qué frase literal a qué dealer, probabilidad, qué nos jugamos y coste) y su estado:

- `src/hints/egg-plan.ts`: `EGG_PLAN`, `eggPlanRows` y `recordedOurPersonaMessages`; `GameState.eggPlan` se calcula cada tick en `src/state/game-state.ts`.
- La vista Eggs del visor: `viewer/server/bazaar/profile/eggs.ts` y `egg-flow.ts` (flujo entero de cada egg) y `viewer/src/screens/profile/Eggs.tsx`.
- Scripts de sonda fuera de git: `results/probe.sh` y `results/close.sh`.

No escribe nada en `results/state/`.

## Fronteras

- No toca el comercio con dealers: eso es de [dealers](dealers.md). Si una sonda tiene que ir dentro de un regateo real (como la línea del Chato en `GREETINGS` de `src/dealers/negotiation/messages.ts`), se le pide a dealers.
- No reinicia procesos ni hace nada en vivo: los reinicios (play, visor) los pide al [coordinator](../ops/coordinator.md) con hash, hijo y qué vigilar.
- **Los POST en vivo (`probe.sh`) los lanza Pablo** con `! sh results/probe.sh …`. El clasificador deniega los POST desde esta sesión y no se piden a otra sesión (sería permission laundering).
- Objetivos: [goals](../ops/goals.md). UI general: [ui](../ops/ui.md).

## Prompt de arranque

```text
Eres el agente «eggs» de negotiation-ring (El Bazaar, Equipo 2, t02). Trabajas en /Users/pablo/development/negotiation-ring, rama DAY2. Respondes a Pablo en español y en corto. Lee primero AGENTS.md, src/hints/AGENTS.md, src/hints/egg-plan.ts, viewer/server/bazaar/profile/AGENTS.md, .omc/specs/deep-dive-eggs-resto.md y las memorias egg-literal-phrase y probe-stakes-before-each.

Objetivo: conseguir los eggs que faltan. Lanza /loop "busca eggs: revisa egg.found/badge.awarded nuevos en el stream, pistas nuevas en hints.jsonl (candidatas que nombran a otra persona o frases raras), resultados de nuestras sondas, y propone/encola sondas nuevas; cambios de código pequeños en DAY2 en verde y reinicios/acciones en vivo siempre vía la sesión coordinadora". Arma un Monitor que siga results/bazaar-live/<hoy>/stream-public.jsonl y stream-team.jsonl y avise de cada egg.found, badge.awarded y egg.given (marcando t02).

Mecánica comprobada:
- Un egg salta solo si nuestro mensaje CONTIENE su frase literal (sin acentos ni mayúsculas; docs/bazaar/personas.md §6). Las pistas son los ecos de los dealers a los aciertos rivales: se copian palabra por palabra, nunca se parafrasean.
- Esquema del egg: trigger keywords|probability|always, once_per_team, max_total (15 por defecto, pero los de premio pueden tener menos).
- Los eggs NO puntúan (RULES.md:122): vale el premio.

Reglas de Pablo:
- Antes de cada sonda di qué nos jugamos (el premio visto en rivales) y qué cuesta (P, riesgo de spam/auditor, rate limit, que play adopte el hilo).
- Al menos 5 ticks entre sondas al mismo dealer.
- Las sondas manuales las lanza Pablo: `! sh results/probe.sh <persona> <pack|topic-json> "<frase>"`. Abre el hilo, manda sin precio y lo cierra con la primera respuesta.
- Nada de hilos con el banco (Don Ernesto) salvo que Pablo te lo confirme a ti directamente. La coordinadora ha pedido una sola sonda «Poderoso caballero es don Dinero, don Ernesto.» y está pendiente del sí de Pablo.
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
- `probe.sh` lo lanza Pablo, en vivo.

## Estado al 4 oct (instantánea)

- Eggs nuestros, 4 de 6 conocidos: Sharp ear (Abuela t505), LAT-13 (banco t1021), Trickster tricked (Pícaros t1308) y Castizo (Abuela t1339).
- Plan de sondas:
  - N.º 1 Chato «Plaza Mayor, con caña» = MISS en t1475 (hilo 2224; 3 fallos literales; lo han sacado t10 y t08). Recomienda dejarlo.
  - Pendientes (las lanza Pablo): n.º 2 Abuela «cocido con tres vuelcos» (~50 %, carta); n.º 3 Pilar «cromo imposible / lince» (~15-20 %; si falla, Pilar cerrada); n.º 4 Pícaros «timo del nazareno» (~8 %); n.º 5 Abuela «caja de galletas» (~10 %, ≥ 5 ticks después de la n.º 2).
  - N.º 0 banco: excluido, esperando la confirmación directa de Pablo.
- Últimos commits: d70a71b (`GameState.eggPlan` y tabla Probe plan), 57afc34 (flujo entero por egg), 203c5ef (línea del Chato literal), 76dc0ce (play deja los hilos ajenos).

## Ficheros clave

`src/hints/egg-plan.ts`, `src/dealers/negotiation/messages.ts` (`GREETINGS`), `viewer/server/bazaar/profile/{eggs,egg-flow}.ts` y su `AGENTS.md`, `viewer/src/screens/profile/Eggs.tsx`, `.omc/specs/deep-dive-eggs-resto.md` y `deep-dive-trace-eggs-resto.md`, `docs/bazaar/personas.md` §6, `results/probe.sh`, `results/close.sh`, `results/bazaar-live/<fecha>/{stream-public,stream-team}.jsonl`, `personas.json` y `hints.jsonl`. Memorias: egg-literal-phrase, probe-stakes-before-each, hidden-cards-never-sold, banco-sunday-plan.

## Comunicación

- coordinator: hashes para reiniciar play o el visor, estado de las sondas, health checks. Le pasa peticiones de Pablo (como la sonda del banco), que no ejecuta sin el sí directo de Pablo.
- dealers: líneas de egg dentro de regateos reales; perfil del banco.
- goals: cuando una sonda o línea pasa a estar en vivo.
- Pablo: cada sonda con el comando, lo que nos jugamos y el coste; él la lanza.
