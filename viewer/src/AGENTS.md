# viewer/src/ — App React

Una sola pantalla: la pestaña del Bazaar (`#/bazaar`, filtros en la query del hash).

- **`App.tsx`** — cabecera (tema claro/oscuro) y `BazaarScreen`; captura errores de render.
- **`route.ts`** — `parseRoute` / `routeTo.bazaar`.
- **`bazaarBoardLive.ts`** — `useBazaarBoard`: lee `/api/bazaar/board` y `/api/bazaar/score` una vez por tick.
- **`bazaarModelLive.ts`** — `useBazaarModel`: lee `/api/bazaar/model` solo con la vista Model o un cajón abierto.
- **`model/gameModel.ts`** — tipos tolerantes del modelo y funciones puras: resumen de tiempo, línea de tiempo, personas, pistas (filtros), precios, venues, sobres, flags, camino previsto sobre la curva (`withPlannedPath`, `modelCurve`).
- **`screens/ModelView.tsx`** — la vista Model y `ConversationModelPanel` (estado y estrategia en el cajón).
- **`model/`** — `model/bazaarBoard.ts` (lista unificada, filtros, línea temporal), `model/bazaar.ts` (historia de la cifra), `model/bazaarConversations.ts`, `model/cockpit.ts` (puesto, lo abierto ahora, tratos que movieron la cifra, agentes, calendario, historial y quién es quién: `partyOf`, `teamLabel`, `bookMakerLabel`; curva de la negociación: `offerCurve`, `niceScale`, `curveRoundLines`).
- **`screens/BazaarScreen.tsx`** — la cabina (cifra, próximas citas, ahora, álbum, Δ de la cifra, agentes, historial y mercado plegados).
- **`ui/`** — piezas pequeñas (títulos, estados vacíos, botones, rejilla).

## Links

- ↑ [`viewer/`](../AGENTS.md)
- → Design system: [`design-system/`](../../design-system/AGENTS.md)
