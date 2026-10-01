# src/bots/ — Rivales Adversariales

Estrategias de rivales para la arena: adversariales, solo texto, LLM. Cada bot implementa la interfaz `Agent` (config + `turn()`).

## Propósito

Rivales de prueba con estrategias predeterminadas:

- **Adversariales**: tácticas conocidas (Boulware, TFT, agresivos).
- **Solo texto**: sin cifras (prueba robustez del parser y validador).
- **LLM**: rivales generados por LLM (red team más realista).

Ejecutables como servidores HTTP para sparring interactivo.

## Archivos clave

- **`bot.ts`** — Interfaz `Agent`: `turn(input)` → `TurnOutput`. Base para todos los bots.
- **`adversarial.ts`** — Bots con estrategias matemáticas: Boulware, TFT, agresivos con β, márgenes.
- **`text-only.ts`** — Bot que responde solo con texto (sin cifras). Prueba del parser.
- **`llm-bot.ts`** — Bot con narrador LLM. Requiere proveedor configurado.
- **`dummy-agent.ts`** — Dummy simple: acepta/rechaza por estrategia fija (útil para baseline).
- **`serve.ts`** — Entry point: instancia bot, lo sirve como HTTP en puerto configurado.
- **`serve-app.ts`** — Aplicación Hono: rutas `/turn`, `/health`, autenticación.

## Invariantes

- **Bots implementan `Agent`**: mismo contrato que agente principal.
- **Config**: cada bot carga `AgentConfig` validada; si no, usa parámetros inline.
- **Reproducibilidad**: misma seed → misma secuencia de movimientos.
- **Scenario**: si se sirve por HTTP, `--scenario` fija el rol/mandato.

## Cómo trabajar aquí

```bash
# Servidor adversarial (Boulware β=0.3)
pnpm bot:serve adversarial-boulware-0.3 --port 8790

# Servidor dummy
pnpm dummy:serve --strategy accept-first --port 8799

# Sparring: agente vs bot por HTTP
pnpm sparring

# Tests de bots
pnpm test test/bots/

# TypeScript
pnpm typecheck
```

### Crear bot nuevo

1. Implementar `Agent` (función `turn(input)` → `TurnOutput`).
2. Inyectar en `serve-app.ts` como opción.
3. Ejecutar: `pnpm bot:serve <nombre> --port <puerto>`.

## Links

- ↑ [`src/`](../AGENTS.md)
- ← Config: [`src/engine/config.ts`](../engine/config.ts)
- ← Arena: [`arena/`](../arena/AGENTS.md) usa bots como rivales
- → Protocol: [`protocol/`](../protocol/AGENTS.md)
- → HTTP: `serve-app.ts` → rutas `/turn`, `/health`
- → Sparring: [`scripts/sparring.sh`](../../scripts/sparring.sh)
- → Test: [`test/bots/`](../../test/bots/)
