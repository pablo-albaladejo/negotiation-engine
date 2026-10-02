# negotiation-ring — Contexto para Agentes de Código

Agente del Equipo 2 para **El Bazaar** (hackathon Causa Prima): un torneo de cromos de Madrid en el que negociamos con dealers, con otros equipos en El Rastro y en duelos 1 contra 1. **El código decide la cifra**; el texto es una plantilla con esa misma cifra.

**Entrada rápida:** [`DAY1.md`](DAY1.md) — estado, cómo jugar, horario, comandos y datos medidos. Contexto del día 1: [`handoff/2026-10-02/HANDOFF.md`](handoff/2026-10-02/HANDOFF.md).

## Reglas no negociables

- **La cifra sale siempre del código** (`src/engine/` + planificadores de `src/bazaar/`). Los mensajes son plantillas cuya única cifra es la decidida (`textMatchesPrice`, `textMatchesOffer`).
- **Del rival solo se lee la estructura** (ofertas y precios), nunca su texto.
- **Nunca se revela la valoración privada** ni el límite (`your_limit`).
- **Toda oferta pasa por `enforceGuardrails`**: no cruza el límite y es monótona.
- **Guardarraíles antes de aceptar**: forma de la oferta (`checkStructure`) y un activo en un solo sitio (`src/bazaar/asset-locks.ts`).
- **Nada en vivo sin aprobación**: los POST reales exigen quitar `--dry-run` y, donde aplica, `--confirm`.

## Arquitectura

```
src/
├─ bazaar/   agente del Bazaar: dealers, duelos, El Rastro, broker, venue, simulador
└─ engine/   núcleo numérico: utilidad, concesión, aceptación, guardarraíles, RNG
test/        tests unitarios y de propiedades (fast-check)
scripts/     escaneo de la API y comprobación de docs
docs/        lecciones de los dealers y kit oficial del Bazaar
viewer/         visor local del Bazaar (paquete independiente)
design-system/  componentes React del visor (por alias, sin build)
handoff/     traspaso del día 1
results/     trazas en vivo (fuera de git salvo bazaar-live)
```

## Scripts `pnpm`

| Comando | Descripción |
|---------|-------------|
| `pnpm test` | Tests unitarios + propiedades. Deben pasar antes de cada commit. |
| `pnpm typecheck` | TypeScript. |
| `pnpm docs:check` | Enlaces e identificadores de los AGENTS.md. |
| `pnpm bazaar` | Agente de dealers (`--serious`, `--dry-run`, `--once`, `--max-spend`, `--cash-floor`…). |
| `pnpm bazaar:duels` | Duelos 1 contra 1. |
| `pnpm bazaar:trades` | Ofertas entre equipos en El Rastro (en vivo con `--confirm`). |
| `pnpm bazaar:broker` | Broker de nuestro venue (en vivo con `--confirm`). |
| `pnpm bazaar:venue` | Plan de nuestro mercado (abrir exige `--confirm`). |
| `pnpm bazaar:status` | Resumen de solo lectura: equipo, reloj, dealers e hilos. |
| `pnpm bazaar:scan` | GET a todos los endpoints, guarda las respuestas. |
| `pnpm bazaar:sim` | Nuestro negociador contra Abuela simulada (offline). |
| `pnpm viewer` | Visor en http://127.0.0.1:5199/#bazaar |
| `pnpm viewer:test` | Tests del visor. |
| `pnpm ds:test` | Tests del sistema de diseño (lo usa el visor). |

Detalle de cada pieza: [`src/bazaar/AGENTS.md`](src/bazaar/AGENTS.md).

## Variables de entorno

```bash
BAZAAR_URL=https://bazaar.causaprima.ai   # base de la API
BAZAAR_KEY=                               # clave del equipo (X-Team-Key), solo en .env
# BAZAAR_BROKER_KEY va en .env.broker (X-Broker-Key)
```

## Links a subcarpetas

- [`src/`](src/AGENTS.md) — código
- [`src/bazaar/`](src/bazaar/AGENTS.md) — agente del Bazaar
- [`src/engine/`](src/engine/AGENTS.md) — núcleo numérico
- [`test/`](test/AGENTS.md) — tests
- [`scripts/`](scripts/AGENTS.md) — utilidades
- [`docs/`](docs/AGENTS.md) — lecciones y kit
- [`viewer/`](viewer/AGENTS.md) — visor

---

*Hackathon Causa Prima, Equipo 2 (Pablo, Paula, Gerard).*
