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
pnpm test            # esperar 1209/1209
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
node handoff/2026-10-02/scratchpad/convo-feed.mjs   # (después de cargar .env)
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
- **Cartera del día 1:** `handoff/2026-10-02/` (estado, notas, transcripts de sesiones).
- **Código:** `src/bazaar/` (agentes, dealers, duelos, trades, broker).
- **Lecciones:** `docs/bazaar/lessons.json`, actualizado tras cada hilo.
- **Original del Bazaar:** `handoff/2026-10-02/docs/bazaar/kit/`.

## Problemas abiertos

- Dedupe de eventos del feed (el sniffer ya no está en este árbol; se ejecuta en la vieja Mac).
- Decidir si v04 pasa a `board` (entonces el broker gana).
- Vigilar que El Rastro no cae del límite de 300 req/s.

---

**Próximo paso:** `pnpm test && pnpm docs:check` para verificar que el árbol está limpio. Luego seguir con duelos, traders y el agente serio.

Para contexto completo de la arquitectura, leer [`AGENTS.md`](AGENTS.md) y [`src/bazaar/AGENTS.md`](src/bazaar/AGENTS.md).
