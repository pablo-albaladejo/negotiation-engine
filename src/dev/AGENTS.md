# src/dev/ — Herramientas de Desarrollo

Utilidades de debugging y desarrollo: replay, fixtures doradas (golden), análisis crítico de partidas, caja de pruebas del motor.

## Propósito

Facilitan debugging, testing y análisis post-mortem:

- **Replay**: reconstruye una partida guardada.
- **Golden**: regenera fixtures esperadas para tests.
- **Critic**: analiza una partida y sugiere mejoras.
- **Box**: sandbox para probar el motor aislado.

## Archivos clave

- **`replay.ts`** — `replayTrace(file, options)`: carga partida JSON, reproduce turno a turno mostrando decisiones.
- **`replay-main.ts`** — Entry point: `pnpm replay <game.json>`.
- **`golden.ts`** — `writeGoldens`/`loadGoldens`/`compareGolden`/`playGolden`: regenera y compara fixtures en `test/golden/`.
- **`golden-main.ts`** — Entry point: `pnpm golden:update`.
- **`critic.ts`** — `runCritic`/`lossesOf`: analiza partida, calcula contrafácticos, sugiere mejoras.
- **`critic-main.ts`** — Entry point: `pnpm critic <game.json>`.
- **`box.ts`** — `Box`: sandbox aislado del motor, inyectable con entrada/salida custom.
- **`box-main.ts`** — Entry point: `pnpm box`.
- **`registry.ts`** — Registro de herramientas disponibles.

## Invariantes

- **Reproducibilidad**: replay con misma seed reproduce decisiones exactas.
- **Golden**: no se versionan salidas vivas, solo fixtures esperadas.
- **Critic**: analiza post-hoc, no cambia decisiones en vivo.
- **Box**: motor aislado, sin session state, sin LLM (solo números).

## Cómo trabajar aquí

```bash
# Replay: reconstruye partida guardada
pnpm replay results/game-123.json

# Actualizar golden (fixtures esperadas)
pnpm golden:update

# Análisis crítico
pnpm critic results/game-456.json

# Caja de pruebas del motor
pnpm box

# Tests (si aplica)
pnpm test test/dev/

# TypeScript
pnpm typecheck
```

## Links

- ↑ [`src/`](../AGENTS.md)
- ← Partidas guardadas: `results/` (generadas por arena)
- ← Motor: [`engine/`](../engine/AGENTS.md)
- → Golden: [`test/golden/`](../../test/golden/)
- → Test: [`test/dev/`](../../test/dev/)
