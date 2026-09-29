# protocol

Esquemas Zod de los mensajes del ring y adaptadores de entrada y salida.

El protocolo está **por confirmar** (A2A, HTTP JSON o MCP). Cuando se conozca, esta es la única carpeta que hay que reescribir: el motor y la arena no cambian.

- `schemas.ts`: contrato canónico (`TurnInput`, `TurnOutput`, oferta con exactamente los issues declarados) y `ProtocolError`.
- `adapter.ts`: núcleo común (valida la entrada sin invocar al cerebro y nunca envía una salida fuera de contrato), adaptador en memoria, `RingClient` y bucle de turnos por sondeo (modo cliente).
- `http.ts`: adaptador HTTP JSON genérico con Hono (`POST /turn`, `GET /health`), cliente de agente (`POST /turn` con tiempo máximo) y `RingClient` HTTP por sondeo (`GET /next` → 200 turno | 204 esperar | 410 fin; `POST /respond`; `POST /error`). Las rutas del modo cliente son provisionales.
- `sim-ring.ts`: ring simulado para el modo cliente y un rival de sparring lineal.

La batería común de contrato está en `test/protocol/contract.ts` y se ejecuta contra cada adaptador en ambos modos.
