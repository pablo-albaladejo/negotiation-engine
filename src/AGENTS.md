# src/ — Agente del Bazaar (Cromos de Madrid)

Negocia con los dealers del Bazaar (hoy, Abuela Carmen) por su API HTTP: vende repetidas y compra cartas que faltan para completar páginas. Mismas reglas que el resto del repo: **la cifra sale del motor** (`engine/`), el texto es una plantilla con esa misma cifra, y nunca se revela la valoración privada.

## Carpetas

Un concepto por carpeta; cada comando `pnpm` arranca en el main.ts de la suya.

| Carpeta | Qué es | Comando |
|---|---|---|
| [`engine/`](engine/AGENTS.md) | Matemáticas puras, sin API ni E/S: concesión, aceptación, guardarraíles, RNG. Lo usan `dealers/negotiation/negotiator.ts` y `duels/duels.ts` | — |
| [`shared/`](shared/AGENTS.md) | Lo que usan todos: cliente HTTP de la API, esquemas Zod, claves, «un activo en un solo sitio», trazas y la cifra | — |
| [`dealers/`](dealers/AGENTS.md) | Negociar con los dealers (Abuela, El Chato): plan de qué comprar o vender, negociador, plantillas de mensaje, paciencia, topes de gasto, modo continuo `--serious` | `pnpm bazaar` |
| [`duels/`](duels/AGENTS.md) | Duelos 1 contra 1 con otros equipos (bajo alias) | `pnpm bazaar:duels` |
| [`trades/`](trades/AGENTS.md) | Comprar y vender cartas con otros equipos en El Rastro | `pnpm bazaar:trades` |
| [`broker/`](broker/AGENTS.md) | Casar ofertas en nuestro venue (solo sirve con mecanismo `board`; el nuestro es `auto`) | `pnpm bazaar:broker` |
| [`venue/`](venue/AGENTS.md) | Plan para abrir nuestro mercado | `pnpm bazaar:venue` |
| [`status/`](status/AGENTS.md) | Resumen de solo lectura | `pnpm bazaar:status` |
| [`state/`](state/AGENTS.md) | `GameState` por tick (solo GET), la entidad `Conversation`, personas, eggs, regalos y flags | — |
| [`markets/`](markets/AGENTS.md) | Mercados entre venues: hueco neto = hueco − comisión − penalización por rival | (`pnpm bazaar:play`) |
| [`packs/`](packs/AGENTS.md) | Sobres: cerrados nuestros, valor esperado con el suministro, comprar, abrir o vender cerrado | (`pnpm bazaar:play`) |
| [`hints/`](hints/AGENTS.md) | Corpus de pistas: cada línea de dealer, con candidatas por regla determinista | (`pnpm bazaar:play`) |
| [`agenda/`](agenda/AGENTS.md) | Calendario como playbook (antelación y efecto por acción) y disparadores del feed | (`pnpm bazaar:play`) |
| [`flags/`](flags/AGENTS.md) | Detector de flags: texto del dealer frente a la estructura de su oferta, y frases de presión de una lista cerrada en sus contraofertas | (`pnpm bazaar:play`) |
| [`news/`](news/AGENTS.md) | Noticias de Radio Rastro (stream del recorder y `GET /api/news`) con un resumen para el visor. **Solo mostrar**: ninguna ruta la importa y nunca da una cifra | `pnpm bazaar:news` |
| [`coordinator/`](coordinator/AGENTS.md) | Coordinador por tick: presupuesto de `clock.limits`, intenciones de cada ruta, arbitraje | `pnpm bazaar:play` |
| [`audit/`](audit/AGENTS.md) | Monitor de ineficiencias de solo lectura: repetidas compradas, ida y vuelta con pérdida, ventas bajo la mejor puja, última copia de página, dobles actos, fallos repetidos; escribe audit.jsonl y audit-status.json | `pnpm bazaar:audit` |

## Invariantes

- **La cifra sale del código** (`engine/` + planificadores de cada carpeta), nunca de un texto.
- **Toda oferta pasa por `enforceGuardrails`**: no cruza el límite y es monótona.
- **Del rival solo se lee la estructura** (ofertas y precios), nunca su texto. Dos excepciones estrechas, aprobadas: pistas de eggs (se guarda el texto que suena a pista) y, para un flag (`src/flags/flags.ts`): comparar texto con estructura, y frases de presión de una lista cerrada en contraofertas; **nunca para una cifra**. Las frases de presión solo se envían con aprobación (`--approve-flags`).

## Uso

```bash
pnpm bazaar:status                 # solo lectura: equipo, reloj, límites, dealers, hilos
pnpm bazaar:play --dry-run --once  # coordinador: estado, presupuesto, intenciones y arbitraje; ningún POST
pnpm bazaar --dry-run --once       # dealers (flags en dealers/AGENTS.md)
pnpm bazaar:venue --dry-run        # qué mercado abriría al llegar a nivel 2; ningún POST
```

## Links

- ↑ [root `AGENTS.md`](../AGENTS.md)
- → [`engine/`](engine/AGENTS.md) · [`shared/`](shared/AGENTS.md) · [`dealers/`](dealers/AGENTS.md) · [`duels/`](duels/AGENTS.md) · [`trades/`](trades/AGENTS.md) · [`broker/`](broker/AGENTS.md) · [`venue/`](venue/AGENTS.md) · [`status/`](status/AGENTS.md)
- → [`state/`](state/AGENTS.md) · [`markets/`](markets/AGENTS.md) · [`packs/`](packs/AGENTS.md) · [`hints/`](hints/AGENTS.md) · [`agenda/`](agenda/AGENTS.md) · [`flags/`](flags/AGENTS.md) · [`coordinator/`](coordinator/AGENTS.md) · [`news/`](news/AGENTS.md) · [`audit/`](audit/AGENTS.md)
- → [`test/`](../test/AGENTS.md) — solo tests de guardarraíles
