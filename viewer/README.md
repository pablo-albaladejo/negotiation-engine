# Visor del Bazaar

Visor local de la partida del Bazaar: conversaciones con dealers, duelos, El Rastro, nuestra cifra y el mercado.

```bash
pnpm --dir viewer install   # una vez
set -a && . ./.env && set +a && pnpm viewer   # http://127.0.0.1:5199/#bazaar (VIEWER_PORT cambia el puerto)
pnpm viewer:test
pnpm viewer:typecheck
```

## Seguridad

- Escucha **solo en `127.0.0.1`**; la dirección no es configurable, solo el puerto (`VIEWER_PORT`).
- **Sin autenticación**, a propósito: nadie fuera de esta máquina puede conectarse. Un `Host` distinto de `127.0.0.1:<puerto>` o `localhost:<puerto>` recibe 403 (DNS rebinding).
- Solo `GET` y `HEAD` (405 para el resto). Hacia el Bazaar solo hace GET, a ≤ 2 req/s, y nunca devuelve la clave.
- El texto de los rivales se muestra como texto, nunca como HTML.

## API

`/api/bazaar/board`, `/api/bazaar/score`, `/api/bazaar/live`, `/api/bazaar/threads`, `/api/bazaar/duels`.
