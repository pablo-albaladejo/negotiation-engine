# src/pipeline/ — Orquestación del Turno

Orquesta el flujo de un turno: adapta entrada, invoca parser, motor, narrador, valida y adapta salida. Maneja timeouts, reintentos y telemetría.

## Propósito

Implementa el bucle del turno canónico definido en root `AGENTS.md`:

```
ring → [TurnInput] → parser → [JSON] → motor → [Decision] → narrador → [texto] → validador → [TurnOutput] → ring
```

Maneja errores de esquema, timeouts, excepciones, y asegura respuesta siempre.

## Archivos clave

- **`pipeline.ts`** — `Brain` (interfaz principal: `turn(raw)`, `fallback(raw)`). Orquesta cajas con timeout.
- **`box.ts`** — Sistema de cajas (`defineBox`, `runBox`): desacoplamiento, aislamiento de timeouts, aislamiento de fallas.
- **`session.ts`** — `Session` y `SessionStore`: persistencia de estado entre turnos (historial, ofertas, decisiones).
- **`binding.ts`** — `bindRivalMove()`: mapea acción rival a estructura `EngineInput`.
- **`reconcile.ts`** — `reconcileTextOffer()`: en modo solo texto acepta la oferta extraída solo si el parser determinista y el LLM coinciden en cada issue (sin LLM, basta el determinista); si no coinciden, el turno va sin oferta del rival. Es la puerta que impide que el LLM fije una cifra por su cuenta: no quitarla.
- **`otel.ts`** — Exporta traza a OpenTelemetry (spans, atributos sanitizados).
- **`log.ts`** — Logger con pino. Redacta rutas de `explain` del motor (censura números sensibles).
- **`trace.ts`** — `TraceSink`: acumula eventos de cajas para debugging.

## Invariantes

Desde root `AGENTS.md`:

- **Siempre hay respuesta**: timeout o error → plantilla determinista.
- **Local-only boxes** (`rivalText`, `protocol`): solo en la traza local (`results/*.jsonl`), nunca en OTel/Langfuse.
- **Redactados en pino y OTel** (`explain`, `mandate`, `reservation`, `config`): censurados porque `explain` es equivalente a la reserva.
- **La traza local** (`results/*.jsonl`) conserva todos los campos.
- **Presupuesto del turno**: `Math.max(0, timeoutMs - turnSafetyMarginMs)` si el ring envía `timeoutMs`; en otro caso, `config.turnBudgetMs` (obligatorio, sin defecto). Solo el margen default a 500 ms.

## Cómo trabajar aquí

```bash
# Tests de pipeline y session
pnpm test test/pipeline/

# Herramienta de replay
pnpm replay results/game-123.json

# TypeScript
pnpm typecheck
```

### Depuración

- `trace` (propiedad de `PipelineDeps`) acumula registros de cajas para acceso local.
- Logs sanitizados van a pino (env: `LOG_LEVEL=debug`).
- Ver `log.ts` para reglas de redacción en pino (`REDACT_PATHS`) y `otel.ts` para OTel (`LOCAL_ONLY_BOXES` y `REDACT_KEYS`). En pipeline.ts: `logBoxRecord()` filtra antes de pasar a pino, y `LOCAL_ONLY_BOXES` solo tiene `rivalText`.

## Links

- ↑ [`src/`](../AGENTS.md)
- ← Entrada: `TurnInput` de [`protocol/`](../protocol/AGENTS.md)
- → Salida: `TurnOutput` hacia [`protocol/`](../protocol/AGENTS.md)
- ← Parser: [`src/llm/parser.ts`](../llm/parser.ts)
- ← Motor: [`src/engine/engine.ts`](../engine/engine.ts)
- ← Narrador: [`src/llm/narrator.ts`](../llm/narrator.ts)
- → Sesión: [`session.ts`](session.ts)
- → Log/trace: [`log.ts`](log.ts), [`trace.ts`](trace.ts), [`otel.ts`](otel.ts)
- → Test: [`test/pipeline/`](../../test/pipeline/)
