# src/bazaar/ — Agente del Bazaar (Cromos de Madrid)

Negocia con los dealers del Bazaar (hoy, Abuela Carmen) por su API HTTP: vende repetidas y compra cartas que faltan para completar páginas. Mismas reglas que el resto del repo: **la cifra sale del motor**, el texto es una plantilla con esa misma cifra, y nunca se revela la valoración privada.

## Archivos

- **`env.ts`** — `loadBazaarEnv`: `BAZAAR_URL` y `BAZAAR_KEY` del entorno o de `.env` (process.loadEnvFile). La clave nunca se imprime.
- **`client.ts`** — `BazaarClient`: cabecera X-Team-Key, `TokenBucket` (4 req/s, ráfaga 2; el servidor admite 5), reintento de rate_limited, wait_for_tick (duerme next_tick_in si waitOnTick; el bucle lo deja en falso y salta al siguiente tick), un POST nunca se repite tras fallo de red. Errores tipados `BazaarError` con `code`, `status` y `extra`.
- **`schemas.ts`** — Zod tolerante (campos extra permitidos). `/api/dealers` responde personas: `DealersSchema` acepta ambos nombres.
- **`negotiator.ts`** — `decide`: puro y determinista. Ancla lejos de su precio (`sellAnchorMult` = 2,0× su primera puja al vender; `buyAnchorFrac` = 0,45× su primer precio al comprar), Boulware (`concession` del motor) hacia la reserva efectiva, pasos pequeños y recíprocos, monotonía y mandato con `enforceGuardrails`, AC_next para aceptar. Nunca acepta su precio de apertura (no cuenta en la escalera), ni repite precio; una oferta `final` solo si cumple la reserva; si no, cierra. Si nuestra siguiente contraoferta cruzaría la reserva y ella no ha dado su `final`, en vez de cerrar aguanta el mismo precio (`hold`, mensaje educado sin cifra nueva) hasta `maxHolds` tics (3 por defecto) para que diga su última palabra; agotados los aguantes, cierra (`holds-exhausted`). Los tres parámetros (`buyAnchorFrac`, `sellAnchorMult`, `maxHolds`) son configurables vía `AgentOptions.negotiator` y los flags de `pnpm bazaar`.
- **`view.ts`** — `threadPrices`: lee del hilo solo campos estructurados (precios de mensajes y ofertas vigentes), nunca su texto.
- **`messages.ts`** — plantillas amables en inglés, rotadas por ronda; `textMatchesPrice` exige que la única cifra del texto sea el precio.
- **`planner.ts`** — objetivos: `spareTargets` (repetidas, reserva = su your_value) y `buyTargets` (cartas de página que faltan, reserva = your_value × 0,85, recortada por presupuesto de la hora y caja).
- **`agent.ts`** — `BazaarAgent.step`: un paso por tick (un hilo por dealer, un mensaje por hilo y tick, una aceptación por tick). Gestiona persona_quota (hasta la hora siguiente), cooloff (until_tick), sold_out y walked (objetivo fuera durante una hora).
- **`trace.ts`** — `FileTrace`: JSONL en `results/bazaar-live/<fecha>/decisions.jsonl` y `thread-<id>.jsonl` (tick, precios, reserva usada, acción, regla, resultado).
- **`score.ts`** — la cifra que maximizamos: `ScoreTracker.record` lee de `/api/me` solo los campos públicos de la cifra (lista cerrada; los campos privados de rareza/suerte del servidor nunca se leen) y escribe un snapshot por tick en `results/bazaar-live/<fecha>/score.jsonl` (`FileScoreTrace`), con `delta` por campo y `cause` (hilo, dealer, acción, precio) desde la traza del propio tick. `formatScoreSummary`/`formatScoreBreakdown` dan la línea de la CLI y el desglose de `bazaar:status`.
- **`main.ts`** / **`status-main.ts`** — CLI.
- **[`sim/`](sim/AGENTS.md)** — Abuela simulada desde su ficha real y arnés `pnpm bazaar:sim` (offline, sin POST).

## Uso

```bash
pnpm bazaar:status                 # solo lectura: equipo, reloj, límites, dealers, hilos
pnpm bazaar --dry-run --once       # observa y registra lo que haría; ningún POST
pnpm bazaar --max-spend 120        # en vivo, un paso por tick hasta Ctrl-C
```

Flags: `--dry-run`, `--once`, `--max-spend` (P por hora en compras, 120 por defecto), `--dealer` (abuela por defecto), `--buy-anchor-frac` (0,45 por defecto), `--sell-anchor-mult` (2,0 por defecto), `--max-holds` (3 por defecto).

## Links

- ↑ [`src/`](../AGENTS.md)
- ↓ [`sim/`](sim/AGENTS.md) — simulador de dealers y arnés
- → [`engine/`](../engine/AGENTS.md) — `concession` y `enforceGuardrails`
- → [`test/bazaar/`](../../test/bazaar/) — tests de cliente, negociador, planificador y bucle
