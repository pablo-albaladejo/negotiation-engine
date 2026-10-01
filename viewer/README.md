# Visor de la arena

Visor local de lo que la arena, la promoción y el agente ya escribieron en `results/`.

```bash
pnpm --dir viewer install   # una vez
pnpm viewer                 # http://127.0.0.1:5199/ (VIEWER_PORT cambia el puerto)
pnpm viewer:test            # tests del visor (servidor, adaptadores, render)
pnpm viewer:typecheck
```

## Seguridad

- El servidor escucha **solo en `127.0.0.1`**; la dirección no es configurable, solo el puerto (`VIEWER_PORT`).
- **Sin autenticación**, a propósito: nadie fuera de esta máquina puede conectarse. Las peticiones con una cabecera `Host` distinta de `127.0.0.1:<puerto>` o `localhost:<puerto>` reciben 403 (DNS rebinding).
- Solo lectura: `GET` y `HEAD`; cualquier otro método recibe 405. Lee solo `results/` y, de `config/`, el fichero de escenario cuyo nombre y hash coinciden con la cabecera de una traza de torneo.
- Los identificadores de la URL se validan (`^[A-Za-z0-9_.-]{1,128}$`, sin `..`) y toda ruta se resuelve con `realpath` dentro de su raíz (400/404 si no).
- El contenido de los logs se valida línea a línea con los esquemas Zod de los escritores y se devuelve como datos (`{ data, errors }`); el servidor nunca lo ejecuta ni lo renderiza.

## API

`/api/runs`, `/api/runs/:runId`, `/api/runs/:runId/games/:gameId`, `/api/tournament/:runId`, `/api/tournament/:runId/:session`, `/api/scenario-ref?id&hash`.
