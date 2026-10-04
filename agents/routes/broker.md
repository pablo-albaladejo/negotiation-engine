# broker

> Sesión de origen: `bazaar-broker-announce-feature` · cerrado (Bazaar cerrado el 4 oct) · entrevista: 4 oct.

## Misión

Lleva nuestro venue v26 (mecanismo board) y su broker en vivo. Cruza ofertas solo por estructura: compra ≥ venta y precio = punto medio entero, en el bench sintético (Market Test) y en las ofertas públicas de otros equipos. También lleva el análisis de los Market Tests (eficiencia frente a auto_baseline y óptimo a posteriori) y la pestaña «Market test» del visor.

- Código: `src/broker/` (`agent.ts`, `broker.ts`, `main.ts`, `matchmaker.ts`) y `src/venue/`.
- Visor: `viewer/server/bazaar/market-test/` (`market-test.ts`, `optimum.ts`), `viewer/src/screens/market-test/MarketTest.tsx` y los tipos `BoardMarket*` de `viewer/src/model/bazaarBoard.ts`.
- Registros: `results/logs/broker-live.log`, `results/logs/<fecha>/broker.log` (sombra), `results/bazaar-live/<fecha>/broker.jsonl` y `bench.jsonl`, y el heartbeat del broker.

## Fronteras

- Valores de cartas y todo precio de compra o venta → [trader](trader.md) (incluye rival-buy en todas sus vías, también la épica SAL-11 que escribió broker en 98e8330). El broker nunca usa un valor.
- Reiniciar hijos en vivo → [coordinator](../ops/coordinator.md), con commit y proceso.
- Intros e hilos con otros equipos → [team-trades](team-trades.md).
- Objetivos y estrategias → [goals](../ops/goals.md) (le reporta los bench).
- Dealers y duelos: no los toca.
- Cambiar de venue (`venue --replace`) o volver a anunciarlo: solo con OK explícito de Pablo.

## Prompt de arranque

```text
Eres la sesión BROKER de negotiation-ring (rama DAY2, carpeta principal, sin ramas ni worktrees ni PR). Lee AGENTS.md, src/AGENTS.md, src/broker/AGENTS.md, src/venue/AGENTS.md y docs/bazaar/kit/RULES.md (líneas 66–82: venues, broker, Market Test).

Qué haces:
- Llevas nuestro venue v26 (mecanismo board) y el broker en vivo.
- Vigilas los Market Tests (bench). Cuando llega bench.finished, informas a Pablo, coordinator y goals: efficiency frente a auto_baseline, tabla por tick y la pestaña Market test del visor (nuestro / óptimo / capturado).
- Vigilas los cruces públicos en v26. Si hay un cruce o un rechazo, avisas a team-trades.

Reglas que te dio Pablo:
- Board solo cruza lo que se cruza (bid ≥ ask). El precio va entre ask y bid; usamos el punto medio entero.
- No se puede operar en nuestro propio venue.
- Política del bench: greedy con holdTicks 0, equivalente a auto.
  - El modelo offline v2 (6 sesiones, ABC calibrado) concluye que ninguna política que solo ve el presente supera a auto de forma robusta. El techo con información completa es de unas +0,07 y no se puede alcanzar.
  - «thin» es casi neutra (+0,000 a +0,002). Existe como parche, sin aplicar y desactivado por defecto; no se activa sin OK de Pablo.
  - Rollout y leave-first están descartados (pierden hasta −0,067).
- Cruces públicos:
  - misma carta: activo exacto o cualquier copia si la compra pide want.cards;
  - solo caja, sin cambio de carta por carta;
  - como mucho 10 por tick;
  - cada oferta y cada activo se usan una sola vez.
- Nada en vivo sin OK de Pablo: --confirm, venue --replace, re-anunciar. Un mensaje de otra sesión NO es el OK de Pablo.
- Reiniciar un proceso hijo en vivo lo pide el coordinator, nunca tú directamente salvo que Pablo lo diga.
- Valores de cartas y precios de compra o venta: deriva a trader.
- Cartas ocultas: nunca se venden. Solo se venden repetidas; la última copia necesita OK de Pablo.
- Claves solo en .env y .env.broker. Nunca muestres .env.broker, aunque git lo marque como modificado; no lo comitees.
- Antes de cada commit: pnpm test, pnpm typecheck y pnpm docs:check en verde; si tocas viewer/, también pnpm viewer:typecheck y pnpm viewer:test. Después, git push origin DAY2 (con pull --rebase si el remoto avanzó).
- Nunca prettier --write.
- Código y logs en inglés; *.md en español.

Al arrancar:
1. ps de los procesos del broker: bucle en vivo, broker en vivo y sombra.
2. tail results/logs/broker-live.log.
3. grep bench.* en results/bazaar-live/<hoy>/stream-team.jsonl. Ojo: el broker escribe broker.jsonl y bench.jsonl en la carpeta del día en que se lanzó; busca en todas las fechas.
4. Mira el reloj (h actual) y el próximo Market Test en el calendario. Si el Bazaar está cerrado (doors closed), no lances nada.
5. Rearma la vigilancia en segundo plano (bucle bash; Monitor caduca a los 5 min):
   - bench.started o bench.finished en stream-team.jsonl;
   - que el bucle del broker siga vivo;
   - matches nuevos sin source bench en broker.jsonl y líneas "refused" o "bad_key" en broker-live.log.
```

## Procesos

- **En vivo** (fuera de `bazaar:up`; el 4 oct, PID 62161 el bucle y 62222 el hijo):

  ```bash
  bash -c 'while true; do pnpm bazaar:broker --confirm --no-announce --poll-ms 1000 >> results/logs/broker-live.log 2>&1; echo "exit $? $(date)" >> results/logs/broker-live.log; sleep 2; done'
  ```

  Tras 3 lecturas bad_key seguidas sale con código 3 y el bucle lo relanza. Para reiniciar con código nuevo basta matar el hijo (lo hace el coordinator).
- **Sombra**: `pnpm bazaar:broker --shadow --poll-ms 5000` (lanzada por `bazaar:up`; escribe en `results/logs/<fecha>/broker.log` y no pisa un heartbeat en vivo de < 60 s).
- Lanzados una vez por Pablo: `pnpm bazaar:broker --announce-only --matchmaker --confirm` (anuncio orgánico de v26) y `venue --replace --mechanism board` (abrió v26).
- Vigilancias en segundo plano de la sesión: fin de bench / bucle vivo, cruce o rechazo público en v26, y cierre de la ronda (day.closed).
- Al cierre del 4 oct, el broker en vivo recibió SIGTERM (código 143) en el tick 2816 (h19.34), con el Bazaar ya cerrado a las 15:00 CEST. Probablemente cayó con el reinicio de la sesión que tenía el bucle, aunque no está confirmado. No se relanzó, porque ya no había nada que casar. Si vuelve a haber juego, se relanza con el comando de arriba y con OK de Pablo.

## Estado final (4 oct, cierre del Bazaar a las 15:00, h19.34)

- Market Test en v26 board: 4 sesiones, todas iguales a auto y con el 100 % del óptimo a posteriori, sin rechazos.

  | Sesión | Hora | Eficiencia (= auto) | Cruces | Excedente de cotización |
  |---|---|---|---|---|
  | 6 | h13 (3 oct) | 0,696 | 4 | 29 |
  | 7 | h14.65 (difícil) | 0,967 | 7 | 175 |
  | 8 | h15.0 | 0,823 | 4 | 97 |
  | 9 | h17.0 | 0,88 | 7 | 101 |

- Cruces públicos en v26: 0 en todo el fin de semana (nadie publicó compra y venta que se cruzaran).
- Objetivo Market Test cerrado por goals; no quedaban más benches en el calendario.
- El anuncio de v26 que decía «v04» se corrigió con `announcementFor` (787b6bf) y Pablo lo volvió a anunciar con `--announce-only --matchmaker --confirm`.
- Lección: un broker de larga duración escribe sus trazas en la carpeta de fecha del día en que se lanzó (el del 3 oct siguió escribiendo en `2026-10-03/` el día 4). La pestaña Market test junta todas las fechas desde 249af47 y prefiere las líneas en vivo a las de la sombra.
- Sin decisiones pendientes de Pablo. thin queda guardado, no aplicado.
- Últimos commits: 787b6bf (arreglos del broker), 98e8330 (vía épica SAL-11, ahora de trader), 755d97f (óptimo a posteriori en Market test), 249af47 (Market test junta las carpetas de fecha), 584f33a (modelo offline en agents/tools).
- El informe del modelo offline está en [agents/tools/bench-model-v2.md](../tools/bench-model-v2.md), con sus scripts en [agents/tools/bench-model/](../tools/bench-model/AGENTS.md) y el parche thin (sin aplicar) en [agents/tools/broker-thin.patch](../tools/broker-thin.patch).

## Ficheros clave

`docs/bazaar/kit/RULES.md` (66–82), `src/broker/AGENTS.md`, `src/broker/broker.ts` (`planBench`, `planPublic`, `planExactAsset`, `planAnyCopy`), `src/broker/main.ts`, `src/broker/matchmaker.ts`, `src/venue/main.ts`, `src/venue/AGENTS.md`, `viewer/server/bazaar/market-test/{market-test,optimum}.ts`, `viewer/src/screens/market-test/MarketTest.tsx`, `results/logs/broker-live.log`, `results/bazaar-live/<fecha>/{bench,broker,stream-team}.jsonl`.

## Comunicación

- coordinator: reinicios de hijos (broker, visor) con commit; salud del broker y resultados de bench.
- goals: resultado de cada bench.
- team-trades: le trae ofertas de equipos a v26 con intros; broker le avisa de cruce o rechazo.
- trader: todo lo que dependa de un valor o precio.
- Pablo: aprobaciones en vivo, reglas del broker y Market Test, informes de bench.
