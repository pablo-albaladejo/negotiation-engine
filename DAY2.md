# Día 2 — Runbook: arrancar, vigilar, parar

Un comando arranca todo; otro comprueba antes que funcionará. Detalle de los scripts: [`scripts/ops/AGENTS.md`](scripts/ops/AGENTS.md). Estado y datos del día: [`DAY1.md`](DAY1.md).

## Arrancar

```bash
pnpm bazaar:doctor          # ✓/✗ de todo; --fast se salta typecheck, test y docs:check
pnpm bazaar:up              # doctor + los cuatro procesos, en DRY RUN (ningún POST)
pnpm bazaar:up --fast --detach   # igual, en segundo plano con nohup
pnpm bazaar:down            # para lo arrancado con --detach (o desde otra terminal)
```

En primer plano, **Ctrl-C para todos los procesos**. El doctor sale con 1 si algo falla (`bazaar:up` no arranca nada) y con 3 si solo falta `.env.broker` (arranca sin el broker en sombra).

| Proceso | Qué hace | Dónde escribe |
|---|---|---|
| `recorder` | `pnpm bazaar:record`: graba el stream (team y public). Lo único que guarda el feed entero. | `results/bazaar-live/<fecha>/stream-*.jsonl` |
| `viewer` | `pnpm viewer` en http://127.0.0.1:5199/#bazaar. Si ya hay un visor en 5199 se reutiliza; si otro proceso ocupa el puerto, usa el siguiente libre. | — |
| `play` | `pnpm bazaar:play` en bucle, **dry-run**: estado, agenda, disparadores, intenciones y arbitraje cada tick. En dry-run espera con las puertas cerradas o el reloj en pausa (`--no-gate` para correrlo igual). | corpus de pistas, caché de valores y posterior por persona en `results/bazaar-live/` |
| `broker` | `pnpm bazaar:broker --shadow --poll-ms 5000` en bucle: **broker en sombra** del Market Test. `--shadow` = `--dry-run --no-announce`; siempre, también con `--live`, salvo `--broker-live` (ver abajo). | — |
| `news` | `pnpm bazaar:news`: noticias de Radio Rastro (stream del recorder y `GET /api/news` cada 30 s) y un resumen (LLM o reglas) para el panel «Radio Rastro» de Now. Solo mostrar. | `results/bazaar-live/<fecha>/news.jsonl` y `news-summary.json` |

- **Logs:** `results/logs/<fecha>/<proceso>.log` (con hora) y `up-events.log` (arranques, caídas, reinicios). Con `--detach`, la salida de up va a `up.log`.
- **Latido:** `results/logs/up-status.json` cada 10 s: pid, modo, visor, estado y reinicios de cada proceso, último tick visto, reloj.
- **Caídas:** un proceso que cae se reinicia con espera creciente (2 s → 60 s), como mucho 5 veces en 10 min; después queda `failed` en el latido y en `up-events.log`.
- **Trazas en vivo:** `results/bazaar-live/<fecha UTC>/` (`decisions.jsonl`, `thread-N.jsonl`, `conversations.json`, `personas.json`, `triggers.json`, `flags.json`).

## Pasar a vivo (solo con aprobación del equipo)

```bash
pnpm bazaar:up --live --confirm     # aviso grande y hay que escribir LIVE; cualquier otra cosa cancela
```

Sin `--live --confirm` nunca es en vivo. Con `--detach` se confirma en la terminal antes de pasar a segundo plano. El broker en sombra sigue en dry-run también en vivo.

`--broker-live` cambia el broker en sombra por uno en vivo (`pnpm bazaar:broker --confirm --poll-ms 5000`, casa ofertas de verdad): solo vale junto a `--live --confirm`; sin ellos avisa y deja el broker en `--shadow`. En vivo con `--broker-live` solo hay un broker (no se lanza también el de sombra). Por defecto no cambia nada.

**Antes de pasar a vivo:**

1. `pnpm bazaar:doctor` todo en ✓ (sin `--fast`).
2. Un ciclo en dry-run con las puertas abiertas: las intenciones de `play.log` tienen sentido (cifra, contraparte, activo) y no hay `route … failed`.
3. Caja y suelo: `--cash-floor` (20 por defecto), `--max-spend-hour` (60) y `--max-spend` (150) de `bazaar:play` son los acordados; se cambian con `--play-args "--max-spend 100"`.
4. Nadie más juega con la misma clave (ni `pnpm bazaar --serious` ni otro `bazaar:up`): dos procesos se pisarían el cupo de una aceptación por tick.
5. Recorder conectado (`[team] conectado` en `recorder.log`); el límite es 6 streams por clave.

**Qué mirar en el visor (pestaña Now):** tick y puertas avanzan; caja y gasto de la hora dentro de los topes; conversaciones abiertas (≤ 6) sin hilos atascados; que cada aceptación respete el valor; avisos, strikes o cooloff de un dealer. Si algo raro: `pnpm bazaar:down` (o Ctrl-C) y volver a dry-run.

## Market Test

- El venue sigue en **auto**: en el Market Test, auto da **la mitad de los puntos**.
- El broker en sombra (`broker` en `bazaar:up`) mide en dry-run qué habría cruzado nuestro broker con el bench, para comparar con auto. No envía nada.
- Pasar a board solo si **el código lo recomienda** (`decideMechanism` en `src/venue/mechanism.ts`: ≥ 2 sesiones medidas, ratio ≥ 1,10, peor sesión ≥ 0,95 y caja suficiente) **y Pablo lo aprueba**: `pnpm bazaar:play --confirm --allow-venue-switch` (`venueSwitchGate`, `src/venue/route.ts`). Hoy `executeVenueMechanism` solo imprime los pasos: el cierre del venue del kit está sin probar.

### Runbook: pasar v04 a board tras el Market Test (necesita el OK de Pablo)

Por qué (tick 479, `GET /api/leaderboard` y `/api/venues`): el mercado por encima de 7,5 lo da el **valor creado entre otros equipos en nuestro venue** (RULES: no se puede operar en el propio venue), no el mecanismo. t14 y t17 (auto, con 1 trade) sacan 11,86 y 10,26; t13 y t03 (board, 0 trades) sacan 5,49 y 3,61. Los líderes board (t10, t12) casan pujas **«cualquier copia»** (`want.cards`), algo que el puesto auto no hace. Ese es el motivo para cambiar. Un board que solo case por cotización iguala al auto (mitad del bench) y, si falla, baja de 7,5.

1. **Cuándo:** después del Market Test del tick ~681 (sesiones cada 2 h: 201, 441, 681…). Si en una sesión no hay venue abierto, puntúa 0. Por eso, no cerrar v04 en los 20 ticks anteriores a una sesión.
2. **Caja:** abrir cuesta 250 P de fianza + 20 P; la fianza de v04 vuelve tras un periodo de espera de duración desconocida. Hacen falta **≥ 290 P** libres (270 + suelo de 20). En el tick 479 había **201 P** (faltan 89). Las únicas repetidas (LAT-04, SAL-03) valen menos de 4 P: no cubren el hueco. Hay que dejar de gastar en El Rastro hasta tenerlos (choca con subir `--max-spend` a 250), nunca vendiendo copias únicas de página.
3. **Antes:** comprobar en `broker.log` (sombra) que el casado «cualquier copia» encuentra pares en el libro real.
4. **Pasos** (cada uno con OK):
   - Cerrar v04: `POST /api/venues/v04/close` (equipo).
   - `pnpm bazaar:venue --mechanism board --confirm`, con nombre y descripción que anuncien «any copy, 0 fee». Guarda la clave nueva en `.env.broker`.
   - Parar el broker en sombra y lanzar `pnpm bazaar:broker --confirm`, o reiniciar `bazaar:up --live --confirm --broker-live` (lo coordina la sesión que lleva los reinicios).
5. **Vigilar:** `broker.log` (matches por tick), `mm_points` y `market` en `/api/leaderboard`. Si el broker cae, el venue no casa: reiniciarlo antes de la siguiente sesión.

## Dónde se aprende cada tick

| Aprendizaje | ¿Dentro de `bazaar:play`? | Notas |
|---|---|---|
| Corpus de pistas (`results/bazaar-live/hints.jsonl`) | Sí, cada tick, también en dry-run | Solo añade. Nunca entra en una cifra. |
| Hoja de precios y caché de valores privados (`values.json`) | Sí, cada tick (≤ 4 GET de valor), también en dry-run | |
| Posterior por persona (`persona-posterior.json`, `src/dealers/history/persona-fit.ts`) | Sí, cada tick, también en dry-run | Curva, espejo y límite por banda de cada dealer. |
| Cursor de agenda y disparadores (`triggers.json`) | Sí; en disco solo en vivo | En dry-run vive en memoria: si `play` se reinicia, los disparadores vuelven a salir (solo se imprimen). |
| Memoria de conversaciones, personas y flags | Sí, solo en vivo | |
| Lecciones (`docs/bazaar/lessons.json`) | Sí: en vivo se apuntan; en dry-run solo se imprime «would append» | Mismas funciones que `--serious` (`PendingLessons`, `appendLesson`). |
| Paciencia medida (`PatienceLog`) | Sí, por conversación | Va a la traza solo en vivo. |
| Fichas de dealers nuevos (disparadores) | Sí, solo en vivo | En dry-run solo dice qué escribiría. |
| Stream completo del día | No: proceso aparte | `recorder` en `bazaar:up`. |

**Huecos (no corren solos):**

- **Clasificar las pistas** (hint, egg-clue o voice): el corpus guarda la clasificación en null; el paso del LLM no existe aún.
- **Volcado del día** (`pnpm bazaar:dump`, ~600 peticiones): a mano al cerrar el día; no va en `bazaar:up` para no gastar cupo de la API.

## Supuestos que verificar en vivo

- La aceptación de un duelo comparte el cupo de una aceptación por tick del equipo (`DUEL_ACCEPT_QUOTA_ASSUMPTION`).
- neg_points suma el valor ganado a valor privado, sin tope y sin restar la comisión (medido el sábado, un solo agregado; verificar con un Δ aislado tras el próximo trato): [`docs/bazaar/neg-points-formula.md`](docs/bazaar/neg-points-formula.md). Sustituye al supuesto `dealerCap = min(valor, book)`.
- En dry-run `play` espera con puertas cerradas; en vivo espera `bazaar:play` por su cuenta (`clockGate`). Comprobar al abrir (09:00) que `play` arranca solo (`up-events.log`: «puertas abiertas»).
- Recorder + `bazaar:play` + broker en sombra + visor no superan el límite de peticiones: vigilar `rate_limited` en `play.log` y `broker.log` (en la prueba salió `board v04: rate_limited` con el doctor y el bucle a la vez).
- Con `--detach`, `pnpm bazaar:down` encuentra el pid en el latido; si se borra `results/logs/`, hay que parar a mano.

## Verificar en vivo el sábado

- [ ] **Market Test, tras el primer bench:** en `results/bazaar-live/bench-sessions.json`, `pairsAuto` > 0 y `autoUnknown` false. Si no, arreglar la forma de `recent` de `/api/broker/book` en `parseRecentBenchFills` (`src/broker`).
- [ ] La clave del broker lee `/api/schedule`.
- [ ] Endpoint de cierre del venue y su cooldown de la fianza, **antes** de cualquier cambio.
- [ ] Caja: 40 P esta noche. Cambiar exige 250 + 20 + suelo; los 150 P de la subvención llegan a las 09:05.
- [ ] Dealers: welcome-counter con un dealer nuevo; probes de eggs; flags de presión (solo con aprobación); cuánto se desvía la predicción del ajuste de curva; cortesía.
- [ ] ¿La aceptación de un duelo comparte el cupo de aceptaciones del equipo? ¿Abrir un sobre lo usa? ¿El venue auto cruza sin nuestra aceptación?

## Con cada dealer

- **Dealer nuevo:** nuestra primera conversación debe ser **venderle** algo. La bienvenida de Abuela compró una común a 13, ~2,2× su techo normal (~5,8). Esa conversación mide su límite de bienvenida y queda fuera del ajuste de la curva.
- **Chato:** pasos grandes y constantes, y paciencia (copia el paso que damos, no se mueve hasta r ≈ 2–3). `bazaar:play` ya enciende la primera concesión grande solo contra él.
- Estimaciones de Abuela y Chato: [`docs/bazaar/dealer-fit-2026-10-03.md`](docs/bazaar/dealer-fit-2026-10-03.md).
