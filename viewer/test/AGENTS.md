# viewer/test/ — Guardarraíles del visor

Solo tests de guardarraíles (`pnpm viewer:test`).

- **`bazaar-model-guard.test.ts`** — `/api/bazaar/model` no llega nunca a un POST del juego (cliente de solo lectura, rutas en dry-run, sin execute) y los datos privados no salen de 127.0.0.1 (bind, Host ajeno 403, POST 405).

## Links

- ↑ [`viewer/`](../AGENTS.md)
- → Servidor: [`server/`](../server/AGENTS.md)
