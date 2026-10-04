# Bazaar viewer

Local viewer of the Bazaar game: conversations with dealers, duels, El Rastro, our figure and the market.

```bash
pnpm --dir viewer install   # once
set -a && . ./.env && set +a && pnpm viewer   # http://127.0.0.1:5199/#bazaar (VIEWER_PORT changes the port)
pnpm viewer:typecheck
```

## Security

- Listens **only on `127.0.0.1`**; the address is not configurable, only the port (`VIEWER_PORT`).
- **No authentication**, on purpose: nobody outside this machine can connect. A `Host` other than `127.0.0.1:<port>` or `localhost:<port>` gets 403 (DNS rebinding).
- Only `GET` and `HEAD` (405 for the rest). Towards the Bazaar it only does GET, at ≤ 2 req/s, and never returns the key.
- Rivals' text is shown as text, never as HTML.

## API

`/api/bazaar/board`, `/api/bazaar/score`, `/api/bazaar/live`, `/api/bazaar/threads`, `/api/bazaar/duels`.
