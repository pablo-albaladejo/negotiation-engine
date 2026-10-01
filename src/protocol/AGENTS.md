# src/protocol/ — Esquemas y Adaptadores

Contrato canónico entre los adaptadores del ring (lo que llega por HTTP, MCP, A2A) y el cerebro del agente.

## Propósito

Define el esquema `TurnInput` / `TurnOutput` y proporciona adaptadores para convertir entre el protocolo específico del ring y la forma canónica. Desacoplable: si el ring cambia su formato, solo se reescribe aquí.

## Archivos clave

- **`schemas.ts`** — Zod: `TurnInput` (oferta rival, acción, texto), `TurnOutput` (nuestra acción, oferta, respuesta), `ProtocolSchemas` (factory con issue names).
- **`adapter.ts`** — Interfaz `RingAdapter { name; handle(raw): Promise<AdapterResult> }` y builders: `createCanonicalHandler`, `createInMemoryAdapter`, `createHttpApp`/`httpAdapterFromApp`, `createA2AApp`/`a2aAdapterFromApp`, `createMcpApp`/`mcpAdapterFromApp`.
- **`a2a.ts`** — Adaptador para protocolo A2A (Alliance-to-Alliance SDK).
- **`http.ts`** — Adaptador HTTP (POST /turn, GET /health).
- **`mcp.ts`** — Adaptador MCP (Model Context Protocol).
- **`sim-ring.ts`** — Simulador de ring para tests (solo JSON, sin protocolo real).

## Invariantes

- **El turno canónico es la única representación interna.** Adaptadores traducen desde el ring en entrada y hacia el ring en salida.
- **`ProtocolError`** por esquema inválido: no invoca al cerebro, devuelve 400 con campos erróneos.
- **Issues se declaran al crear `ProtocolSchemas`**: cada ring/sesión puede tener issues distintos.
- **`TurnInput`** (oferta rival):
  - Obligatorio: `sessionId`, `round`, `rivalAction` (enum), `rivalOffer` (si el ring lo da), `text` (si es solo texto).
  - Opcional: `roundLimit`, `deadline`, `timeoutMs`, `rivalCanRespond`.
- **`TurnOutput`** (nuestra respuesta):
  - Obligatorio: `sessionId`, `round`, `action` (accept|counter|walk), `text`.
  - Si `counter|accept`: `offer` (estructura según issues).

## Cómo trabajar aquí

```bash
# Tests del protocolo (validación de esquemas, adaptadores)
pnpm test test/protocol/

# TypeScript
pnpm typecheck
```

## Links

- ↑ [`src/`](../AGENTS.md)
- ← Entrada: ring adapta su formato a `TurnInput` (aquí)
- → Salida: `TurnOutput` se adapta de vuelta al protocolo del ring
- → [`pipeline/`](../pipeline/AGENTS.md) — consume `TurnInput`, produce `TurnOutput`
- → [`engine/`](../engine/AGENTS.md) — interfaz agnóstica (recibe `Offer`, devuelve `Decision`)
