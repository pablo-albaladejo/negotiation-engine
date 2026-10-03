# viewer/src/screens/now/ — Pestaña «Now»

Qué está pasando ahora mismo, en una pantalla (primera pestaña del Bazaar):

1. **Cabecera del tick**: hora de juego, tick, ronda y peso, cuenta atrás al siguiente tick (o puertas cerradas y cuándo abren), edad del modelo y de los datos de la API, y la marca DRY-RUN (no se envía nada). «rebuilding…» si el servidor está construyendo otro modelo: se ve el último sin esperar.
2. **Plan del tick**: intenciones SELECTED del coordinador en orden de arbitraje, con acción, a qué conversación u oferta toca, la cifra decidida por código y el objetivo (`goal.why` → objetivo global). Cupos frente a `clock.limits`; las DROPPED, plegadas con su motivo.
3. **Conversaciones vivas**: dealers, duelos, El Rastro y venues; rondas usadas y estimadas, último precio de cada lado, turno, nuestra siguiente cifra, su siguiente precio previsto («her next ≈», ajuste por persona, solo dealers), plazo en ticks y estado (our move, waiting for them, accept pending, cooloff). Las terminadas, en una línea plegada. Cada fila abre el cajón de la conversación.
4. **Nuestras ofertas publicadas**: venue, precio, edad, comisión y si cruzan algo; estado de nuestro venue.
5. **Qué cambió desde el tick anterior**: foto en memoria del cliente (sobrevive al cambio de pestaña, no a recargar).

- **`NowView.tsx`** — la pantalla.
- **`nowModel.ts`** — funciones puras (`tickHeader`, `planRows`, `quotas`, `liveConversations`, `offerLines`, `snapshotOf`, `diffSnapshots`).

Datos: el tablero (`/api/bazaar/board`, cada tick) y el campo `now` de `/api/bazaar/model` (solo GET). Ni valores privados ni límites; todo texto plano.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
- → Servidor: [`viewer/server/bazaar/`](../../../server/bazaar/AGENTS.md) (el núcleo `now` del modelo)
