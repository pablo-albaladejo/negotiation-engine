# test/ — Tests y Fixtures

Tests unitarios y de propiedades (fast-check), fixtures de prueba, y dorados (golden).

## Propósito

Cobertura completa del motor, adaptadores, parser, arena. Propiedades invariantes (monotonicidad, no violación de mandato, aceptación correcta).

## Estructura

- **Módulos**: `agent/`, `arena/`, `bots/`, `dev/`, `engine/`, `llm/`, `pipeline/`, `protocol/`, `redteam/`, `tune/`
  - Espejo de `src/` con tests paralelos.
- **`fixtures/`** — Datos de entrada/salida para pruebas (sin protocolo específico).
- **`golden/`** — Resultados esperados, regenerables con `pnpm golden:update`.
- **Raíz `test/`** — Tests globales: `config.test.ts`, `guardrails.test.ts`, `golden.test.ts`.

## Archivos y directorios

### Fixtures (`test/fixtures/`)
- **`box/`** — Input/output para cajas del motor.
- **`engine/`** — Casos de utilidad, oferta, aceptación, monotonicidad.
- **`llm/`** — Parser, números, extracción.
- **`numbers/`** — Normalización de números desde texto rival.
- **`parser/`** — Entrada/salida estructurada del parser.
- **`ring/`** — Protocolos simulados (A2A, HTTP, MCP).

### Golden (`test/golden/`)
- Resultados esperados de partidas, decisiones del motor.
- Regenerables: `pnpm golden:update`.
- Versionados (fixtures, no salidas vivas).

## Invariantes

- **100% reproducible**: misma seed, mismas decisiones.
- **Fast-check**: propiedades sobre monotonicidad, mandato, aceptación.
- **Sin API**: tests funcionan sin LLM (`LLM_PROVIDER=none` por defecto).
- **CI**: `pnpm test` + `pnpm typecheck` deben pasar siempre.

## Cómo trabajar aquí

```bash
# Todos los tests
pnpm test

# Test de un módulo
pnpm test test/engine/

# Test de un archivo
pnpm test test/engine/config.test.ts

# Watch mode
pnpm test:watch

# Actualizar golden
pnpm golden:update

# TypeScript
pnpm typecheck
```

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
- ← Módulos bajo test: `src/`
- → Fixtures: [`fixtures/`](fixtures/AGENTS.md)
- → Golden: [`golden/`](golden/AGENTS.md)
