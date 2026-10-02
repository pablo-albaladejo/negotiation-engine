# viewer/ — Visor del Bazaar

Paquete independiente (React + servidor Node) con una sola pestaña, `#bazaar`: una lista de todas nuestras conversaciones (dealers, duelos, tratos y ofertas entre equipos) con valor, excedente, veredicto y Δ de la cifra, detalle con mensajes literales y nuestras decisiones por tick, y panel de mercado (reloj, clasificación, feed, El Rastro y nuestro venue). Solo 127.0.0.1.

## Estructura

- **[`server/`](server/AGENTS.md)** — `/api/bazaar/*` sobre la API del Bazaar y `results/bazaar-live/`.
- **[`src/`](src/AGENTS.md)** — la app React (`BazaarScreen`).
- **[`test/`](test/AGENTS.md)** — tests del servidor, modelo y render.
- Sistema de diseño por alias a [`design-system/`](../design-system/AGENTS.md) (sin build).

## Invariantes

- **127.0.0.1 solamente**, Host comprobado, solo GET/HEAD.
- **Hacia el Bazaar solo GET**, ≤ 2 req/s, nunca devuelve la clave.
- Única escritura: `results/bazaar-live/<fecha>/verdicts.json` (valor de cada trato, calculado una vez).
- **Texto rival**: solo como texto plano, nunca como HTML.

## Cómo usar

```bash
pnpm --dir viewer install
set -a && . ./.env && set +a && pnpm viewer   # http://127.0.0.1:5199/#bazaar
pnpm viewer:test
pnpm viewer:typecheck
```

`VIEWER_PORT` cambia el puerto; `VIEWER_BAZAAR_DIR` la carpeta de trazas (por defecto `results/bazaar-live`); `BAZAAR_KEY` habilita la parte privada de `/api/bazaar/board` (sin clave, solo el mercado público). `VIEWER_BAZAAR_SNAPSHOTS` apunta a un respaldo de solo lectura si el Bazaar no responde.

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
- → [`src/bazaar/`](../src/bazaar/AGENTS.md) — de donde salen las trazas
