# negotiation-ring — Contexto para Agentes de Código

Agente del Equipo 2 para **El Bazaar** (hackathon Causa Prima): un torneo de cromos de Madrid en el que negociamos con dealers, con otros equipos en El Rastro y en duelos 1 contra 1. **El código decide la cifra**; el texto es una plantilla con esa misma cifra.

**Entrada rápida:** [`DAY1.md`](DAY1.md) — estado, cómo jugar, horario, comandos y datos medidos. Arrancar el día: [`DAY2.md`](DAY2.md) (`pnpm bazaar:doctor`, `pnpm bazaar:up`). Contexto del día 1: [`handoff/2026-10-02/HANDOFF.md`](handoff/2026-10-02/HANDOFF.md).

## Reglas no negociables

- **La cifra sale siempre del código** (`src/engine/` + planificadores de `src/dealers/`, `src/duels/`…). Los mensajes son plantillas cuya única cifra es la decidida (`textMatchesPrice`, `textMatchesOffer`).
- **Del rival solo se lee la estructura** (ofertas y precios), nunca su texto. Tres excepciones estrechas, aprobadas: pistas de eggs (se guarda el texto que suena a pista); las noticias (`/api/news`, news.posted), que se leen como pista (de qué dealer, set o carta se habla) en `GameState.news`, nunca para una cifra y pueden ser rumor; y, para un flag (`src/flags/flags.ts`): comparar texto con estructura, y frases de presión de una lista cerrada en contraofertas; **nunca para una cifra**. Las frases de presión solo se envían con aprobación (`--approve-flags`).
- **Nunca se revela la valoración privada** ni el límite (`your_limit`).
- **Toda oferta pasa por `enforceGuardrails`**: no cruza el límite y es monótona.
- **Guardarraíles antes de aceptar**: forma de la oferta (`checkStructure`) y un activo en un solo sitio (`src/shared/asset-locks.ts`).
- **Nada en vivo sin aprobación**: los POST reales exigen quitar `--dry-run` y, donde aplica, `--confirm`.

## Idioma

- **Código, identificadores, comentarios y textos de desarrollo (logs, CLI, errores, UI) en inglés; la documentación (`*.md`) en español.**
- El texto que va al juego (plantillas, frases de sondeo, regex sobre texto de dealers) es dato y conserva su idioma.
- Lo comprueba `pnpm docs:check` (`scripts/check-english.mjs`): falla si un comentario del código está en castellano. Para conservar texto del juego, poner `game text` en un comentario de esa línea o de la anterior.

## Arquitectura

```
src/
├─ engine/    matemáticas puras: concesión, aceptación, guardarraíles, RNG
├─ shared/    cliente de la API, esquemas, claves, trazas, la cifra
├─ dealers/   negociar con Abuela y El Chato     (pnpm bazaar)
│   ├─ negotiation/  la cifra de cada mensaje y la forma de la oferta
│   ├─ planning/     qué comprar o vender a cada dealer
│   └─ history/      resumen por conversación y lecciones
├─ duels/     duelos 1 contra 1                  (pnpm bazaar:duels)
├─ trades/    El Rastro con otros equipos        (pnpm bazaar:trades)
├─ broker/    casar ofertas en nuestro venue     (pnpm bazaar:broker)
├─ venue/     abrir nuestro mercado              (pnpm bazaar:venue)
├─ status/    resumen de solo lectura            (pnpm bazaar:status)
├─ state/     GameState por tick, Conversation, personas, eggs y flags (solo GET)
├─ flags/     detector de mala fe: texto del dealer frente a la estructura de su oferta
├─ packs/     sobres: estado, comprar, abrir o vender cerrado (ruta de pnpm bazaar:play)
├─ markets/   mercados entre El Rastro y otros venues: hueco neto = hueco − comisión − penalización por rival (ruta de pnpm bazaar:play)
├─ hints/     corpus de líneas de dealers (pistas de eggs; nunca una cifra)
├─ agenda/    calendario como playbook y disparadores del feed (los usa pnpm bazaar:play)
├─ news/      noticias de Radio Rastro: visor y pista en GameState.news (nunca una cifra; pnpm bazaar:news)
├─ audit/     auditor de ineficiencias de solo lectura (pnpm bazaar:audit)
└─ coordinator/ coordinador por tick: limits, intenciones, arbitraje (pnpm bazaar:play)
test/        solo tests de guardarraíles (fast-check)
scripts/     escaneo de la API y comprobación de docs
docs/        lecciones de los dealers y kit oficial del Bazaar
viewer/         visor local del Bazaar (paquete independiente; server/bazaar/ = /api/bazaar/*)
design-system/  componentes React del visor (por alias, sin build; components/ y examples/ por familia)
handoff/     traspasos entre días (en git solo HANDOFF.md y AGENTS.md)
results/     trazas en vivo (fuera de git)
```

## Scripts `pnpm`

| Comando | Descripción |
|---------|-------------|
| `pnpm test` | Tests de guardarraíles (límite, cifra = texto, un activo en un sitio, topes). Deben pasar antes de cada commit. |
| `pnpm typecheck` | TypeScript. |
| `pnpm docs:check` | Enlaces e identificadores de los AGENTS.md, el árbol de carpetas (≤ 10 ficheros y un AGENTS.md enlazado por carpeta) y que los comentarios del código estén en inglés. |
| `pnpm bazaar` | Agente de dealers (`--serious`, `--dry-run`, `--once`, `--max-spend`, `--cash-floor`…). |
| `pnpm bazaar:duels` | Duelos 1 contra 1. |
| `pnpm bazaar:trades` | Ofertas entre equipos en El Rastro (en vivo con `--confirm`). |
| `pnpm bazaar:broker` | Broker de nuestro venue (en vivo con `--confirm`). |
| `pnpm bazaar:venue` | Plan de nuestro mercado (abrir exige `--confirm`; `--replace --mechanism board\|auto` cambia el venue: cierra el nuestro y abre otro, con caja ≥ 290 y lejos de un bench). |
| `pnpm bazaar:play` | Coordinador por tick: `GameState`, presupuesto de `clock.limits`, intenciones de duelos, dealers y El Rastro, arbitraje (`--dry-run --once`; en vivo sin `--dry-run` y con `--confirm`; ventas dirigidas a rivales solo con `--rival-page`, pujas dirigidas con `--rival-buy`; cambios carta por carta de nuestras repetidas con `--rival-swap`; escáner de dispersión de la ruta de mercados solo con `--scanner` (opt-in) y `--scanner-spend-per-hour` (60) como tope de compra; `--page-targets` (SAL-09) es el único objetivo de página y tiene tope en su base sin bonus hasta `--page-bonus-scored`, que lo sube a 0,9 × `your_value`; cada Δ de `neg_points` se audita trato a trato en `score-audit.jsonl`; sin pujas pasivas en El Rastro ni anuncios < 4 P (pujas, con `--rastro-bids`); reserva de cambio de venue: con caja < 290 P solo compras que cierran página, hasta que nuestro venue sea board, `--no-venue-reserve` la quita). |
| `pnpm bazaar:audit` | Auditor de ineficiencias de solo lectura: compras repetidas, ida y vuelta con pérdida, copia del álbum perdida, dos rutas a la vez, fallos repetidos; `--date` informe, `--watch` en vivo. |
| `pnpm bazaar:news` | Noticias del Bazaar (Radio Rastro, Boletín, El Tablón): `news.jsonl` y news-summary.json para el panel «Radio Rastro» del visor. Solo mostrar: nunca una cifra ni una decisión (`--once`, `--no-llm`). |
| `pnpm bazaar:doctor` | Comprueba que todo está listo (✓/✗): `.env`, Node, git, tests, API, puerto del visor y `bazaar:play --dry-run --once` (`--fast`). |
| `pnpm bazaar:up` | Doctor y recorder, visor, `bazaar:play`, broker en sombra, news y audit (`--no-audit` lo quita), en dry-run (en vivo: `--live --confirm`; `--broker-live` solo con ellos: broker con `--confirm` en vez de `--shadow`); `pnpm bazaar:down` para lo de `--detach`. Ver [`DAY2.md`](DAY2.md). |
| `pnpm bazaar:status` | Resumen de solo lectura: equipo, reloj, dealers e hilos. |
| `pnpm bazaar:scan` | GET a todos los endpoints, guarda las respuestas. |
| `pnpm bazaar:feed` | Mensajes nuevos de nuestros hilos en vivo (solo lectura). |
| `pnpm bazaar:record` | Graba el stream en vivo (`/api/events/stream`, team y public) en `results/` para reconstruir el día. |
| `pnpm bazaar:dump` | Volcado del estado y del día (cartas, hilos, duelos, feed) en `results/` (solo lectura). |
| `pnpm viewer` | Visor en http://127.0.0.1:5199/#bazaar |
| `pnpm viewer:typecheck` · `pnpm viewer:test` | TypeScript y tests del visor (antes de comitear si se toca `viewer/`). |
| `pnpm test:watch` | Tests de guardarraíles en modo watch. |
| `pnpm ds:test` | Test de seguridad del sistema de diseño (sin HTML inyectado). |

Detalle de cada pieza: [`src/AGENTS.md`](src/AGENTS.md).

## Variables de entorno

```bash
BAZAAR_URL=https://bazaar.causaprima.ai   # base de la API
BAZAAR_KEY=                               # clave del equipo (X-Team-Key), solo en .env
# BAZAAR_BROKER_KEY va en .env.broker (X-Broker-Key)
```

## Estructura de carpetas

- **Como mucho 10 ficheros versionados por carpeta**; si hay más, se crean subcarpetas por concepto.
- **Cada carpeta tiene un AGENTS.md corto en español** (qué vive ahí, puntos de entrada, reglas propias; sin repetir al padre) que enlaza al AGENTS.md del padre y al de cada subcarpeta.
- Exentas: la raíz no cuenta para el tope (la configuración de las herramientas tiene que vivir aquí); `results/` (trazas en vivo), `design-system/.design-sync/` (generado), `docs/bazaar/bundles/assets/` (copia literal del frontend) y `docs/bazaar/bundles/pretty/assets/` (su versión legible) quedan fuera del tope y sin AGENTS.md por subcarpeta.
- Lo comprueba `pnpm docs:check` (`scripts/check-agents-tree.mjs`).

## Links a subcarpetas

- [`src/`](src/AGENTS.md) — agente del Bazaar, una carpeta por concepto
- [`src/engine/`](src/engine/AGENTS.md) — núcleo numérico (el resto de `src/*` se enlaza desde `src/`)
- [`test/`](test/AGENTS.md) — tests
- [`scripts/`](scripts/AGENTS.md) — utilidades
- [`docs/`](docs/AGENTS.md) — lecciones y kit
- [`viewer/`](viewer/AGENTS.md) — visor
- [`design-system/`](design-system/AGENTS.md) — componentes React del visor
- [`handoff/`](handoff/AGENTS.md) — traspasos entre días

---

*Hackathon Causa Prima, Equipo 2 (Pablo, Paula, Gerard).*
