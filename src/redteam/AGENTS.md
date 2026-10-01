# src/redteam/ — Harness de Red Team

Herramientas para ejecutar escenarios adversariales: pruebas de seguridad, edge cases, validación de invariantes.

## Propósito

Red team estructurado:

- **Escenarios**: cajas especiales para probar comportamiento bajo estrés.
- **Cadenas**: secuencias de movimientos adversariales.
- **Reportes**: descubrimientos agrupados (violaciones, fallos, comportamiento inesperado).

## Archivos clave

- **`harness.ts`** — `startRedteamServer(options)`: infraestructura para ejecutar escenarios (retorna `RedteamServer`).
- **`main.ts`** — Entry point: `pnpm redteam`, carga escenarios, ejecuta, reporta.
- **`report.ts`** — Formato de salida: hallazgos, estadísticas, recomendaciones.

## Invariantes

- **Reproducibilidad**: misma seed, misma cadena de ataques.
- **Seguridad**: validación de invariantes (no viola mandato, monotonicidad, aceptación correcta).
- **Cobertura**: múltiples escenarios (tiempo agotado, rival agresivo, texto malformado, etc.).

## Cómo trabajar aquí

```bash
# Ejecutar red team
pnpm redteam

# Tests (si aplica)
pnpm test test/redteam/

# TypeScript
pnpm typecheck
```

## Links

- ↑ [`src/`](../AGENTS.md)
- ← Motor: [`engine/`](../engine/AGENTS.md)
- ← Pipeline: [`pipeline/`](../pipeline/AGENTS.md)
- → Escenarios: `redteam/` (en git)
- → Test: [`test/redteam/`](../../test/redteam/)
