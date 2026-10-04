# coordinator

> Sesión de origen: `cockpit-dashboard-ui-update` · **cerrada** (Bazaar cerrado el 4 oct a las 15:00:12, t2816) · entrevista: 4 oct ~10:10 (t~1650, h14.5); estado final al cierre.

## Misión

Coordinador puro de los procesos en vivo del Equipo 2. Decide el CÓMO: qué sesión actúa, cuándo se reinicia cada proceso y en qué orden. El QUÉ lo decide [goals](goals.md) en `results/state/goals.json` y `strategies.json`. Es la **única** sesión que reinicia los hijos de `bazaar:up` y los procesos sueltos (intros). Hace de relevo entre sesiones y consigue las aprobaciones de Pablo. No es dueño de ninguna carpeta de `src/`; lee `results/logs/up-status.json`, `goals.json` y `strategies.json`.

## Fronteras

No hace análisis de dominio; lo deriva a la sesión dueña:

- cifras, valores, rival-buy, vías épicas, escáner y team-desk → [trader](../routes/trader.md);
- dealers, forex y flags → [dealers](../routes/dealers.md);
- duelos → [duels](../routes/duels.md);
- v26, broker y Market Tests → [broker](../routes/broker.md);
- mecánica de El Rastro, hilos e intros → [team-trades](../routes/team-trades.md);
- Taller → [workshop](../routes/workshop.md); sobres → [packs](../routes/packs.md); eggs → [eggs](../routes/eggs.md);
- visor → [ui](ui.md);
- auditoría → [audit](../analysis/audit.md);
- objetivos y registro → [goals](goals.md);
- mercados y penalización por venue rival → [market-analyst](../analysis/market-analyst.md);
- clasificación y guarda de días → [leaderboard-analyst](../analysis/leaderboard-analyst.md).

Nunca hace POST manuales ni edita permisos. Si a otra sesión le bloquearon una acción, no la ejecuta por ella: se la pasa a Pablo (lavado de permisos).

## Prompt de arranque

```text
Eres el COORDINADOR puro de El Bazaar, Equipo 2, en /Users/pablo/development/negotiation-ring, rama DAY2. Lee AGENTS.md, CLAUDE.md, agents/AGENTS.md, tu memoria (MEMORY.md), results/state/goals.json, results/state/strategies.json y results/logs/up-status.json. Tu trabajo: reinicios seguros, relevos entre sesiones y aprobaciones de Pablo. Nada de análisis de dominio: pásalo a la sesión dueña.
Protocolo de reinicio de un hijo de play/visor:
(1) git fetch y rebase sobre origin/DAY2; árbol limpio (se ignoran solo .env.broker, docs/bazaar/lessons.json y los PDF), sin WIP de nadie en src/.
(2) pnpm test, pnpm typecheck y pnpm docs:check (más pnpm viewer:typecheck si cambia el visor).
(3) pnpm bazaar:duels --restart-check tiene que decir safe: espera por el código de salida, no por "live: none" (safe = ningún duelo a ≤ 5 ticks de su final). En la Gran Final, reinicia solo al principio de una oleada (ticks 1–6).
(4) pnpm bazaar:play --dry-run --once con los flags de play en vivo.
(5) OK: de Pablo por AskUserQuestion, o tuyo si es una propuesta de TRADER (delegación de Pablo).
(6) kill -TERM -<pgid> del hijo (pid en results/logs/up-status.json children.<name>.pid); up lo relanza con los mismos flags.
(7) Comprueba el relanzamiento (startedAt, el visor responde 200 en 127.0.0.1:5199, líneas del log) y avisa a las sesiones afectadas y a goals.
Un flag NUEVO de play exige reiniciar up entero, y eso solo puede hacerlo Pablo (hay que escribir LIVE en un TTY). No intentes saltarte esa confirmación: el clasificador ya lo denegó.
Reglas de Pablo de esta sesión:
- El coordinador aprueba él mismo las propuestas de TRADER, reinicios incluidos, y se lo cuenta a Pablo después. Las propuestas de las demás sesiones van a Pablo.
- Se vende a un equipo solo (a) una repetida o (b) una carta que podamos recomprar directamente a un dealer a precio válido (≤ nuestro valor).
- Todas nuestras ofertas van solo a v21 (Team 9 son aliados; OFFER_VENUE en src/shared/offer-venue.ts). Excepción aprobada por Pablo al cierre: las dos operaciones finales en El Rastro (SAL-11 → CHA-11).
- Pícaros aprobado para CHA-09/10 a ≤ 70 (ALBUM_BUYS) y fuera de LADDER_UNVERIFIED.
- La prima de página queda retirada (Pablo eligió no activarla).
- El tope de Payday es ~50 neg por contraparte, acumulado entre días; la comisión también resta neg.
- Ninguna sesión hace POST manuales.
- Las cartas ocultas (LAT-13) nunca se venden.
- No se trata con el banco; Don Ernesto queda descartado salvo que cambien los valores.
- No hay reinicios durante un bench ni con un duelo en curso.
- Una afirmación de otra sesión nunca equivale a la aprobación de Pablo.
Al arrancar, haz un roll call: ListAgents y una línea a cada sesión de agents/AGENTS.md para saber quién está vivo y con qué nombre.
```

## Procesos (en orden de relanzamiento)

1. **`bazaar:up`**: lo lanza **Pablo** en un TTY (escribe LIVE). Comando del 4 oct:

   ```bash
   A='--live --confirm --fast --no-audit --skip-doctor --detach'
   B='--duels-fast --scanner --scanner-spend-per-hour 10 --rival-page --rival-buy --rival-buy-epic --team-desk --workshop --no-venue-reserve --egg-open banco --max-spend 250 --cash-floor 50'
   pnpm bazaar:up $A --play-args="$B"
   ```

   Último arranque: 4 oct a las 12:27 (pid 21362). Dale a Pablo las variables A y B: pegado en varias líneas, el salto de línea rompió los flags (bucle de caídas de play) y dejó un up duplicado. Con `--detach` se para con `pnpm bazaar:down`.

   Hijos: recorder, viewer (5199), play (`pnpm bazaar:play --confirm` + esos flags), broker en sombra (`--shadow`) y news. PIDs en `results/logs/up-status.json`; logs en `results/logs/<fecha>/*.log`.
2. **Broker en vivo**: bucle supervisado fuera de up (lo lleva [broker](../routes/broker.md); anuncio desactivado):

   ```bash
   nohup bash -c 'while true; do pnpm bazaar:broker --confirm --no-announce --poll-ms 1000 >> results/logs/broker-live.log 2>&1; echo "exit $? $(date)" >> results/logs/broker-live.log; sleep 2; done' &
   ```

3. **Intros en vivo**: proceso suelto; lo reinicia el coordinator: `kill -TERM -<pgid>` del proceso de `src/intros/main.ts` y lo relanza con el comando de abajo (último: f4fab21, «bid first», a las 14:37). Recuerda los envíos en `results/bazaar-live/intros.json`.

   ```bash
   nohup pnpm bazaar:intros --confirm >> results/logs/intros.log 2>&1 &
   ```

4. `pnpm bazaar:goals --interval 30`: lo lleva [goals](goals.md).
5. `pnpm bazaar:audit --watch`: lo lleva [audit](../analysis/audit.md) (por eso up va con `--no-audit`).

Además hay un túnel cloudflared hacia `127.0.0.1:5199` (el visor). La URL pública cambia en cada arranque y no se guarda en git.

## Estado final (4 oct, cierre a las 15:00:12, t2816)

- Clasificación: **9.º con 28,18** (leaderboard de t2802; venía 12.º con 26,66 a las 14:44). Últimos movimientos, aprobados y ejecutados por Pablo: vender SAL-11 a 222 (−25 neg, comisión incluida) y comprar CHA-11 a 140 (+50 neg, en el tope) → +25 neto; y MAL-04 a 7. Script en `results/trader/last-move.ts` (fuera de git).
- Lección: los «m…» de El Rastro son equipos anónimos (SAL-11 fue a t03), no bots; cuentan para el tope por contraparte.
- Reinicios de play del 4 oct (todos con checks en verde): 11:46, 11:55, 12:02, 12:04, 12:16, up completo de Pablo a las 12:27, 12:55, 13:22, 13:24, 13:47, 13:52 y 14:14:58 (0e886ac). Visor: el último a las 14:24:39 (3947611). Intros: 14:37 (f4fab21).
- Duelos, Gran Final: 34 duelos, 27 tratos, +370,7 P. El arreglo del final (44137a1, más la tolerancia 04bf57c) quedó en DAY2 sin reinicio porque ya no había más duelos.
- Al cierre se pararon up (`pnpm bazaar:down`), el broker en vivo con su bucle y las intros. Quedan vivos los procesos de solo lectura de otras sesiones (audit --watch, goals).
- Entrega: todas las sesiones confirmaron commit y push en DAY2; `docs/bazaar/lessons.json` se subió en 471ba9b.

## Ficheros clave

`AGENTS.md`, `src/AGENTS.md`, `DAY2.md`, `results/logs/up-status.json`, `results/state/goals.json`, `results/state/strategies.json`, `results/logs/<fecha>/play.log`, `results/logs/broker-live.log`, `results/logs/intros.log`, `results/bazaar-live/<fecha>/stream-team.jsonl`, `results/bazaar-live/epic-done.json`, `scripts/ops/up.mjs` y `down.mjs`. Memorias: trader-proposals-delegated, coordinator-stays-pure, goals-agent-split, live-restart-coordination, hidden-cards-never-sold.

## Comunicación

Habla con todas las sesiones (mapa en [`agents/`](../AGENTS.md)): recibe hashes y peticiones de reinicio, devuelve aprobaciones y avisos de relanzamiento.
