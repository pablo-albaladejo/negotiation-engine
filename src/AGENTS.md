# src/ — Módulos de Lógica

Aquí viven todos los módulos de negocio: el motor determinista, el parser, el narrador, el servidor HTTP, la arena de self-play, bots adversariales, herramientas de desarrollo, y red team.

## Mapa

| Carpeta | Responsabilidad |
|---------|-----------------|
| [`protocol/`](protocol/AGENTS.md) | Esquemas Zod del ring, adaptadores input/output |
| [`engine/`](engine/AGENTS.md) | Motor determinista: utilidad, modelo rival, oferta, aceptación, guardarraíles |
| [`pipeline/`](pipeline/AGENTS.md) | Orquestación del turno: cajas, timeout, reintentos, telemetría OTel |
| [`llm/`](llm/AGENTS.md) | Parser, narrador, plantilla, provider (none/claude-cli/anthropic-api) |
| [`agent/`](agent/AGENTS.md) | Servidor HTTP (POST /turn, GET /health) |
| [`arena/`](arena/AGENTS.md) | Self-play: partidas, métricas, tabla, promoción, comparación pareada |
| [`bots/`](bots/AGENTS.md) | Rivales para la arena (adversariales, solo texto, LLM) |
| [`dev/`](dev/AGENTS.md) | Herramientas: replay, golden, critic, box |
| [`redteam/`](redteam/AGENTS.md) | Harness de red team |
| [`tune/`](tune/AGENTS.md) | Generadores, espacio, barridos de parámetros |

## Invariantes globales

Desde el root `AGENTS.md`:

- **La cifra sale del `engine/`**, nunca del LLM.
- **El parser de `llm/` lee el texto del rival sin herramientas** y devuelve JSON tipado.
- **Toda oferta pasa por `enforceGuardrails`**: no viola el mandato y es monótona (oferta anterior ≤ oferta nueva en utilidad para nosotros).
- **Siempre respondemos**: timeouts y errores de esquema usan la plantilla determinista.
- **El protocolo con el ring vive en `protocol/`**: extensible, agnóstico de implementación.

## Cómo trabajar aquí

```bash
# Tests unitarios + propiedades (fast-check)
pnpm test

# TypeScript
pnpm typecheck

# Self-play local (candidata vs campeona, todos los bots/roles)
pnpm arena

# Promover si mejora (puerta de promoción)
pnpm promote config/baselines/candidata.json --dry-run

# Barrido de parámetros (genera candidatas en config/candidates/)
pnpm tune
```

Todos los tests deben pasar antes de cada commit.

## Links

- ↑ [root `AGENTS.md`](../AGENTS.md)
- → [`agent/`](agent/AGENTS.md) — servidor HTTP
- → [`arena/`](arena/AGENTS.md) — self-play y métricas
- → [`bots/`](bots/AGENTS.md) — rivales
- → [`config/`](../config/AGENTS.md) — configuración compartida
- → [`test/`](../test/AGENTS.md) — tests de todos estos módulos
