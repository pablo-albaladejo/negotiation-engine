# viewer/src/ — App React

Una sola pantalla: la pestaña del Bazaar (`#/bazaar`, filtros en la query del hash).

- **`App.tsx`** — cabecera (tema claro/oscuro) y `BazaarScreen`; captura errores de render.
- **`route.ts`** — `parseRoute` / `routeTo.bazaar`.
- **`bazaarBoardLive.ts`** — `useBazaarBoard`: lee `/api/bazaar/board` y `/api/bazaar/score` una vez por tick.
- **`model/`** — `model/bazaarBoard.ts` (lista unificada, filtros, línea temporal), `model/bazaar.ts` (historia de la cifra), `model/bazaarConversations.ts`.
- **`screens/BazaarScreen.tsx`** — la vista.
- **`ui/`** — piezas pequeñas (títulos, estados vacíos, botones, rejilla).

## Links

- ↑ [`viewer/`](../AGENTS.md)
- → Design system: [`design-system/`](../../design-system/AGENTS.md)
