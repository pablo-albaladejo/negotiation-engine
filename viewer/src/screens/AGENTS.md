# viewer/src/screens/ — Pantallas

- **`BazaarScreen.tsx`** — la cabina del Bazaar y sus pestañas (Now / la API / nuestro modelo / Venues / Forex); cajón de cada conversación con la curva y el camino previsto.
- **[`now/`](now/AGENTS.md)** — la pestaña «Now»: qué está pasando ahora mismo (tick, plan del tick, conversaciones vivas, nuestras ofertas, qué cambió).
- **[`market-test/`](market-test/AGENTS.md)** — la pestaña «Market test»: nuestras sesiones de bench en auto (v04) frente a board (v26), con el libro tick a tick y nuestros emparejamientos.
- **[`profile/`](profile/AGENTS.md)** — nuestro perfil bajo el marcador: los easter eggs que hemos encontrado (sondeo y premio) y los de cada persona.
- **[`venues/`](venues/AGENTS.md)** — la pestaña «Venues»: el libro de todos los venues abiertos, cada oferta marcada frente a nuestra mano y nuestros valores (NEG como quien acepta, dup, última copia), con filtros.
- **[`forex/`](forex/AGENTS.md)** — la pestaña «Forex»: las cadenas A → B → C de `bazaar:play` (comprar, guardar, vender) con el paso actual resaltado, margen neto y peor caso.
- **[`album/`](album/AGENTS.md)** — la tarjeta «Album» como cromos, igual que /cards del juego: una banda por set y un cromo por carta (las que tenemos y las que faltan), con el valor, la tirada y las shinies.
- **`DealerEstimates.tsx`** — panel «Dealer estimates» de la vista Model: por persona, parámetros (valor, intervalo, n y su convergencia), límites por banda (marca *fewSamples*); solo el lado del dealer.
- **`Rivals.tsx`** — panel «Other teams · collections» de la vista Model (`GameState.rivals`): oportunidades (cartas nuestras que otro equipo pide o que lo dejan a ≤ 2 de una página), una fila por equipo (rank, álbum, vistas, no vistas, página más cercana, lo que pide, repetidas) con la evolución de su score, y el detalle del elegido (score, rank y álbum en el tiempo; cada carta vista con el tick en que `/api/cards` confirmó que sigue siendo suya). Solo lectura.
- **`DealerFitStrip.tsx`** — `PersonaStrategy` (dentro de la tarjeta «Strategy» del cajón: parámetros de la persona según el modelo de hoy, límite de la banda con su book, `welcome`) y la tira «Dealer fit» del cajón, junto a la tabla de ofertas: β, max_rounds, markup, espejo y ronda de retirada de esa persona (intervalo y n), límite medido de esa banda (*fewSamples*) y, si es la primera conversación con ese dealer, la marca `welcome` («limit only, not the curve»).
- **`NewsSignals.tsx`** — tarjeta «News signals» de la vista Model (`GameState.news`), junto al corpus de pistas: tick y edad, fuente, titular, dirección (demand, supply, event, unknown), menciones por tipo, la marca «unverified» y el resumen del LLM. Pista, nunca una cifra.
- **`ScoreTree.tsx`** — árbol de la puntuación en la tarjeta «Score» (valor, Δ día, Δ tick; MARKET solo nuestro venue) y `ComponentChip`, el chip de color con la parte que alimenta cada acción (columna «Feeds» del historial y detalle del trato).
- **`TeamDesk.tsx`** — tarjeta «Team desk» de la cabina, bajo «Right now»: por equipo, cada oferta que nos hacen (to-me) → nuestra contraoferta de venta y sus bajadas → resultado, con chip NEG (`negIfFilled`, o `negDelta` al llenarse), color por estado (would, sent, filled, expired…) y total de neg ganado por equipo. Suelo y valor de servidor solo como texto secundario («local only»). Solo lectura.
- **`Workshop.tsx`** — tarjeta «The Workshop» (El Taller) de la cabina, bajo «Our agents»: repetidas libres por rareza frente a las 3 necesarias (`ready → <siguiente>`), copias ocupadas que no cuentan y los «taller.crafted» públicos. Solo lectura: el POST `/api/taller` lo aprueba Pablo aparte.
- **`ModelView.tsx`** — la vista Model (entorno → estado → decisión, línea de tiempo, coordinador, objetivos, personas, pistas, mercados, venues, precios, sobres, eggs y flags) y `ConversationModelPanel`.

Solo texto plano: nada de HTML inyectado.

## Links

- ↑ [`viewer/src/`](../AGENTS.md)
- ↓ [`now/`](now/AGENTS.md)
- ↓ [`venues/`](venues/AGENTS.md)
- ↓ [`profile/`](profile/AGENTS.md)
- ↓ [`market-test/`](market-test/AGENTS.md)
- ↓ [`album/`](album/AGENTS.md)
- ↓ [`forex/`](forex/AGENTS.md)
- → Lógica: [`model/`](../model/AGENTS.md) · Piezas: [`ui/`](../ui/AGENTS.md)
