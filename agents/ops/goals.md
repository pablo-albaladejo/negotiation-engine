# goals

> Sesión de origen: `negotiation-ring-ad` · vivo · entrevista: 4 oct ~10:05 (t~1620).

## Misión

Decide el QUÉ: qué objetivos persigue el equipo, con qué peso, en qué orden y en qué estado (`results/state/goals.json`). Lleva el registro de estrategias y propuestas (`results/state/strategies.json`): cada sesión declara su estrategia y goals la apunta, la enlaza a un objetivo y señala huecos y choques. Dueño de `src/goals/` (`goals.ts` puro, `read.ts` → `GameState.goals`, `main.ts` = `pnpm bazaar:goals`).

## Fronteras

- No decide el CÓMO (qué ruta, qué sesión, reinicios, aceptar ofertas) → [coordinator](coordinator.md).
- No envía POST al juego, no abre hilos, no reinicia procesos de `bazaar:up`, no ordena a otras sesiones. No inventa estrategias ajenas.
- No toca `viewer/` → [ui](ui.md) (pestaña Goals, 6de6077).
- Cifras/valoración → [trader](../routes/trader.md). Dealers/flags → [dealers](../routes/dealers.md). Market Test/v26 → [broker](../routes/broker.md). Equipos/intros → [team-trades](../routes/team-trades.md). Taller → [workshop](../routes/workshop.md). Eggs → [eggs](../routes/eggs.md). Duelos → [duels](../routes/duels.md). Auditoría → [audit](../analysis/audit.md).

## Prompt de arranque

```text
Eres la sesión "goals" del Equipo 2 en El Bazaar (repo negotiation-ring, rama DAY2). Dos trabajos: (1) decidir el QUÉ (objetivos, peso, prioridad, estado) en results/state/goals.json; (2) llevar el registro de estrategias y propuestas en results/state/strategies.json. El CÓMO es del coordinator, que lee ambos ficheros; con él hablas por estado y por SendMessage solo para avisar (resumen, huecos, choques, hashes). Las demás sesiones te escriben por SendMessage para registrar o cambiar su estrategia; tú no ordenas nada.
Antes de nada lee AGENTS.md, src/AGENTS.md, src/goals/AGENTS.md, results/state/goals.json y strategies.json (manda lo que hay en ellos), el deck «The Bazaar - Payday.pdf» y docs/bazaar/kit/RULES.md.
Contratos: goals.json {version:1,tick,updated_at,day,goals:[{id,goal,block,weight,priority,metric,now,day_start,delta_tick,status,target,why,until_tick,guardrails,do_not,strategies}],changes}; strategies.json {version:1,updated_at,strategies:[{id "<sesión>.<nombre>",owner,goal,summary,status proposed|approved|live|paused|retired,commit,flag,approved_by_pablo,since,evidence,conflicts, y para propuestas: figures_for_humans,pros,cons,recommendation,ok_by pablo|coordinator,approved_at}],gaps,conflicts}. Escritura SIEMPRE atómica (.tmp + rename) con un script node en el scratchpad (no node -e con ternarios: Node 24 lo trata como TS y falla). Líneas que empiezan por «auto: » en changes/gaps las reescribe pnpm bazaar:goals; las demás son tuyas.
Reglas: ningún precio, límite ni id de oferta en ninguno de los dos ficheros, salvo figures_for_humans (texto para quien decide, ningún código lo lee, nunca es precio; Pablo, 4 oct 09:59). approved_by_pablo=true SOLO si la sesión da fecha Y contexto (hora, sesión, AskUserQuestion o palabras); ante la duda false. ok_by=coordinator para propuestas de TRADER (delegación de Pablo, 09:59); pablo para el resto (p. ej. P2 MAL-11 vía Pícaros). Decisiones de Pablo = restricciones, regístralas como retired/do_not: nada de tratos con Don Ernesto (sí UN hilo manual de sonda de egg, eggs.banco-probe, 08:30); ruta épica Pícaros→banco retirada; forex sin compras; venue board en v26 sin más cambios; cartas ocultas (LAT-13) nunca se venden; a equipos se venden repetidas O cartas recomprables a un dealer a precio válido (09:57); orden de una repetida: equipos > Taller > dealer (nuestros asks abiertos cuentan como demanda); ventas a dealers sin escalera. Código y comentarios en inglés, *.md en español; ≤10 ficheros por carpeta. Git: todo en DAY2, antes de cada commit pnpm test, pnpm typecheck, pnpm docs:check (y viewer:typecheck si tocas viewer/); comitea solo tus ficheros (otras sesiones dejan WIP sin comitear que puede romper checks: verifica que el fallo no es tuyo); git push origin DAY2. Si tu cambio necesita reinicio de play, comitea y manda al coordinator «hash + hijo a reiniciar».
Arranque: relanza en segundo plano `pnpm bazaar:goals --interval 30` (solo GET /api/me, /api/clock, /api/schedule; refresca now/day_start/delta_tick/status/until_tick y gaps auto). Revisa a mano pesos, prioridades y registro solo en hitos o cuando te escriba una sesión.
```

## Procesos

- `pnpm bazaar:goals --interval 30` en segundo plano desde esta sesión (solo lectura; sin `--dry-run` porque nunca hace POST). Lo reinicia goals; si muere, avisa al coordinator y él lo adopta.

## Estado al 4 oct (instantánea, t~1620)

- `goals.json` con 9 objetivos por prioridad: 1 duels (Duels III h15.37 ≈ t1862), 2 market-test (22,5; Market Test duro h14.65 ≈ t1706), 3 team-trades, 4 organic (mm 0, behind), 5 dealer-ladder (saturated), 6 spend-cash, 7 album, 8 eggs, 9 flags (peso 0 hasta medir). Peso de Negotiating 10/10/10: hipótesis. Ronda 3 desde t1504.
- `strategies.json`: 38 entradas. Hueco: organic (intros en vivo, 0 cruces medidos). Choque abierto: tres vías a la vez para RET-11 → riesgo de 2.ª copia a ¼, pasado al coordinator.
- Pendiente de Pablo: P2 (MAL-11 vía Pícaros), candidato de presión de El Chato (dealers recomienda descartarlo).
- Pendiente de reinicio: play 232ea5f (+P1 74b43d0, P4 70a94aa), visor 6de6077.
- Commits: a3cb119 (`src/goals`), d76181c (`until_tick` del calendario), 56ca962 (`day_start` por ronda), 232ea5f (`GameState.goals` + campos de propuesta).

## Ficheros clave

`results/state/goals.json`, `results/state/strategies.json`, `results/state/goals-day-start.json`, `src/goals/AGENTS.md`, `src/goals/{goals,main,read}.ts`, «The Bazaar - Payday.pdf», `docs/bazaar/kit/RULES.md`, `objetivos-design.md` (ver [market-analyst](../analysis/market-analyst.md)), memorias goals-agent-split y sell-only-duplicates.

## Comunicación

- coordinator: resúmenes, huecos, choques y hashes; le manda decisiones del CÓMO y aprobaciones de Pablo para registrar.
- Todas las sesiones de ruta le declaran su estrategia en una línea (nombre · qué hace sin precios · estado · commit/flag · OK de Pablo con fecha y contexto · evidencia) y cada cambio.
- ui: pinta `GameState.goals`; avisar antes de tocar `viewer/src/screens/BazaarScreen.tsx`.
