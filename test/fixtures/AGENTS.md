# test/fixtures/ — Datos de Prueba

Fixtures (datos de entrada/salida) para tests de parser, motor, adaptadores. Independientes de protocolo específico del ring.

## Propósito

Reutilizables en tests: JSON tipado, escenarios conocidos, sin tener que generar datos en cada test.

## Subdirectorios

- **`bazaar/`** — Ficha real de Abuela Carmen (`GET /api/dealers/abuela`) que alimenta el simulador.
- **`box/`** — Input/output para caja de pruebas del motor.
- **`engine/`** — Casos de utilidad, oferta, aceptación, monotonicidad.
- **`llm/`** — Entrada/salida del parser.
- **`numbers/`** — Normalización de números desde texto rival.
- **`parser/`** — Texto rival → JSON estructura.
- **`ring/`** — Turnos simulados del ring (A2A, HTTP, MCP).

## Cómo añadir

1. Fichero JSON en subdirectorio apropiado (ej. `engine/ac-next.json`).
2. Estructura: `{ input: {...}, expected: {...} }` o similar.
3. Cargar en test: `import fixture from './fixtures/engine/ac-next.json'`.
4. Validar contra schema: `EngineInputSchema.parse(fixture.input)`.

## Links

- ↑ [`test/`](../AGENTS.md)
- → Usado por: todos los tests en `test/**/*.test.ts`
