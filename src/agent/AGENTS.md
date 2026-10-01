# src/agent/ — Servidor HTTP

Servidor Node/Hono que expone el agente como servicio HTTP. Contrato: `POST /turn` (turno), `GET /health` (latido).

## Propósito

Envuelve el cerebro (`Brain` de `pipeline/`) en un servidor HTTP:

- **`POST /turn`** — recibe `TurnInput` (JSON desde el ring), devuelve `TurnOutput`.
- **`GET /health`** — latido, devuelve 200 si listo.

Maneja autenticación (`Authorization: Bearer <token>`), logging y errores de protocolo.

## Archivos clave

- **`agent.ts`** — `Agent`: inyecta `Brain`, crea instancia con rutas HTTP, logging, autenticación.
- **`index.ts`** — Entry point: carga config, instancia `Brain`, arranca servidor.

## Invariantes

- **Autenticación**: `AGENT_AUTH_TOKEN` obligatorio en modo servidor (salvo `AGENT_ALLOW_NOAUTH=1` en local).
- **Header alternativo**: `AGENT_AUTH_HEADER` (por defecto: `Authorization`).
- **Config**: carga desde `AGENT_CONFIG` (por defecto: `config/champion.json`).
- **Respuesta siempre**: `POST /turn` nunca falla (fallback determinista si es necesario).
- **Error de protocolo**: 400 con `ProtocolErrorBody` (campos inválidos).
- **Timeout**: respeta presupuesto de turno (config + timeout del ring).

## Cómo trabajar aquí

```bash
# Arranca agente con config por defecto (champion.json)
pnpm agent

# Con otra config
AGENT_CONFIG=config/baselines/dummy.json pnpm agent

# Con token
AGENT_AUTH_TOKEN=secret pnpm agent

# Sin token (local, si se permite)
AGENT_ALLOW_NOAUTH=1 pnpm agent

# Smoke test (HTTP sin herramientas, 1 turno)
pnpm smoke

# Test de protocolo
pnpm test test/protocol/

# TypeScript
pnpm typecheck
```

### Despliegue

Por túnel (ej. Cloudflare):

```bash
AGENT_AUTH_TOKEN=secret pnpm agent &
cloudflared tunnel --url http://localhost:8787
# Desde otra red: scripts/tunnel-smoke.sh https://<url-del-túnel>
```

## Links

- ↑ [`src/`](../AGENTS.md)
- ← Brain: [`pipeline/`](../pipeline/AGENTS.md)
- ← Config: [`config/champion.json`](../../config/champion.json)
- → HTTP: `POST /turn`, `GET /health` hacia el ring
- → Test: [`test/agent/`](../../test/agent/)
- → Smoke: [`scripts/smoke.sh`](../../scripts/smoke.sh)
