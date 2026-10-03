# viewer/src/screens/ — Pantallas

- **`BazaarScreen.tsx`** — la cabina del Bazaar y sus pestañas (Now / la API / nuestro modelo); cajón de cada conversación con la curva y el camino previsto.
- **[`now/`](now/AGENTS.md)** — la pestaña «Now»: qué está pasando ahora mismo (tick, plan del tick, conversaciones vivas, nuestras ofertas, qué cambió).
- **`DealerEstimates.tsx`** — panel «Dealer estimates» de la vista Model: por persona, parámetros (valor, intervalo, n y su convergencia), límites por banda (marca *fewSamples*); solo el lado del dealer.
- **`DealerFitStrip.tsx`** — tira «Dealer fit» del cajón, junto a la tabla de ofertas: β, max_rounds, markup, espejo y ronda de retirada de esa persona (intervalo y n), límite medido de esa banda (*fewSamples*) y, si es la primera conversación con ese dealer, la marca `welcome` («limit only, not the curve»).
- **`ModelView.tsx`** — la vista Model (entorno → estado → decisión, línea de tiempo, coordinador, objetivos, personas, pistas, mercados, venues, precios, sobres, eggs y flags) y `ConversationModelPanel`.

Solo texto plano: nada de HTML inyectado.

## Links

- ↑ [`viewer/src/`](../AGENTS.md)
- ↓ [`now/`](now/AGENTS.md)
- → Lógica: [`model/`](../model/AGENTS.md) · Piezas: [`ui/`](../ui/AGENTS.md)
