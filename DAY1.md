# El Bazaar — Semana 1, Sábado 3 de octubre

**Entrada para el día 2** — resumen de dónde estamos, cómo jugar y qué viene. Detalles en [`handoff/2026-10-02/HANDOFF.md`](handoff/2026-10-02/HANDOFF.md).

## Estado

- **Equipo 2:** rango **17 de 18**, puntuación **6.84** (toda en negociación; mercado 0, duelos 0, escalera 0.047).
- **Cartera:** efectivo 40, nivel 2, 7 tratos hechos, álbum 19/40 (0 páginas completas).
- **Urgencia:** página SAL necesita solo **SAL-09** (rara, valor ~177). Los 3 líderes ya tienen páginas completas.

## Cómo se juega

El Bazaar es un torneo de cromos de Madrid. Negociamos con dealers (Abuela Carmen, El Chato) para comprar cartas que faltan y vender repetidas. Un agente por dealer (código, HTTP); duelos 1 contra 1 contra otros equipos (precio y fechas de entrega). Las decisiones salen del motor (números), el texto es una plantilla. Nunca se revela la valoración privada.

- **Dealers:** cada uno tiene paciencia, límite de precios y un menú de cartas que compra/vende. Negociamos hasta cerrar.
- **Duelos:** mensaje + oferta por tick, una aceptación por tick. Los números juegan en excedente (cuánto ganamos vs. el rival).
- **Puntuación:** relativa al campo, se refresca cada 5 tics. Hay neg_points (comparación con una referencia de mercado), puntos de escalera (nivel, cartas) y del mercado si abrimos uno.

## El juego mañana (sábado)

| Hora | Evento |
|---|---|
| **4.0** | Ronda 2: el efectivo se mantiene, se libera el set El Retiro |
| **4.05** | **+150 P para cada equipo** (gastar en SAL-09) |
| 6.5 | Duelos I (solo precio) |
| 13.0 | Duelos II (precio + fechas) |
| 18.0 | Ronda 3 y set Chamberi |
| 20.0 | Duelos III |
| 23.0 | Grand Final |
| 24.0 | Congelación |

**Tick:** sábado 30 s, domingo 15 s. Límites por tick: 1 aceptación, 1 mensaje por hilo, 6 hilos abiertos, 30 ofertas y 12 nuevas.

## Cómo empezar el sábado por la mañana

En una máquina nueva:
```bash
git clone https://github.com/pablo-albaladejo/negotiation-ring.git && cd negotiation-ring
pnpm i --frozen-lockfile
pnpm test            # esperar 314/314
```

Antes de las 09:00 (hora de Madrid), arrancar **todos** (el juego fue pausado):
```bash
pnpm bazaar:duels                                    # duelos
pnpm bazaar:trades --confirm --min-margin 3 --max-spend 40 --max-offers 8   # El Rastro
pnpm bazaar --serious --cash-floor 20 --dry-run --once   # revisar el plan
pnpm bazaar --serious --cash-floor 20                    # dealers, si el plan es correcto
set -a && . ./.env && set +a && VIEWER_RESULTS_DIR="$PWD/results/eval-dummy" pnpm viewer   # http://127.0.0.1:5199/#bazaar
```

Para ver las conversaciones en vivo:
```bash
set -a && . ./.env && set +a && pnpm bazaar:feed   # solo lectura
```

## Cambios hoy (viernes)

Se arreglaron los duelos (leer `from`, no solo `sender`), se añadieron guardarraíles de seguridad (estructura de oferta, locks de activos, precio real), se midieron rasgos de El Chato (paciencia 8, máximo paso 1 P, ancla ~22 para infrecuentes), y se mejoró el planificador:
- Nunca vender la única copia de una carta en una página ≥ 70 % completa.
- Ancla de venta capped a 1,3× precio de lista del dealer.
- Nuevo: regla "opening-last-chance" para negociar hasta el final.

El visor está unificado en la pestaña `#bazaar` con `/api/bazaar/board`.

## Prioridades sábado

1. A hora **4.05**, con los **+150 P**, comprar **SAL-09**. Vender repetidas en El Rastro.
2. Duelos: desde el primer tic que puntúa (Duelos I, hora 6.5). Verificar que aceptaciones y matches atraviesan.
3. **Mercado v04:** decidir si cambiamos a `board` para que el broker capture valor en el Market Test.
4. Modo serio: El Chato solo donde mejora la escalera; todo lo demás a El Rastro.
5. Monitor: reducir uso de disco, verificar ≤ 300 eventos de feed por ciclo.

## Datos medidos (dealers)

- **Abuela:** lista común 10, infrecuente 25, pack 26; cae a precio de lista en 1–3 mensajes; se va si repetimos precio.
- **El Chato:** solo infrecuentes y raras; infrecuente 13→16 P en 3–5 mensajes; rara 39→46 P; vende infrecuentes a 28–32, raras a 82–93.
- **El Rastro:** infrecuentes a 18–21, comisión 5 % + 1 P. Paga más por nuestras repetidas.

## Dónde está todo

- **Planes y trazas:** `results/bazaar-live/2026-10-02/` (decisions.jsonl, thread-*.jsonl, score.jsonl, duels-state.json).
- **Traspaso del día 1:** `handoff/2026-10-02/HANDOFF.md` (sesiones y scratchpad solo en la máquina de Pablo, fuera de git).
- **Código:** `src/bazaar/` (agentes, dealers, duelos, trades, broker).
- **Lecciones:** `docs/bazaar/lessons.json`, actualizado tras cada hilo.
- **Original del Bazaar:** `docs/bazaar/kit/`.

## Problemas abiertos

- Dedupe de eventos del feed (el sniffer ya no está en este árbol; se ejecuta en la vieja Mac).
- Decidir si v04 pasa a `board` (entonces el broker gana).
- Vigilar que El Rastro no cae del límite de 300 req/s.

---

**Próximo paso:** `pnpm test && pnpm docs:check` para verificar que el árbol está limpio. Luego seguir con duelos, traders y el agente serio.

Para contexto completo de la arquitectura, leer [`AGENTS.md`](AGENTS.md) y [`src/bazaar/AGENTS.md`](src/bazaar/AGENTS.md).

## Escaneo de la API (sábado 00:11, partida en pausa, tick 159)

`pnpm bazaar:scan` (con `.env` y `.env.broker` cargados) hace GET a todos los endpoints y guarda las respuestas en `results/bazaar-live/<fecha>/api-scan-HHMM.json`. Primeros escaneos: `results/bazaar-live/2026-10-03/api-scan-0011.json` y `results/bazaar-live/2026-10-02/api-scan-0016.json`. Todos los endpoints dan 200.

- **`/api/cards/{id}`** pide el **id numérico del asset** (p. ej. `/api/cards/438` → SAL-07 con su historial), no la ref: `/api/cards/SAL-09` da 422. Para el valor de una ref usa `/api/me/value?card=SAL-09`.
- **`/api/flags`** solo admite POST (GET da 404). **`/api/broker/book`** pide `X-Broker-Key` (con la de equipo da 401): devuelve `offers`, `bench_offers` y `recent`.
- **`/api/dealers`** devuelve la lista en la clave `personas`.
- **Market Test en la hora 3, antes de la ronda 2:** el mismo libro sintético para todos los venues (10 traders, 16 ticks). Un venue `auto` saca la mitad de los puntos; para los puntos completos hace falta `board` y un broker activo.
- **Hora 4.05:** todos reciben un sobre de El Retiro y 150 P.
- **Afinidad por set:** RET 1,6 · SAL 1,3 · CHA 1,1 · MAL 0,9 · LAT 0,7 · LAV 0,5. El Retiro es el set que más nos vale.
- **Reglas de valor (`/api/catalog`):** la 2.ª copia vale el 25 % y la 3.ª el 10 %; página completa +25 %; todas las versiones de una carta +10 %. Existe un **sobre de oro** (valor esperado 410).
- **SAL-09:** en El Rastro solo hay ofertas de compra (7 y 8 P). Nadie la vende y no hay ninguna rara a la venta.
- **Duelos vivos durante la pausa:** 177 (vendemos, límite 66), 178 (compramos, límite 78), 300 (compramos, límite 116; el rival pide 119).

## Venue v04: no se puede pasar a `board`

- `PATCH /api/venues/v04` solo cambia comisiones. Sin `fee_bps` da 400 ("send fee_bps"). Con `fee_bps` da 200, pero **ignora `rules`**: v04 sigue en `auto`. (Quedó anunciado un cambio de comisión 0 → 0, efectivo en el tick 161, sin efecto.)
- **Solo se puede reabriendo:** cerrar v04 y abrir otro venue con `{"rules": {"mechanism": "board"}}`. Cuesta 250 de fianza (se devuelve) + 20 P. La fianza de v04 vuelve solo tras un periodo de espera, y cada Market Test cuenta solo el venue abierto durante la sesión.
- **Decisión pendiente para el sábado:** con 40 P de caja no llegamos. Para la prueba de la hora 3 nos quedamos en `auto` (mitad segura). Después, con los +150 de la hora 4.05 y las ventas de repetidas, elegir entre comprar **SAL-09** y abrir un venue **`board`** con el broker (`pnpm bazaar:broker --confirm`). Si se abre el nuevo, cerrar v04 después, nunca antes.
