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
| `broker` | `pnpm bazaar:broker --dry-run` en bucle, cada 5 s: **broker en sombra** del Market Test. Siempre dry-run. | — |

- **Logs:** `results/logs/<fecha>/<proceso>.log` (con hora) y `up-events.log` (arranques, caídas, reinicios). Con `--detach`, la salida de up va a `up.log`.
- **Latido:** `results/logs/up-status.json` cada 10 s: pid, modo, visor, estado y reinicios de cada proceso, último tick visto, reloj.
- **Caídas:** un proceso que cae se reinicia con espera creciente (2 s → 60 s), como mucho 5 veces en 10 min; después queda `failed` en el latido y en `up-events.log`.
- **Trazas en vivo:** `results/bazaar-live/<fecha UTC>/` (`decisions.jsonl`, `thread-N.jsonl`, `conversations.json`, `personas.json`, `triggers.json`, `flags.json`).

## Pasar a vivo (solo con aprobación del equipo)

```bash
pnpm bazaar:up --live --confirm     # aviso grande y hay que escribir LIVE; cualquier otra cosa cancela
```

Sin `--live --confirm` nunca es en vivo. Con `--detach` se confirma en la terminal antes de pasar a segundo plano. El broker en sombra sigue en dry-run también en vivo.

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
- Pasar a board solo si **el código lo recomienda** (la decisión la está construyendo otro agente en `src/venue`, `src/broker` y `src/state`) **y Pablo lo aprueba**: `--confirm --allow-venue-switch` (flag aún por llegar con esa decisión).

## Dónde se aprende cada tick

| Aprendizaje | ¿Dentro de `bazaar:play`? | Notas |
|---|---|---|
| Corpus de pistas (`results/bazaar-live/hints.jsonl`) | Sí, cada tick, también en dry-run | Solo añade. Nunca entra en una cifra. |
| Hoja de precios y caché de valores privados (`values.json`) | Sí, cada tick (≤ 4 GET de valor), también en dry-run | |
| Posterior por persona (`persona-posterior.json`, `src/dealers/history/persona-fit.ts`) | Sí, cada tick, también en dry-run | Curva, espejo y límite por banda de cada dealer. |
| Cursor de agenda y disparadores (`triggers.json`) | Sí; en disco solo en vivo | En dry-run vive en memoria: si `play` se reinicia, los disparadores vuelven a salir (solo se imprimen). |
| Memoria de conversaciones, personas y flags | Sí, solo en vivo | |
| Paciencia medida (`PatienceLog`) | Sí, por conversación | Va a la traza solo en vivo. |
| Fichas de dealers nuevos (disparadores) | Sí, solo en vivo | En dry-run solo dice qué escribiría. |
| Stream completo del día | No: proceso aparte | `recorder` en `bazaar:up`. |

**Huecos (no corren solos):**

- **Lecciones (`docs/bazaar/lessons.json`, `src/dealers/history/lessons.ts`)**: solo las escribe `pnpm bazaar --serious` (en vivo). `bazaar:play` no las apunta, y correr los dos a la vez se pisaría el cupo, así que no va como proceso aparte: hay que cablearlas en la ruta de dealers del coordinador (`src/coordinator/`, de otro agente).
- **Clasificar las pistas** (hint, egg-clue o voice): el corpus guarda la clasificación en null; el paso del LLM no existe aún.
- **Volcado del día** (`pnpm bazaar:dump`, ~600 peticiones): a mano al cerrar el día; no va en `bazaar:up` para no gastar cupo de la API.

## Supuestos que verificar en vivo

- La aceptación de un duelo comparte el cupo de una aceptación por tick del equipo (`DUEL_ACCEPT_QUOTA_ASSUMPTION`).
- `dealerCap = min(valor, book)` en neg_points (anomalía del día 1).
- En dry-run `play` espera con puertas cerradas; en vivo espera `bazaar:play` por su cuenta (`clockGate`). Comprobar al abrir (09:00) que `play` arranca solo (`up-events.log`: «puertas abiertas»).
- Recorder + `bazaar:play` + broker en sombra + visor no superan el límite de peticiones: vigilar `rate_limited` en `play.log` y `broker.log` (en la prueba salió `board v04: rate_limited` con el doctor y el bucle a la vez).
- Con `--detach`, `pnpm bazaar:down` encuentra el pid en el latido; si se borra `results/logs/`, hay que parar a mano.
