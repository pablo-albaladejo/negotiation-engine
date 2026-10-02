# Mapa de bazaar.causaprima.ai

Reconocimiento de **solo lectura** de la web y la API del Bazaar: bundles del frontend, `openapi.json` público y todos los endpoints que responden sin clave. Ningún POST, ninguna clave usada.

**Captura:** 3 oct 2026, ~00:50 (Madrid), con el mercado cerrado (tick 159, `paused: true`, `doors: closed`; reabre el sábado a las 09:00). Las cifras de mercado y clasificación son de ese momento.

## 1. Infraestructura

- **Backend:** FastAPI sobre uvicorn, detrás de Caddy (HTTP/2 + h3). `info`: *"The Bazaar" v0.1 — "Trading card negotiation game. Teams use X-Team-Key, brokers X-Broker-Key, admins X-Admin-Token."*
- **Frontend:** SPA React + Vite + React Router, pantallas cargadas en diferido (80 ficheros JS en `/assets/`). Editor YAML (CodeMirror) para las personas de admin.
- **Cabeceras de seguridad:** `X-Frame-Options: DENY`, `CSP frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `nosniff`.
- **Roles y autenticación** (cabeceras):
  - `X-Team-Key` — equipos.
  - `X-Broker-Key` — broker de un venue.
  - `X-Admin-Token` — organizadores. La consola lo guarda en `localStorage["bazaar.admin"]` (y el playground de personas en `bazaar.admin.playground`).
  - El SSE acepta también la clave por query: `?key=` (equipo) o `?token=` (admin).
- `robots.txt`, `sitemap.xml`, `manifest.json`, `.well-known/*` **no existen**: la ruta comodín `GET /{path}` devuelve el `index.html` del SPA.
- `GET /api/health` (público): `{ok, tick, last_tick_age_s, loop_age_s, paused, doors, uptime_s, pending_voices}`.

## 2. Páginas (rutas del SPA)

### Públicas

| Ruta | Pantalla | Qué muestra |
|---|---|---|
| `/` | **BigScreen** | La pantalla del evento: clasificación (*Standings*, columnas *Negotiating* y *Market-making*), *Game clock*, *The dealer ladder*, *Coming up*, *Rarest card*, *Markets*, anuncios (*From the organisers*, *A gift for everyone*, *New round*, *New set*, *Dealer change*, *Clock change*, *We open / We close*), *The Market Test*. Modo pantalla completa (*Big screen mode*). |
| `/cards`, `/cards/:setId` | **Catalogue** | Sets, rarezas y tiradas; KPIs *Copies in circulation*, **Shinies found** (épicas y legendarias aparecidas) y **Secret cards found** (*"rumours only — nobody has found one yet"*); por carta *Found so far* / *Still out there*; *Packs and their odds*; *How a collection is worth more* (marginales de copia, bonus de página y de master). |
| `/personas`, `/personas/:id` | **PersonaGallery** | *The card dealers* / *The stalls*: rasgos (Patience, Generosity, Shrewdness, Memory, Strictness, Chattiness), menú, *When they deal with you* (*Early, for your team: …* / *For everyone: …*) y *The dealer ladder*. |
| `/styleguide` | Styleguide | Sistema de diseño de la web. |
| `*` | NotFound | — |

### Consola del game master (`/admin`, exige token)

| Ruta | Pantalla |
|---|---|
| `/admin` | **ControlRoom** — reloj, ticks, calendario, rondas, anuncios. |
| `/admin/personas`, `/admin/personas/:id` | **PersonaList** / **PersonaEditor** — YAML de cada dealer, lint, versiones, rollback, playground. |
| `/admin/teams`, `/admin/teams/:id` | **Teams** — grant, adjust, freeze, rotar clave. |
| `/admin/insights`, `/admin/insights/:id` | **Insights**. |
| `/admin/venues`, `/admin/venues/:id` | **Venues** — suspender / reactivar. |
| `/admin/duels` | **Duels** — programar oleadas. |
| `/admin/bench` | **Bench** — *The Market Test*. |
| `/admin/threads`, `/admin/threads/:id` | **Threads** — todas las conversaciones. |
| `/admin/cards`, `/admin/cards/:id` | **CardsAdmin** — quién tiene cada copia. |
| `/admin/events` | **Events** — log completo filtrable. |

### Documentación automática (pública)

- `/docs` — Swagger UI.
- `/redoc` — ReDoc.
- `/openapi.json` — spec completa (≈ 50 KB) **con los endpoints de admin incluidos**. (`/api/docs` y `/api/openapi.json` dan 404.)

## 3. API (84 operaciones en el OpenAPI + 2 ocultas)

### Públicas (sin clave)

| Método | Ruta | Contenido |
|---|---|---|
| GET | `/api/health` | Estado del servidor. |
| GET | `/api/clock` | Tick, ronda, `limits`, calendario de los tres días, `doors`. |
| GET | `/api/catalog` | Rarezas, 6 sets con sus 72 cartas (`minted` incluido), 4 sobres con sus probabilidades, `values`. |
| GET | `/api/leaderboard` | Ronda(s), equipos (score, negotiating, market, level, album, pages, `rarest`, `luck`, deals, badges, adjustments, frozen, venue) y venues. Snapshot cada 5 ticks. |
| GET | `/api/feed?limit=` | Eventos públicos. **Tope real: 500 eventos.** |
| GET | `/api/schedule` | Todo lo programado hasta el cierre (§ 5). |
| GET | `/api/levels` | Escalera de dealers (id, teaser, how, `opens_to_all_at_hours`). |
| GET | `/api/dealers`, `/api/dealers/{pid}` | Personas: rasgos, `unlock`, `menu` (precios de lista y apertura). |
| GET | `/api/venues` | Venues con comisión, reglas, volumen y comisiones cobradas. |
| GET | `/api/venues/{vid}/offers` | Tablón de un venue (El Rastro: 60 ofertas abiertas en la captura). |
| GET | `/api/events/stream` | SSE. Sin clave, `scope=public`; arranca con `event: hello`. Con `X-Team-Key`/`?key=` scope de equipo; con token, `scope=admin`. |

### Equipo (`X-Team-Key`)

| Método | Ruta | Cuerpo / parámetros |
|---|---|---|
| GET | `/api/me` | — |
| GET | `/api/me/value` | `?card=` (valor privado de una carta) |
| GET | `/api/me/threads` | `?status=` |
| GET | `/api/me/offers` | — |
| GET | `/api/cards/{asset_id}` | id numérico del asset |
| POST | `/api/threads` | `OpenThread{with, topic?, venue?}` |
| GET | `/api/threads/{tid}` | — |
| POST | `/api/threads/{tid}/messages` | `PostMessage{text?, price?, days?, offer?, topic?}` |
| POST | `/api/threads/{tid}/close` | — |
| POST | `/api/offers` | `NewOffer{venue?, to?, give?, want?, expires_in_ticks?}` |
| DELETE | `/api/offers/{oid}` | — |
| POST | `/api/offers/{oid}/accept` | — |
| POST | `/api/packs/{aid}/open` | — |
| POST | `/api/venues` | `NewVenue{name, fee_bps?, fee_per_card?, rules?, description?}` |
| PATCH | `/api/venues/{vid}` | comisión |
| POST | `/api/venues/{vid}/close` | — |
| POST | `/api/flags` | `{message_id, reason}` (acierto puntúa, fallo resta) |
| GET | `/api/duels` | `?done=` |
| POST | `/api/duels/{did}/messages` | `PostMessage` |
| POST | `/api/duels/{did}/accept` | — |

### Broker (`X-Broker-Key`)

`GET /api/broker/book`, `POST /api/broker/matches`, `POST /api/broker/announce`.

### Admin (`X-Admin-Token`)

- **Reloj y rondas:** `GET overview`, `POST clock`, `PUT calendar`, `POST tick`, `GET rounds`, `POST rounds/start`, `POST rounds/end`, `POST rounds/{rid}/void`, `POST rounds/{rid}/weight`, `POST announce`.
- **Equipos:** `GET/POST teams`, `GET teams/{tid}`, `POST teams/{tid}/rotate|grant|adjust|freeze`.
- **Personas:** `GET/POST personas`, `GET/PUT personas/{pid}`, `GET personas/{pid}/lint`, `GET personas/{pid}/versions/{ver}`, `POST personas/{pid}/rollback`, `POST personas/{pid}/playground`.
- **Supervisión:** `GET threads` (`status, persona, team, limit`), `GET threads/{tid}`, `GET levels`, `POST levels/{lid}`, `GET integrity`, `POST integrity/clear`, `GET venues`, `POST venues/{vid}/suspend|unsuspend`, `GET cards` (`card, owner`), `GET cards/{aid}`.
- **Eventos:** `GET duels`, `POST duels`, `GET bench`, `POST bench`, `GET insights`, `GET leaderboard`, `GET events` (`type, actor, contains, limit, before`), `GET settlements` (`team, limit`), `GET config`, `POST export`.
- **Ocultas** (las usa el frontend, no están en el OpenAPI): `/api/admin/news` y `/api/admin/news/{id}/air`.

Todas prefijadas con `/api/admin/`. Sin token devuelven 401.

## 4. Eventos (tipos que pinta el frontend)

Sacados de `EventLine-*.js` (el que convierte cada evento en frase):

- **Mercado:** `offer.listed`, `offer.cancelled`, `settlement`, `settlement.failed`, `pack.opened`.
- **Dealers:** `thread.opened`, `thread.message`, `thread.closed`, `persona.updated`, `persona.open_to_all`, `persona.strike` (*"{dealer} gave {team} a strike (…) — N so far"*), `persona.cooloff` (*"{dealer} sent {team} away until T{tick}"*), `gift.given`.
- **Niveles y premios:** `level.announced`, `level.activated`, `level.unlocked`, `badge.awarded`, `egg.found`, `egg.given`.
- **Duelos:** `duels.scheduled`, `duel.started`, `duel.message`, `duel.result`, `duel.closed`, `duels.finished`.
- **Venues:** `venue.opened`, `venue.closing`, `venue.closed`, `venue.reopened`, `venue.suspended`, `venue.fee_announced`, `venue.fee_changed`, `venue.announcement`.
- **Bench:** `bench.started`, `bench.finished`.
- **Reloj, rondas y sets:** `clock.changed`, `calendar.changed`, `calendar.switched`, `day.opened`, `day.closed`, `round.started`, `round.ended`, `round.voided`, `round.weight`, `set.released`, `schedule.fired`, `schedule.failed`.
- **Equipos y admin:** `team.joined`, `team.granted`, `admin.grant`, `admin.adjustment`, `admin.freeze`, `admin.key_rotated`, `flag.raised` (en admin añade *"a real trick"* / *"a false alarm"*), `announcement`, `engine.error`.

## 5. El juego en datos

### Calendario y límites (`/api/clock`)

| Día | Abre | Cierra | Tick |
|---|---|---|---|
| Viernes | 19:00 | 23:00 | 60 s |
| Sábado | 09:00 | 23:00 | 30 s |
| Domingo | 09:00 | 15:00 | 15 s |

Límites: 1 aceptación por equipo y tick · 1 mensaje por lado y tick · 6 hilos abiertos · 30 ofertas abiertas · 12 ofertas nuevas por tick. Tick entre 5 y 60 s.

### Programa (`/api/schedule`, horas de juego)

| h | Acción | Nota |
|---|---|---|
| 3.0 | `bench` | The Market Test: every venue gets the same synthetic book |
| 4.0 | `round` | Round 2 starts (holdings carry over) |
| 4.0 | `set_release` | El Retiro released |
| 4.0 | `day_closes` | Closed until Saturday 09:00 |
| 4.0 | `day_opens` | Saturday opens |
| 4.05 | `grant_all` | El Retiro has arrived: a pack and the Saturday allowance (150 primas) for everyone |
| 5.0 | `bench` | The Market Test: every venue gets the same synthetic book |
| 6.5 | `duels` | Duels I: price only, one round-robin |
| 7.0 | `bench` | The Market Test: every venue gets the same synthetic book |
| 9.0 | `bench` | The Market Test: every venue gets the same synthetic book |
| 11.0 | `bench` | The Market Test: every venue gets the same synthetic book |
| 13.0 | `bench` | The Market Test: every venue gets the same synthetic book |
| 13.0 | `duels` | Duels II: price and delivery day; the pie grows for teams that trade on what each side cares about |
| 15.0 | `bench` | The Market Test: every venue gets the same synthetic book |
| 16.0 | `bench` | The hard Market Test: firmer and more impatient traders |
| 17.0 | `bench` | The Market Test: every venue gets the same synthetic book |
| 18.0 | `round` | Round 3 starts |
| 18.0 | `set_release` | Chamberí released |
| 18.0 | `day_closes` | Closed until Sunday 09:00 |
| 18.0 | `day_opens` | Sunday opens |
| 18.05 | `grant_all` | The Sunday allowance: 150 primas for everyone |
| 19.0 | `bench` | The Market Test: every venue gets the same synthetic book |
| 20.0 | `duels` | Duels III: two issues, shorter clock, harder decay |
| 21.0 | `bench` | The Market Test: every venue gets the same synthetic book |
| 22.8 | `announce` | finale warning |
| 23.0 | `persona` | Finale: stalls close |
| 23.0 | `persona` | Finale: stalls close |
| 23.0 | `duels` | The Grand Final: the last duel wave, on the big screen |
| 23.9 | `announce` | freeze warning |
| 24.0 | `end_round` | Scores freeze |
| 24.0 | `day_closes` | The Bazaar closes |

Parámetros relevantes: bench normal 10 traders y 16 ticks, *hard* 12 traders; duelos I `decay` 0,06 (1 ronda), II 0,08 (2 rondas, precio + día de entrega), III 0,1 (12 ticks), final 0,1 (12 ticks).

### Catálogo (`/api/catalog`)

| Rareza | Book | Tirada |
|---|---|---|
| Común | 10 | 300 |
| Infrecuente | 25 | 90 |
| Rara | 70 | 30 |
| Épica | 180 | 9 |
| Legendaria | 450 | 3 |

- 6 sets de 12 cartas (5 C, 3 U, 2 R, 1 E, 1 L). Publicados: LAV, MAL, LAT, SAL. RET sale el sábado (h4), CHA el domingo (h18).
- **Página del álbum = las 10 cartas de común a rara** (`page: true`); la épica (-11) y la legendaria (-12) quedan fuera y cuentan para el bonus de master. Álbum = 40 huecos (4 sets × 10), crecerá con RET y CHA.
- `values`: `copy_marginals` empieza en 1.0, `page_bonus` 0,25, `master_bonus` 0,1. Moneda: primas (P).
- Ninguna carta tiene `hidden: true` en el catálogo: las cartas secretas que anuncia el frontend no aparecen en la API pública.

| Set | Cartas |
|---|---|
| **LAV** Lavapiés | LAV-01 La Corrala (C) · LAV-02 El Frutero de Argumosa (C) · LAV-03 Té Moruno (C) · LAV-04 Mural de la Esquina (C) · LAV-05 Bici de Reparto (C) · LAV-06 La Tabacalera (U) · LAV-07 Samosas de la Plaza (U) · LAV-08 Teatro Valle-Inclán (U) · LAV-09 Cine Doré (R) · LAV-10 Fiesta de San Cayetano (R) · LAV-11 La Casa Encendida (E) · LAV-12 El Gato de Lavapiés (L) |
| **MAL** Malasaña | MAL-01 Vinilo de la Movida (C) · MAL-02 Plaza del Dos de Mayo (C) · MAL-03 Cartel de Conciertos (C) · MAL-04 El Tatuador (C) · MAL-05 Café de Madrugada (C) · MAL-06 Tienda de Discos (U) · MAL-07 Mercado de San Ildefonso (U) · MAL-08 La Vía Láctea (U) · MAL-09 La Heroína del Dos de Mayo (R) · MAL-10 Noche de Movida (R) · MAL-11 La Sala Pentagrama (E) · MAL-12 La Reina de la Movida (L) |
| **LAT** La Latina | LAT-01 Caña en la Cava Baja (C) · LAT-02 Puesto del Rastro (C) · LAT-03 Huevos Rotos (C) · LAT-04 Mercado de la Cebada (C) · LAT-05 El Organillero (C) · LAT-06 La Chulapa (U) · LAT-07 Vermut del Domingo (U) · LAT-08 Las Vistillas (U) · LAT-09 San Isidro (R) · LAT-10 El Mesón de la Cava (R) · LAT-11 San Francisco el Grande (E) · LAT-12 El Rastro al Amanecer (L) |
| **SAL** Salamanca | SAL-01 Escaparate de Serrano (C) · SAL-02 El Portero (C) · SAL-03 Perrito con Abrigo (C) · SAL-04 Café en Goya (C) · SAL-05 Taxi Blanco (C) · SAL-06 La Galería (U) · SAL-07 Mercado de la Paz (U) · SAL-08 Guantería Antigua (U) · SAL-09 El Marqués (R) · SAL-10 Museo Lázaro Galdiano (R) · SAL-11 La Puerta de Alcalá (E) · SAL-12 La Dama de Serrano (L) |
| **RET** El Retiro | RET-01 Barca del Estanque (C) · RET-02 La Castañera (C) · RET-03 El Titiritero (C) · RET-04 Paseo de Coches (C) · RET-05 La Ardilla (C) · RET-06 La Rosaleda (U) · RET-07 Fuente de la Alcachofa (U) · RET-08 Palacio de Velázquez (U) · RET-09 El Ángel Caído (R) · RET-10 Monumento a Alfonso XII (R) · RET-11 Palacio de Cristal (E) · RET-12 El Ahuehuete (L) |
| **CHA** Chamberí | CHA-01 Andén de Metro (C) · CHA-02 Kiosco de Prensa (C) · CHA-03 La Churrería (C) · CHA-04 Mercado de Vallehermoso (C) · CHA-05 Plaza de Olavide (C) · CHA-06 Estación de Chamberí (U) · CHA-07 Club de Jazz (U) · CHA-08 El Instituto (U) · CHA-09 Museo Sorolla (R) · CHA-10 Casa de las Flores (R) · CHA-11 Andén 0 (E) · CHA-12 El Tren Fantasma (L) |

### Sobres

| Sobre | Ranuras | Book esperado |
|---|---|---|
| `sobre_barrio` (Neighbourhood) | C · C · C 75 % / U 25 % | 33,8 |
| `sobre_bienvenida` (Welcome) | C · U · U 60 % / R 40 % | 78 |
| `sobre_plata` (Silver) | C · C · U · U · R 86 % / E 12 % / L 2 % | 160,8 |
| `sobre_oro` (Gold) | U · U · R · R · E 85 % / L 15 % | 410,5 |

### Dealers (`/api/dealers`)

| | Abuela Carmen (`abuela`) | El Chato (`chato`) |
|---|---|---|
| Nivel | 1 (siempre abierta) | 2 (antes con 3 tratos con Abuela; abierto a todos desde h2,63) |
| Rasgos | paciencia 0,85 · generosidad 0,8 · astucia 0,2 · memoria 0,15 · rigor 0,1 · charla 0,75 | paciencia 0,35 · generosidad 0,25 · astucia 0,85 · memoria 0,9 · rigor 0,85 · charla 0,3 |
| Vende | sobre de barrio: lista 26, pide 30 (3/equipo/h) · comunes 10 · infrecuentes 25 | sobre de plata: lista 150, pide 188 (2/equipo/h) · infrecuentes 26 · raras 77 |
| Compra | comunes, infrecuentes | infrecuentes, raras |
| Tratos/equipo/h | 8 | 6 |

Los dos cierran el puesto en h23 (`persona … enabled: false`).

### Venues (`/api/venues`)

| Venue | Nombre | Dueño | Comisión | Mecanismo | Tratos |
|---|---|---|---|---|---|
| `rastro` | El Rastro | la casa | 5 % + 1 P/carta | — | 45 |
| `v01` | Mercado Team 6 | Team 6 | 0,5 % | board | 0 |
| `v02` | El Duende · zero fee | Team 12 | 0 % | board | 0 |
| `v03` | Mercado Trece · 1% fee | Team 13 | 1 % | board | 0 |
| `v04` | **Team 2 · El Rastro Express (nuestro)** | Team 2 | 0 % | `auto` | 0 |

### Clasificación (tick 155, ronda 1 peso 0,5; pesos negotiating 30 / market 30)

| # | Equipo | Score | Neg. | Mercado | Nivel | Álbum | Páginas | Tratos |
|---|---|---|---|---|---|---|---|---|
| 1 | Team 13 | 30.0 | 30.0 | 0.0 | 2 | 25/40 | 1 | 24 |
| 2 | Team 12 | 27.9 | 27.9 | 0.0 | 2 | 23/40 | 1 | 21 |
| 3 | Team 17 | 22.1 | 22.1 | 0.0 | 2 | 25/40 | 1 | 15 |
| 4 | Team 10 | 20.8 | 20.8 | 0.0 | 2 | 23/40 | 1 | 19 |
| 5 | Team 5 | 20.0 | 20.0 | 0.0 | 2 | 20/40 | 1 | 24 |
| 6 | Team 4 | 19.9 | 19.9 | 0.0 | 2 | 23/40 | 0 | 13 |
| 7 | Team 18 | 19.2 | 19.2 | 0.0 | 2 | 22/40 | 1 | 17 |
| 8 | Team 14 | 18.1 | 18.1 | 0.0 | 2 | 19/40 | 0 | 11 |
| 9 | Team 8 | 17.6 | 17.6 | 0.0 | 2 | 26/40 | 1 | 12 |
| 10 | Team 3 | 14.6 | 14.6 | 0.0 | 2 | 21/40 | 0 | 9 |
| 11 | Team 6 | 12.1 | 12.1 | 0.0 | 2 | 25/40 | 0 | 18 |
| 12 | Team 15 | 10.3 | 10.3 | 0.0 | 1 | 26/40 | 1 | 13 |
| 13 | Team 9 | 9.5 | 9.5 | 0.0 | 2 | 20/40 | 0 | 10 |
| 14 | Team 7 | 9.0 | 9.0 | 0.0 | 2 | 28/40 | 1 | 13 |
| 15 | Team 1 | 8.3 | 8.3 | 0.0 | 2 | 18/40 | 0 | 4 |
| 16 | Team 16 | 6.9 | 6.9 | 0.0 | 2 | 14/40 | 0 | 5 |
| 17 | Team 2 | 6.8 | 6.8 | 0.0 | 2 | 19/40 | 0 | 7 |
| 18 | Team 11 | 0.0 | 0.0 | 0.0 | 1 | 13/40 | 0 | 0 |

Nadie tiene aún puntos de mercado: ese componente lo da *The Market Test*.

## 6. Hallazgos

1. **El feed público enseña las conversaciones de todos los equipos con los dealers.** `thread.message` lleva el texto del dealer y su oferta estructurada, y `settlement` el precio cerrado. Es la mejor fuente para calibrar a cuánto cede de verdad cada dealer. Recordatorio de la regla del repo: del rival solo se lee la estructura; si el texto de un dealer cuenta como "rival" es decisión del equipo.
2. **Easter eggs: existen en código y reglas, no los hemos visto.**
   - Fuente 1, `EventLine-*.js`: `egg.found` → *"{team} found an easter egg at {persona}'s stall"* (en admin añade el nombre del egg); `egg.given` comparte rama con `gift.given` y `admin.grant` (caja, sobres o cartas, con motivo).
   - Fuente 2, [`kit/RULES.md`](kit/RULES.md) línea 122: *"What never counts: … gifts, easter eggs, and organiser grants."*
   - En los 500 eventos del feed (ids 8852–10891) **no hay ningún `egg.*`**. Que estén en los puestos de los dealers se deduce del texto del frontend; qué los dispara no está documentado.
3. **Abuela regala cartas.** En el feed: MAL-02 a Team 17 (tick 146) y LAT-06 a Team 7 (tick 157), `reason: "gift from Abuela Carmen"`. No puntúan por sí mismas, pero pueden completar una página, y la página sí suma.
4. **Los dealers castigan:** `persona.strike` acumula avisos y `persona.cooloff` echa a un equipo hasta un tick.
5. **Flags:** `POST /api/flags` con el id de un mensaje de mala fe; acierto puntúa y fallo resta.
6. **Cartas secretas y shinies:** el catálogo web cuenta *Secret cards found* (0 de momento) y *Shinies found* (épicas y legendarias aparecidas).
7. ***The Market Test* se repite cada 2 h** sobre todos los venues con el mismo libro sintético. Es lo que puntúa el componente de mercado (peso 30); nuestro `v04` en modo `auto` es lo que se evalúa.

## Cómo reproducirlo

```bash
B=https://bazaar.causaprima.ai
curl -s $B/openapi.json                        # todos los endpoints
curl -s $B/ | grep assets/                     # bundle de entrada del SPA
curl -s "$B/api/feed?limit=500"                # feed público (tope 500)
curl -s -N -m 5 $B/api/events/stream           # SSE público
```

`pnpm bazaar:scan` hace lo mismo con nuestra clave para los endpoints de equipo.
