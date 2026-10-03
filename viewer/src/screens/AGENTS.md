# viewer/src/screens/ — Pantallas

- **`BazaarScreen.tsx`** — la cabina del Bazaar y sus pestañas (Now / la API / nuestro modelo); cajón de cada conversación con la curva y el camino previsto.
- **[`now/`](now/AGENTS.md)** — la pestaña «Now»: qué está pasando ahora mismo (tick, plan del tick, conversaciones vivas, nuestras ofertas, qué cambió).
- **`DealerEstimates.tsx`** — panel «Dealer estimates» de la vista Model: por persona, parámetros (valor, intervalo, n y su convergencia), límites por banda (marca *fewSamples*); solo el lado del dealer.
- **`Rivals.tsx`** — panel «Other teams · collections» de la vista Model (`GameState.rivals`): oportunidades (cartas nuestras que otro equipo pide o que lo dejan a ≤ 2 de una página), una fila por equipo (rank, álbum, vistas, no vistas, página más cercana, lo que pide, repetidas) con la evolución de su score, y el detalle del elegido (score, rank y álbum en el tiempo; cada carta vista con el tick en que `/api/cards` confirmó que sigue siendo suya). Solo lectura.
- **`DealerFitStrip.tsx`** — `PersonaStrategy` (dentro de la tarjeta «Strategy» del cajón: parámetros de la persona según el modelo de hoy, límite de la banda con su book, `welcome`) y la tira «Dealer fit» del cajón, junto a la tabla de ofertas: β, max_rounds, markup, espejo y ronda de retirada de esa persona (intervalo y n), límite medido de esa banda (*fewSamples*) y, si es la primera conversación con ese dealer, la marca `welcome` («limit only, not the curve»).
- **`NewsSignals.tsx`** — tarjeta «News signals» de la vista Model (`GameState.news`), junto al corpus de pistas: tick y edad, fuente, titular, dirección (demand, supply, event, unknown), menciones por tipo, la marca «unverified» y el resumen del LLM. Pista, nunca una cifra.
- **`ModelView.tsx`** — la vista Model (entorno → estado → decisión, línea de tiempo, coordinador, objetivos, personas, pistas, mercados, venues, precios, sobres, eggs y flags) y `ConversationModelPanel`.

Solo texto plano: nada de HTML inyectado.

## Links

- ↑ [`viewer/src/`](../AGENTS.md)
- ↓ [`now/`](now/AGENTS.md)
- → Lógica: [`model/`](../model/AGENTS.md) · Piezas: [`ui/`](../ui/AGENTS.md)
