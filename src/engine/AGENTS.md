# src/engine/ — Motor Determinista

Toma la decisión de aceptar, rechazar o contraproponer. Aquí viven todos los números: utilidad, oferta, aceptación y guardarraíles. El resultado es un `Decision` (acción + oferta + explicación).

## Propósito

Realiza cálculos deterministas sobre el estado de la sesión y produce una decisión numérica. Agnóstico del LLM y del protocolo: solo entiende utilidad y ofertas.

## Archivos clave

- **`config.ts`** — `AgentConfig`: issues, parámetros del motor (β, márgenes, reciprocidad, etc.), proveedor LLM. `parseConfig()` valida.
- **`issues.ts`** — Utilidad: cálculo de u(oferta), orientación de issues (buyer vs seller), monotonicidad.
- **`engine.ts`** — Entrada `EngineInput` (issues, mandato, parámetros, estado, seed). Salida `Decision` (acción + oferta + explicación). Orquesta todo lo demás.
- **`offer.ts`** — Generación de oferta: Boulware (β), márgenes, ruido ε, reciprocidad Tit-for-Tat.
- **`acceptance.ts`** — Reglas de aceptación: `AC_next` (oferta rival ≥ última nuestra?), `AC_time` (tiempo agotándose?), `AC_combi` (combinada).
- **`opponent.ts`** — Modelo del rival: historial de ofertas, concesión estimada, predicción.
- **`guardrails.ts`** — `enforceGuardrails()`: valida que la oferta no viole mandato y es monótona.
- **`rng.ts`** — RNG determinista (seed reproducible).

## Invariantes

Desde root `AGENTS.md`:

- **Toda oferta pasa por `enforceGuardrails` u `enforceOfferGuardrails`**: nunca cruza el mandato y concede monótonamente (u(oferta) ≥ u(reserva) y u(oferta) ≤ u(última oferta nuestra)).
- **Decisión = (acción, oferta, explicación)**: acción y oferta son vinculantes; explicación es aditiva (no cambia lo anterior).
- **Explicación nunca se redacta aquí**: solo schema. La redacción la hace `src/llm/narrator.ts` en la salida del turno.

## Cómo trabajar aquí

```bash
# Tests unitarios + propiedades (fast-check)
pnpm test test/engine/

# Box de pruebas de motor (sandbox para cálculos)
pnpm box

# TypeScript
pnpm typecheck
```

Criterio de monotonicidad y aceptación: ver tests en `test/engine/`.

## Links

- ↑ [`src/`](../AGENTS.md)
- ← Entrada: [`pipeline/`](../pipeline/AGENTS.md) adapta turno canónico a `EngineInput`
- → Salida: `Decision` (acción, oferta, explicación)
- → [`guardrails.ts`](guardrails.ts) — validación de oferta
- → [`config.ts`](config.ts) — parámetros desde `config/champion.json`
- → [`test/engine/`](../../test/engine/) — tests exhaustivos
