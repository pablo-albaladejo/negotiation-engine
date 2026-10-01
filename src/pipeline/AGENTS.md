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
- **`reconcile.ts`** — `reconcileTextOffer()`: cuando el rival solo da texto (sin cifra), intenta extraer número o marca "inconfirmed".
- **`otel.ts`** — Exporta traza a OpenTelemetry (spans, atributos sanitizados).
- **`log.ts`** — Logger con pino. Redacta rutas de `explain` del motor (censura números sensibles).
- **`trace.ts`** — `TraceSink`: acumula eventos de cajas para debugging.

## Invariantes

Desde root `AGENTS.md`:

- **Siempre hay respuesta**: timeout o error → plantilla determinista.
- **Trace (explicación del motor) es sanitizado**: nunca incluye cifras sueltas, solo rutas y esquemas.
- **RivalText solo a log local**: nunca a pino (evita registrar texto privado del rival).
- **Protocol** (solo rutas Zod, códigos de error) sí se loguea.
- **Timeout presupuestario**: `turnBudgetMs = timeoutMs - turnSafetyMarginMs` (por defecto: 5500 - 500 = 5000 ms).

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
- Ver `log.ts` para reglas de redacción (rutas censuradas en `REDACT_PATHS`).

## Links

- ↑ [`src/`](../AGENTS.md)
- ← Entrada: `TurnInput` de [`protocol/`](../protocol/AGENTS.md)
- → Salida: `TurnOutput` hacia [`protocol/`](../protocol/AGENTS.md)
- ← Parser: [`llm/parser.ts`](../llm/parser.ts)
- ← Motor: [`engine/engine.ts`](../engine/engine.ts)
- ← Narrador: [`llm/narrator.ts`](../llm/narrator.ts)
- → Sesión: [`session.ts`](session.ts)
- → Log/trace: [`log.ts`](log.ts), [`trace.ts`](trace.ts), [`otel.ts`](otel.ts)
- → Test: [`test/pipeline/`](../../test/pipeline/)
