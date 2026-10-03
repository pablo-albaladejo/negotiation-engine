# negotiation-ring — Contexto para Agentes de Código

Agente del Equipo 2 para **El Bazaar** (hackathon Causa Prima): un torneo de cromos de Madrid en el que negociamos con dealers, con otros equipos en El Rastro y en duelos 1 contra 1. **El código decide la cifra**; el texto es una plantilla con esa misma cifra.

**Entrada rápida:** [`DAY1.md`](DAY1.md) — estado, cómo jugar, horario, comandos y datos medidos. Contexto del día 1: [`handoff/2026-10-02/HANDOFF.md`](handoff/2026-10-02/HANDOFF.md).

## Reglas no negociables

- **La cifra sale siempre del código** (`src/engine/` + planificadores de `src/dealers/`, `src/duels/`…). Los mensajes son plantillas cuya única cifra es la decidida (`textMatchesPrice`, `textMatchesOffer`).
- **Del rival solo se lee la estructura** (ofertas y precios), nunca su texto. Dos excepciones estrechas, aprobadas: pistas de eggs (se guarda el texto que suena a pista) y comparar el texto de un dealer con la estructura de su oferta para un flag (`src/flags/flags.ts`). **Nunca para una cifra.**
- **Nunca se revela la valoración privada** ni el límite (`your_limit`).
- **Toda oferta pasa por `enforceGuardrails`**: no cruza el límite y es monótona.
- **Guardarraíles antes de aceptar**: forma de la oferta (`checkStructure`) y un activo en un solo sitio (`src/shared/asset-locks.ts`).
- **Nada en vivo sin aprobación**: los POST reales exigen quitar `--dry-run` y, donde aplica, `--confirm`.

## Arquitectura

```
src/
├─ engine/    matemáticas puras: concesión, aceptación, guardarraíles, RNG
├─ shared/    cliente de la API, esquemas, claves, trazas, la cifra
├─ dealers/   negociar con Abuela y El Chato     (pnpm bazaar)
├─ duels/     duelos 1 contra 1                  (pnpm bazaar:duels)
├─ trades/    El Rastro con otros equipos        (pnpm bazaar:trades)
├─ broker/    casar ofertas en nuestro venue     (pnpm bazaar:broker)
├─ venue/     abrir nuestro mercado              (pnpm bazaar:venue)
├─ status/    resumen de solo lectura            (pnpm bazaar:status)
├─ state/     GameState por tick, Conversation, personas, eggs y flags (solo GET)
├─ flags/     detector de mala fe: texto del dealer frente a la estructura de su oferta
└─ coordinator/ coordinador por tick: limits, intenciones, arbitraje (pnpm bazaar:play)
test/        solo tests de guardarraíles (fast-check)
scripts/     escaneo de la API y comprobación de docs
docs/        lecciones de los dealers y kit oficial del Bazaar
viewer/         visor local del Bazaar (paquete independiente)
design-system/  componentes React del visor (por alias, sin build)
handoff/     traspaso del día 1 (solo HANDOFF.md en git)
results/     trazas en vivo (fuera de git)
```

## Scripts `pnpm`

| Comando | Descripción |
|---------|-------------|
| `pnpm test` | Tests de guardarraíles (límite, cifra = texto, un activo en un sitio, topes). Deben pasar antes de cada commit. |
| `pnpm typecheck` | TypeScript. |
| `pnpm docs:check` | Enlaces e identificadores de los AGENTS.md. |
| `pnpm bazaar` | Agente de dealers (`--serious`, `--dry-run`, `--once`, `--max-spend`, `--cash-floor`…). |
| `pnpm bazaar:duels` | Duelos 1 contra 1. |
| `pnpm bazaar:trades` | Ofertas entre equipos en El Rastro (en vivo con `--confirm`). |
| `pnpm bazaar:broker` | Broker de nuestro venue (en vivo con `--confirm`). |
| `pnpm bazaar:venue` | Plan de nuestro mercado (abrir exige `--confirm`). |
| `pnpm bazaar:play` | Coordinador por tick: `GameState`, presupuesto de `clock.limits`, intenciones de duelos, dealers y El Rastro, arbitraje (`--dry-run --once`; en vivo sin `--dry-run` y con `--confirm`). |
| `pnpm bazaar:status` | Resumen de solo lectura: equipo, reloj, dealers e hilos. |
| `pnpm bazaar:scan` | GET a todos los endpoints, guarda las respuestas. |
| `pnpm bazaar:feed` | Mensajes nuevos de nuestros hilos en vivo (solo lectura). |
| `pnpm bazaar:record` | Graba el stream en vivo (`/api/events/stream`, team y public) en `results/` para reconstruir el día. |
| `pnpm bazaar:dump` | Volcado del estado y del día (cartas, hilos, duelos, feed) en `results/` (solo lectura). |
| `pnpm viewer` | Visor en http://127.0.0.1:5199/#bazaar |
| `pnpm ds:test` | Test de seguridad del sistema de diseño (sin HTML inyectado). |

Detalle de cada pieza: [`src/AGENTS.md`](src/AGENTS.md).

## Variables de entorno

```bash
BAZAAR_URL=https://bazaar.causaprima.ai   # base de la API
BAZAAR_KEY=                               # clave del equipo (X-Team-Key), solo en .env
# BAZAAR_BROKER_KEY va en .env.broker (X-Broker-Key)
```

## Links a subcarpetas

- [`src/`](src/AGENTS.md) — agente del Bazaar, una carpeta por concepto
- [`src/engine/`](src/engine/AGENTS.md) — núcleo numérico
- [`test/`](test/AGENTS.md) — tests
- [`scripts/`](scripts/AGENTS.md) — utilidades
- [`docs/`](docs/AGENTS.md) — lecciones y kit
- [`viewer/`](viewer/AGENTS.md) — visor

---

*Hackathon Causa Prima, Equipo 2 (Pablo, Paula, Gerard).*
