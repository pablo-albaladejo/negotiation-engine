# viewer/test/ — Guardarraíles del visor

Solo tests de guardarraíles (`pnpm viewer:test`).

- **`bazaar-model-guard.test.ts`** — `/api/bazaar/model` no llega nunca a un POST del juego (cliente de solo lectura, rutas en dry-run, sin execute) y los datos privados no salen de 127.0.0.1 (bind, Host ajeno 403, POST 405).
- **`market-test-optimum.test.ts`** — el óptimo a posteriori del Market Test (`../server/bazaar/market-test/optimum.ts`): el húngaro frente a fuerza bruta y el mejor tick común, pares con excedente 0 y, a igualdad, los nuestros.

## Links

- ↑ [`viewer/`](../AGENTS.md)
- → Servidor: [`server/`](../server/AGENTS.md)
