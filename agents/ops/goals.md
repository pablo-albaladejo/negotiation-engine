# goals

> Sesión de origen: `negotiation-ring-ad` · cerrada al terminar el Bazaar (4 oct, t~2816) · entrevista: 4 oct ~10:05 (t~1620).

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
Contratos: goals.json {version:1,tick,updated_at,day,goals:[{id,goal,block,weight,priority,metric,now,day_start,delta_tick,status,target,why,until_tick,guardrails,do_not,strategies}],changes}; strategies.json {version:1,updated_at,strategies:[{id "<sesión>.<nombre>",owner,goal,summary,status proposed|approved|live|paused|retired,commit,flag,approved_by_pablo,since,evidence,conflicts, y para propuestas: figures_for_humans,pros,cons,recommendation,ok_by pablo|coordinator,approved_at}],gaps,conflicts}. Escritura SIEMPRE atómica (.tmp + rename) con un script node pasado por stdin (`node --input-type=commonjs - <<'EOF' … EOF`) o en el scratchpad; nunca `node -e` con ternarios (Node 24 lo trata como TS y falla). Líneas que empiezan por «auto: » en changes/gaps las reescribe pnpm bazaar:goals; las demás son tuyas.
Reglas: ningún precio, límite ni id de oferta en ninguno de los dos ficheros, salvo figures_for_humans (texto para quien decide, ningún código lo lee, nunca es precio; Pablo, 4 oct 09:59). approved_by_pablo=true SOLO si la sesión da fecha Y contexto (hora, sesión, AskUserQuestion o palabras); ante la duda false. ok_by=coordinator para propuestas de TRADER (delegación de Pablo, 09:59); pablo para el resto (p. ej. P2 MAL-11 vía Pícaros). Decisiones de Pablo = restricciones, regístralas como retired/do_not: nada de tratos con Don Ernesto (sí UN hilo manual de sonda de egg, eggs.banco-probe, 08:30); ruta épica Pícaros→banco retirada; forex sin compras; venue board en v26 sin más cambios; cartas ocultas (LAT-13) nunca se venden; a equipos se venden repetidas O cartas recomprables a un dealer a precio válido (09:57); orden de una repetida: equipos > Taller > dealer (nuestros asks abiertos cuentan como demanda); ventas a dealers sin escalera; tope de puntuación ≈ 50 por contraparte y acumulado entre días; el álbum no tiene término propio en la puntuación (el bonus de página solo sube el valor privado y solo contaría vía trato) y la prima de página está retirada por Pablo (4 oct ~13:46); nuestras ofertas solo en v21 (aliados t09). Código y comentarios en inglés, *.md en español; ≤10 ficheros por carpeta. Git: todo en DAY2, antes de cada commit pnpm test, pnpm typecheck, pnpm docs:check (y viewer:typecheck si tocas viewer/); comitea solo tus ficheros (otras sesiones dejan WIP sin comitear que puede romper checks: verifica que el fallo no es tuyo); git push origin DAY2. Si tu cambio necesita reinicio de play, comitea y manda al coordinator «hash + hijo a reiniciar».
Arranque: relanza en segundo plano `pnpm bazaar:goals --interval 30` (solo GET /api/me, /api/clock, /api/schedule; refresca now/day_start/delta_tick/status/until_tick y gaps auto). Revisa a mano pesos, prioridades y registro solo en hitos o cuando te escriba una sesión.
```

## Procesos

- `pnpm bazaar:goals --interval 30` en segundo plano desde esta sesión. Es de solo lectura y no lleva `--dry-run` porque nunca hace POST. Lo reinicia goals; si muere, avisa al coordinator y él lo adopta.
- Si la sesión se reinicia, puede que el proceso siga vivo como huérfano. Compruébalo con `pgrep -fl goals/main.ts` y mira el `updated_at` de `goals.json` antes de lanzar otro.
- El coordinator no ejecuta este refresco.

## Estado final (4 oct, Bazaar cerrado, t~2816)

- `goals.json`: duels **done** (31,77; Gran Final 27/34 con trato, +370,7 P), team-trades **done** (105), market-test **done** (0,5; 4 benches seguidos empatados con auto, el último 0,88 = 100 % del óptimo), dealer-ladder **done** (0,036 → 0,174), organic open (3), spend-cash open (caja 617 → 175), album open (CHA 10/10 en t2110; sin término de puntuación), eggs y flags sin dato.
- `strategies.json`: 51 entradas (25 live, 20 retired, 3 proposed, 2 approved, 1 paused). Huecos manuales: organic y spend-cash. Las estrategias de duelos de la final y la prima de página quedan retired.
- Lo que se aprendió: `approved_by_pablo` solo con hora y contexto evitó varios «aprobado» de oídas (se confirmaron después vía coordinator); las cifras para humanos van solo en `figures_for_humans`; medir antes de pagar por encima del valor (el bonus de página no movió el marcador).
- El refresco `pnpm bazaar:goals` está parado (el Bazaar cerró). Commits: a3cb119 (`src/goals`), d76181c (`until_tick` del calendario), 56ca962 (`day_start` por ronda), 232ea5f (`GameState.goals` + campos de propuesta).

## Ficheros clave

`results/state/goals.json`, `results/state/strategies.json`, `results/state/goals-day-start.json`, `src/goals/AGENTS.md`, `src/goals/{goals,main,read}.ts`, «The Bazaar - Payday.pdf», `docs/bazaar/kit/RULES.md`, `objetivos-design.md` (ver [market-analyst](../analysis/market-analyst.md)), memorias goals-agent-split y sell-only-duplicates.

## Comunicación

- coordinator: resúmenes, huecos, choques y hashes; le manda decisiones del CÓMO y aprobaciones de Pablo para registrar.
- Todas las sesiones de ruta le declaran su estrategia en una línea (nombre · qué hace sin precios · estado · commit/flag · OK de Pablo con fecha y contexto · evidencia) y cada cambio.
- ui: pinta `GameState.goals`; avisar antes de tocar `viewer/src/screens/BazaarScreen.tsx`.
