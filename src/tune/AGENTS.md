# src/tune/ — Optimización de Parámetros

Barridos automáticos del espacio de parámetros del motor para encontrar candidatas mejores.

## Propósito

`pnpm tune`: genera candidatas explorando parámetros Boulware, márgenes, reciprocidad, etc., las evalúa con `pnpm arena`, guarda en `config/candidates/`.

Después, `pnpm promote` aplica la puerta (mejora + 0 violaciones) para subir a campeón.

## Archivos clave

- **`generators.ts`** — Generadores Zod: parámetros, issues, hyperparámetros.
- **`space.ts`** — `SearchSpace`: definición del espacio explorable (ranges de β, márgenes, etc.).
- **`sweep.ts`** — `runSweep()`: itera espacio, genera candidatas, evalúa con arena.
- **`tune-main.ts`** — Entry point: `pnpm tune`, orquesta barrido.

## Invariantes

- **Candidatas en `config/candidates/`**: directorio efímero (`.gitignore`).
- **Reproducibilidad**: misma seed, mismas candidatas.
- **Evaluación pareada**: compara con campeona con mismas semillas.
- **Promoción**: solo si mejora y 0 violaciones (puerta en [`arena/promote.ts`](../arena/promote.ts)).

## Cómo trabajar aquí

```bash
# Barrido de parámetros
pnpm tune

# Ver candidatas generadas
ls config/candidates/

# Promocionar una (si pasa puerta)
pnpm promote config/candidates/sweep-id-001.json --dry-run

# Tests (si aplica)
pnpm test test/tune/

# TypeScript
pnpm typecheck
```

## Links

- ↑ [`src/`](../AGENTS.md)
- ← Motor params: [`engine/config.ts`](../engine/config.ts)
- → Arena: [`arena/`](../arena/AGENTS.md) evalúa candidatas
- → Promoción: [`arena/promote.ts`](../arena/promote.ts)
- → Candidatos: `config/candidates/` (efímero)
- → Test: [`test/tune/`](../../test/tune/)
