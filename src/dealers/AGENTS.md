# src/dealers/ — Dealers

Negociar con los dealers (Abuela, El Chato) por su API: plan de qué comprar o vender, negociador, plantillas de mensaje, paciencia, topes de gasto y modo continuo `--serious`. Entrada: `main.ts` (`pnpm bazaar`).

## Archivos

- **`agent.ts`** — `BazaarAgent.step`: un paso por tick (un hilo por dealer, un mensaje por hilo y tick, una aceptación por tick). Gestiona persona_quota (hasta la hora siguiente), cooloff (until_tick), sold_out y walked (objetivo fuera durante una hora). Topes de la ejecución (`maxDeals`, `maxThreads`, `maxSpendTotal`): `done` para el bucle al llegar a los tratos o agotar las conversaciones; `plan` imprime el plan del dry-run. Con `team` (`TeamBudget`) comparte gasto, suelo de caja (`--cash-floor`) y la aceptación por tick con los demás dealers; `dealsPerHour` (cuota del menú, por hora de juego) bloquea con `dealer-quota`. En compras por rareza+set, `revealedCards` lee la carta que ella ofrece (`give.types` = "card:SAL-05") y el límite pasa a nuestro valor de esa carta (una repetida baja el límite y se cierra). **welcome_first_deal**: en la primera conversación del equipo con un dealer (no Abuela ni El Chato, `WELCOME_FIRST_DEAL_PAST`; ni otro hilo nuestro con él en `/api/me/threads`) la vista lleva *welcomeFirstDeal* y el negociador manda una contraoferta 1 P mejor (`welcome-counter`) y luego acepta su precio si crea valor (`welcome-first-deal`), así el trato cuenta como negociado; la traza apunta *measuredLimit* y, si aceptamos sin haber ofertado, *tookOpening* (took_opening: no cuenta como negociado para el share) y la lección *measured_limit* (su límite para ese dealer y esa banda). Cada conversación terminada da un `ThreadSummary` (en la traza, impreso y a `onThreadSummary`).
- **Persecución de desbloqueo** (`unlockChase`, `agent.ts`) — si el coordinador dice que un trato con este dealer desbloquearía pronto a una persona (p. ej. Doña Pilar vía El Chato) y ningún objetivo tiene margen, el agente abre el trato menos dañino de `chaseCandidates` (`planning/plan.ts`) con tolerancia `UNLOCK_CHASE_TOLERANCE` = 2 P: comprar pagando como mucho valor + 2 o vender una repetida por al menos valor − 2. La línea `unlock-chase pilar via chato: …` sale en el log y la intención lleva la regla `unlock-chase` (luego `unlock-chase/<regla>`). Un hilo a la vez (el agente ya solo tiene uno); si ella aparece en `me.unlocked`, la tolerancia se retira y el hilo vuelve a exigir valor positivo. Guardarraíles, menu guard, locks y suelo de caja sin cambios.
- **`probe` / `onProbe`** (`agent.ts`) — el coordinador puede dar una frase X de egg para la próxima contraoferta del hilo (va en el mismo mensaje, con la cifra decidida); tras enviarla en vivo se apunta en `eggsTried`.
- **`DealerIntent` / `gate`** (`agent.ts`) — con `gate`, cada POST del agente (abrir, aceptar, contraoferta, aguante, cierre) pasa antes por el coordinador; si devuelve false no se envía nada ni cambia el estado del hilo. Sin `gate`, el agente actúa solo, como siempre.
- **`team.ts`** — `TeamBudget`: gasto por hora y total en compras, suelo de caja (270 P del mercado + reserva) y una aceptación por tick para todo el equipo.
- **`dealer-profile.ts`** — `negotiatorForDealer` desde los rasgos públicos: paciencia ⌊1 + 6 × patience⌉ mensajes (Abuela 6, El Chato 3) solo hasta el nivel 2 (`PATIENCE_FROM_TRAIT_MAX_LEVEL`); en los niveles 3–5 el rasgo es solo prompt (la retirada la decide walk_after_rounds ± jitter), así que `patienceBudgetFor` la deja desconocida, el negociador usa la de por defecto y se mide con `PatienceLog`; dealer impaciente o estricto: ancla moderada (0,85 / 1,5× / 1,15×) y un solo aguante. Per-dealer overrides en `DEALER_OVERRIDES` (ej. El Chato: paciencia 8, máximo paso 1 P, sin aguantes, ancla de venta ~22 para infrecuentes). `dealsPerHourOf` (cuota del menú), `unlockedDealerIds` (`me.unlocked`), `gameHours` (t_hours del reloj).
- **`serious.ts`** / **`serious-run.ts`** — modo continuo: `clockGate` (pausa o `doors` cerradas: esperar hasta next_opens), `classifyError` (pasajeros con `Backoff` 2 s → 60 s; gestionados por el agente; desconocidos paran), `statusLine` (una línea por tick) y `runSerious` (un `BazaarAgent` por dealer desbloqueado con `requireMenu`: sin ficha no abre nada; dealers y menús releídos cada 10 ticks; **menu guard**: `menuBlocks` de `planning/plan.ts` solo vende lo que su `menu.buys` compra y solo compra lo que su `menu.sells` vende; cada compra cuenta en el presupuesto con su precio real (al aceptar, oferta aceptada, caída de caja o, si no, el límite); respeta max_open_threads_per_team del reloj; lecciones solo en vivo).
- **`main.ts`** — CLI de `pnpm bazaar`.

## Subcarpetas

- [`negotiation/`](negotiation/AGENTS.md) — la cifra de cada mensaje: negociador, paciencia, plantillas, forma de la oferta y lectura del hilo.
- [`planning/`](planning/AGENTS.md) — qué comprar o vender a cada dealer.
- [`history/`](history/AGENTS.md) — resumen por conversación y lecciones en `docs/bazaar/lessons.json`.

## Uso

```bash
pnpm bazaar --dry-run --once --max-deals 2 --max-spend 50 --max-threads 2   # plan legible; ningún POST
pnpm bazaar --max-deals 2 --max-spend 50 --max-threads 2                     # en vivo (con aprobación), para tras 2 tratos
pnpm bazaar --dry-run --once --only "buy:uncommon:SAL,buy:common:SAL" --safety 1.0 --max-deals 2 --max-spend 40 --max-threads 2   # solo esas compras, límite = valor
pnpm bazaar --serious --dry-run --once   # modo serio, solo lectura: planes de cada dealer desbloqueado y una línea de estado
pnpm bazaar --serious                    # modo serio en vivo (con aprobación): continuo, todos los tratos que crean valor
```

Flags: `--dry-run`, `--once`, `--max-spend` (P en compras, tope de la ejecución y de cada hora; 120 por defecto), `--max-deals` y `--max-threads` (sin tope por defecto), `--dealer` (abuela por defecto), `--only` (objetivos y orden), `--safety` (fracción del valor como límite; 0,9 por defecto, 1,0 = límite igual al valor), `--buy-anchor-frac` (0,75), `--sell-anchor-mult` (2,0), `--sell-floor-anchor-mult` (1,3), `--patience-budget` (6), `--max-step` (3), `--step-mode` (adaptive | boulware), `--max-holds` (1), `--first-step-frac` (0: apagado). Modo serio: `--serious` (todos los dealers desbloqueados, sin `--only`, safety 1,0, `--max-spend-hour` 60 y `--max-spend` 150 por defecto), caja mínima 270 + `--cash-reserve` (10) por defecto; con `--cash-floor N` el suelo es N (más `--cash-reserve` solo si se pasa), y la línea de estado avisa si el suelo supera la caja, `--lessons` (docs/bazaar/lessons.json).

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`negotiation/`](negotiation/AGENTS.md) · [`planning/`](planning/AGENTS.md) · [`history/`](history/AGENTS.md)
