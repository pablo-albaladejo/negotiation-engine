# config/ — Configuración del Agente

Parámetros del motor y definiciones de rivales/escenarios.

## Propósito

Versionado de configuraciones: campeona, candidatas, baselines, escenarios.

## Estructura

- **`champion.json`** — Configuración ganadora, congelable con `frozen: true`.
- **`baselines/`** — Configuraciones de referencia (versionadas en git).
- **`candidates/`** — Generadas por `pnpm tune`, efímeras (`.gitignore`).
- **`arena/`** — Definiciones de escenarios (buyer, seller, variaciones).
- **`scenario.json`** — Mapeo de escenario a issues.

## Archivos clave

- **`champion.json`** — `AgentConfig`: issues, parámetros (β, márgenes, reciprocidad), persona, provenance.
- **`scenario.json`** — Lista de escenarios disponibles para arena y bots.

## Schema

`AgentConfig` (Zod en [`src/engine/config.ts`](../src/engine/config.ts)):

```json
{
  "version": 1,
  "issues": [
    { "name": "price", "min": 0, "max": 100, "direction": "lower-better", "weight": 1 }
  ],
  "defaultHorizon": 10,
  "beta": 0.5,
  "openingMargin": 0.2,
  "acceptMargin": 0.1,
  "acTimeThreshold": 0.7,
  "noise": 0.1,
  "persona": "negociador justo",
  "turnBudgetMs": 5000,
  "turnSafetyMarginMs": 500,
  "provenance": {
    "source": "manual",
    "createdAt": "2025-10-01"
  }
}
```

## Cómo trabajar

```bash
# Ver configuración actual
cat config/champion.json

# Evaluar baseline
pnpm arena --candidate config/baselines/dummy.json --seeds 5

# Promover candidata (si pasa puerta)
pnpm promote config/candidates/sweep-001.json

# Tunar parámetros (genera en candidates/)
pnpm tune

# Congelar campeón
# (editar champion.json: "frozen": true)
```

## Invariantes

- **Champion**: versionada, congelable con `frozen: true`.
- **Baselines**: referencias de comparación (versionadas).
- **Candidatas**: efímeras, no versionadas (`config/candidates/` en `.gitignore`).
- **Validación**: `parseConfig()` en [`src/engine/config.ts`](../src/engine/config.ts).

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
- ← Engine: [`src/engine/config.ts`](../src/engine/config.ts) define schema.
- → Arena: [`src/arena/`](../src/arena/AGENTS.md) evalúa configuraciones.
- → Baselines: `config/baselines/` — comparaciones de referencia.
- → Candidatas: `config/candidates/` (efímero, .gitignore).
