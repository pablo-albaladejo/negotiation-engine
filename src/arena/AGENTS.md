# src/arena/ — Self-Play, Métricas, Promoción

Ejecuta partidas entre candidata y rivales (bots), calcula métricas, compara pareada con campeona, y aplica puerta de promoción.

## Propósito

Self-play local:

1. **Arena (`arena.ts`)**: ejecuta N partidas entre agentes, almacena resultados.
2. **Métricas (`metrics.ts`)**: excedente, violaciones, win rate por rol/escenario.
3. **Comparación pareada (`paired.ts`)**: candidata vs campeona con mismas semillas, mismo rival.
4. **Puerta de promoción (`promote.ts`)**: valida que candidata mejora excedente con 0 violaciones.
5. **CLI (`cli.ts`)**: `pnpm arena`, `pnpm promote`, reportes.

## Archivos clave

- **`arena.ts`** — `runArena(options)` → `ArenaReport`: orquesta partidas, sesiones, scoring.
- **`metrics.ts`** — `GameMetrics` / `computeMetrics()`: excedente, win rate, violaciones de mandato, desglose por rol/escenario.
- **`paired.ts`** — `runPaired`/`comparePaired`: compara candidata vs campeona con mismos bots y semillas.
- **`promote.ts`** — Puerta: revalida campeona, evalúa candidata, decide si promueve a `config/champion.json`.
- **`gate.ts`** — Criterio de decisión de promoción (mejora ≥ minEffectPp con 0 violaciones).
- **`cli.ts`** — Línea de comandos `pnpm arena`: `--candidate`, `--seeds` (defecto 21), `--seed-start`, `--scenarios`, `--rivals`, `--agent-url`, `--rival-url`, `--timeout-ms`, `--llm-provider` (defecto `LLM_PROVIDER` o `none`; sin red salvo que se pida) y `--no-narrator` (solo parser LLM, para medir).
- **`promote-main.ts`** — Puerta de promoción `pnpm promote`: `--dry-run`, `--reval-seeds`, `--criterion` (sign|bootstrap).
- **`participant.ts`** — Interfaz: agente (config o HTTP) o bot.
- **`agent-participant.ts`** — Wrapper: agente config como participante.
- **`external.ts`** — Wrapper: agente HTTP externo como participante.
- **`scenario.ts`** — Escenarios: buyer, seller, con variaciones (wide, narrow, extreme).
- **`report.ts`** — Formato de salida: tabla, JSON.
- **`results-schema.ts`** — Zod: esquema de resultados guardados.
- **`runner.ts`** — Ejecutor de partidas (session state, turnos, resultado final).
- **`stats.ts`** — Agregación de métricas.

## Invariantes

Desde root `AGENTS.md`:

- **Promoción solo si 0 violaciones**: aceptamos degradación de excedente si no hay violaciones.
- **Comparación pareada**: mismo bot, mismo escenario, **misma semilla** → resultados reproducibles.
- **Métricas por rol**: buyer y seller separados (weights en config).
- **Candidata cargada desde `AgentConfig`**: validada por `parseConfig()`.
- **Resultados guardados**: nunca en git (en `.gitignore`: `results/`, `config/candidates/`).
- **Freeze**: `CHAMPION_FROZEN=1|true|yes` o `frozen: true` bloquea promoción. `--dry-run` aún ejecuta la puerta.
- **Escritura atómica**: `config/champion.json` con `writeFileAtomic`; `gate.json` escrito a `results/` durante promoción con `writeFileAtomic`.

## Cómo trabajar aquí

```bash
# Self-play: candidata vs campeona
pnpm arena --candidate config/baselines/dummy.json --seeds 10

# Puerta completa (revalida campeona, evalúa candidata)
pnpm promote config/baselines/dummy.json --dry-run --seeds 5 --reval-seeds 5

# Barrido de sintonización
pnpm tune

# Agente HTTP externo
pnpm dummy:serve --port 8799 &
pnpm arena --agent-url http://localhost:8799 --seeds 5

# Reportes
pnpm eval:dummy 5  # vs dummy en local

# Tests
pnpm test test/arena/

# TypeScript
pnpm typecheck
```

## Links

- ↑ [`src/`](../AGENTS.md)
- ← Agente: [`agent/`](../agent/AGENTS.md) o config [`src/engine/config.ts`](../engine/config.ts)
- ← Bots: [`bots/`](../bots/AGENTS.md)
- → Tuning: [`tune/`](../tune/AGENTS.md)
- → Config: [`config/`](../../config/AGENTS.md)
- → Resultados: `results/` (fuera de git)
- → Test: [`test/arena/`](../../test/arena/)
