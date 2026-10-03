# src/markets/ — Mercados

Ruta de mercados entre El Rastro y los venues de otros equipos: hueco neto por venue = hueco − comisión − penalización por rival; a igualdad, El Rastro.

## Archivos

- **`markets.ts`** — `proposeMarkets`, `bestVenue` y `executeMarkets`. Tabla de venues en `GameState.markets.venues` (dueño con su puesto y cifra, comisión, mecanismo, estado, profundidad; el nuestro, can't trade) y bid/ask por venue en la hoja de precios. `proposeMarkets`: para cada compra (lo que nos falta o completa página) o venta (repetidas) elige el venue con mejor hueco neto = hueco − comisión (ASSUMPTION: la pagamos nosotros) − `RIVAL_PENALTY` (0 en El Rastro, alta en venues del top 3, baja en la mitad baja: operar allí sube el Market-making del dueño y la cifra es relativa al líder); a igualdad, El Rastro. **HIPÓTESIS** sin verificar (RULES.md:75): en un venue auto una oferta que cruza se casa sin nuestra aceptación; se marca «fills without accept (unverified)» y aun así cuenta en el cupo. Hilos con un equipo en su venue solo para huecos grandes de página (propuesta). Juego limpio (`fairPrice`): no vendemos por debajo de la mitad del book ni compramos por encima del doble.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`coordinator/`](../coordinator/AGENTS.md)
- → [`state/`](../state/AGENTS.md)
