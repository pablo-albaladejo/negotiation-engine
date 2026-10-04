# viewer/src/screens/nav/ — Enlaces entre pestañas

- **`Links.tsx`** — el contexto `NavCtx` (lo pone `viewer/src/screens/BazaarScreen.tsx`) y los enlaces que lo usan: `TickLink` («t1231» abre el cajón «Tick 1231») y `DealerName` (abre la pestaña «Dealers» con ese dealer elegido). `TeamName` (en `teams/`) usa el mismo contexto y, si recibe el id de un dealer, lo pinta como `DealerName`. Sin el contexto se pintan como texto.
- **`TickPanel.tsx`** — el cajón «Tick N»: lo que el tablero vio a ±2 ticks de N, del más antiguo al más nuevo (nuestras conversaciones: abierta, mensaje y cierre; tratos entre otros equipos, ofertas dirigidas, feed público, eggs encontrados, el Taller y los grants), con ← → para moverse de tick. Cada conversación abre su cajón. Solo lectura.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
