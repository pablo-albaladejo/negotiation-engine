# viewer/src/screens/ — Pantallas

- **`BazaarScreen.tsx`** — la cabina del Bazaar y sus pestañas (Now, Cockpit, Cards, Model, Venues, Forex, Market test, Eggs, News, Teams, Dealers), con etiquetas cortas con icono y una frase bajo las pestañas que dice qué responde; cajón de cada conversación con la curva y el camino previsto.
- **[`now/`](now/AGENTS.md)** — la pestaña «Now»: qué está pasando ahora mismo (tick, plan del tick, conversaciones vivas, nuestras ofertas, qué cambió).
- **[`market-test/`](market-test/AGENTS.md)** — la pestaña «Market test»: nuestras sesiones de bench en auto (v04) frente a board (v26), con el libro tick a tick y nuestros emparejamientos.
- **[`profile/`](profile/AGENTS.md)** — nuestro perfil bajo el marcador: los easter eggs que hemos encontrado (sondeo y premio) y los de cada persona.
- **[`venues/`](venues/AGENTS.md)** — la pestaña «Venues»: el libro de todos los venues abiertos, cada oferta marcada frente a nuestra mano y nuestros valores (NEG como quien acepta, dup, última copia), con filtros.
- **[`forex/`](forex/AGENTS.md)** — la pestaña «Forex»: las cadenas A → B → C de `bazaar:play` (comprar, guardar, vender) con el paso actual resaltado, margen neto y peor caso.
- **[`news/`](news/AGENTS.md)** — la pestaña «News»: señales de noticias y Radio Rastro.
- **[`nav/`](nav/AGENTS.md)** — enlaces entre pestañas: cualquier «tN» abre el cajón «Tick N», un equipo su perfil en Teams y un dealer su fila en Dealers.
- **[`teams/`](teams/AGENTS.md)** — la pestaña «Teams»: todo lo que sabemos de cada equipo; cualquier nombre de equipo del visor abre esta pestaña en ese equipo.
- **[`album/`](album/AGENTS.md)** — la pestaña «Cards»: el álbum como cromos, igual que /cards del juego: una banda por set y un cromo por carta (las que tenemos y las que faltan), con el valor, la tirada y las shinies.
- **`DealerEstimates.tsx`** — panel «Dealer estimates» de la vista Model: por persona, parámetros (valor, intervalo, n y su convergencia), límites por banda (marca *fewSamples*); solo el lado del dealer.
- **`Rivals.tsx`** — lo que cada equipo tiene y pide según la estructura pública (`GameState.rivals`): el panel «Opportunities» de la pestaña Teams (cartas nuestras que otro equipo pide o que lo dejan a ≤ 2 de una página), `rivalCells` (evolución del score, página más cercana, lo que pide y repetidas de cada fila de la tabla de Teams) y `TeamDetail` (score, rank y álbum en el tiempo; cada carta vista con el tick en que `/api/cards` confirmó que sigue siendo suya) para el perfil. Solo lectura.
- **`DealerFitStrip.tsx`** — `PersonaStrategy` (dentro de la tarjeta «Strategy» del cajón: parámetros de la persona según el modelo de hoy, límite de la banda con su book, `welcome`) y la tira «Dealer fit» del cajón, junto a la tabla de ofertas: β, max_rounds, markup, espejo y ronda de retirada de esa persona (intervalo y n), límite medido de esa banda (*fewSamples*) y, si es la primera conversación con ese dealer, la marca `welcome` («limit only, not the curve»).
- **`NewsSignals.tsx`** — tarjeta «News signals» de la pestaña News (`GameState.news`): tick y edad, fuente, titular, dirección (demand, supply, event, unknown), menciones por tipo, la marca «unverified» y el resumen del LLM. Pista, nunca una cifra.
- **`ScoreTree.tsx`** — árbol de la puntuación en la tarjeta «Score» (valor, Δ día, Δ tick; MARKET solo nuestro venue) y `ComponentChip`, el chip de color con la parte que alimenta cada acción (columna «Feeds» del historial y detalle del trato).
- **`TeamDesk.tsx`** — tarjeta «Team desk» de la cabina, bajo «Right now»: por equipo, cada oferta que nos hacen (to-me) → nuestra contraoferta de venta y sus bajadas → resultado, con chip NEG (`negIfFilled`, o `negDelta` al llenarse), color por estado (would, sent, filled, expired…) y total de neg ganado por equipo. Suelo y valor de servidor solo como texto secundario («local only»). Solo lectura.
- **`Workshop.tsx`** — tarjeta «The Workshop» (El Taller) de la cabina, bajo «Our agents»: repetidas libres por rareza frente a las 3 necesarias (`ready → <siguiente>`), copias ocupadas que no cuentan, los «taller.crafted» públicos y una línea «Strategy» por rareza con la decisión de `GameState.workshop` (craft, hold o short, y por qué). Solo lectura: el POST `/api/taller` sale de `bazaar:play --workshop --confirm`.
- **`ModelView.tsx`** — la vista Model (entorno → estado → decisión, línea de tiempo, coordinador, objetivos, mercados, venues y sobres) y `ConversationModelPanel`; además exporta las tarjetas que usan otras pestañas: `Hints` (pistas: chips por dealer, etiquetas de por qué es candidata y texto completo) y `EggsAndFlags` (plan de sondeos en tarjetas, huevos y flags uno debajo del otro) para Eggs, `Personas` para Dealers y `Prices` para Cards.

Solo texto plano: nada de HTML inyectado.

## Links

- ↑ [`viewer/src/`](../AGENTS.md)
- ↓ [`now/`](now/AGENTS.md)
- ↓ [`venues/`](venues/AGENTS.md)
- ↓ [`profile/`](profile/AGENTS.md)
- ↓ [`market-test/`](market-test/AGENTS.md)
- ↓ [`album/`](album/AGENTS.md)
- ↓ [`news/`](news/AGENTS.md)
- ↓ [`nav/`](nav/AGENTS.md)
- ↓ [`teams/`](teams/AGENTS.md)
- ↓ [`forex/`](forex/AGENTS.md)
- → Lógica: [`model/`](../model/AGENTS.md) · Piezas: [`ui/`](../ui/AGENTS.md)
