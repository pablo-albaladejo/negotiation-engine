# Diseño: lista explícita de objetivos en `GameState`

*Propuesta para revisar con Pablo. No hay código. 4 oct 2026.*

## Problema

Los objetivos reales del equipo están repartidos:

- `pageTargets` en el estado;
- `goal.why` por conversación (`src/state/conversation.ts:25`);
- los disparadores de la agenda;
- `ACCEPT_PRIORITY` (`src/coordinator/coordinator.ts:22`);
- los `LEVERS` del visor (`viewer/server/bazaar/bazaar-model.ts:237`), que son texto fijo y ya están desfasados: dicen «Duels I h 6.5» y «SAL-09 +50…+77 con bonus»;
- los flags de `bazaar:play` y la memoria del proyecto.

Nadie ve en un solo sitio **qué puntúa, cuánto pesa, cómo vamos y qué ruta lo mueve**.

## Base: qué puntúa (Payday + RULES.md)

| Bloque | Peso (de 100) | Parte | Métrica en `/api/me` | Nota |
|---|---|---|---|---|
| Negotiating | 30 | Duelos | `duel_points` | parte del pastel en cada duelo; sin trato, 0 para los dos; el pastel encoge un 6 % por ronda |
| | | Ladder de dealers | `ladder_points` | los 3 mejores tratos por nivel; más nivel, más peso; una pérdida cuenta entera |
| | | Tratos con equipos | `neg_points` | ganancia con **tope de 50 por trato** (Payday) y por contraparte; una pérdida cuenta entera |
| Market-making | 22,5 | Market Test | `bench_points` (0–1), `bench_efficiency` | 0,5 = puesto auto; 1,0 = media del top 3 |
| | 7,5 | Tratos reales en nuestro venue | `mm_points` | √ del valor creado entre otros dos equipos, con tope por pareja |
| Jueces | 40 | Ideas y oficio | — | fuera de la API: no entra en el estado |
| **Nunca** | 0 | nº de tratos, comisiones, suerte de sobres, regalos, eggs, subvenciones, **caja y cartas que tengas** | — | «a card counts by the deal that brought it» |

Cada día es una ronda (viernes 0,5; sábado y domingo 1). Las partes de `/api/me` son las **de la ronda actual**. `negotiating` y `market` ya salen normalizados al top 3 y ponderados por rondas.

## Tipo

```ts
// src/objectives/objectives.ts (carpeta nueva, con su AGENTS.md)
export type ObjectiveId =
  | "duels" | "dealer-ladder" | "team-trades"     // Negotiating 30
  | "market-test" | "organic"                     // Market-making 30
  | "spend-cash" | "album" | "eggs";              // instrumentales: 0 puntos directos

export interface ObjectiveGuardrail {
  id: string;            // "hidden-never-sold", "only-spares", "dealer-loss-full"…
  text: string;          // en inglés (UI)
  enforcedBy: string;    // fichero que lo hace cumplir: "src/shared/asset-locks.ts"
}

export interface Objective {
  id: ObjectiveId;
  goal: string;                          // una frase: qué queremos
  block: "negotiating" | "market-making" | "none";
  weight: number;                        // puntos de 100 (30 compartido entre las tres partes de negotiating; 22,5; 7,5; 0)
  metric: { field: keyof ScoreFields | "derived"; label: string };
  progress: {
    now: number | null;                  // valor de la ronda, de /api/me
    dayStart: number | null;             // primera foto del día (score-parts)
    prevTick: number | null;
    detail: string[];                    // "L1 3/3 (worst 1.00) · L2 3/3 · L3 2/3 (worst 0.46)"
    status: "open" | "saturated" | "behind" | "blocked" | "no-data";
  };
  owners: Route[];                       // duels | dealers | trades | markets | team-desk | broker | venue | eggs
  guardrails: ObjectiveGuardrail[];
  levers: string[];                      // qué lo mueve hoy (sustituye a LEVERS)
}

// GameState
objectives: Objective[];
```

Los guardarraíles **solo se citan**, nunca se reimplementan: cada uno apunta al fichero que lo hace cumplir. Si un guardarraíl no tiene `enforcedBy`, el visor lo marca en rojo («regla sin código»).

## Catálogo inicial

| id | Objetivo | Progreso (de dónde sale) | Rutas | Guardarraíles |
|---|---|---|---|---|
| `duels` | Cerrar todos los duelos dentro del límite, pronto | `duel_points`; duelos vivos, pendientes y sin respuesta de `env.duels` | duels | nunca fuera del límite; contestar todos (sin respuesta = 0); abrir con una oferta aceptable |
| `dealer-ladder` | Llenar y mejorar los 3 huecos por nivel | `ladder_points`; huecos por nivel y la peor share (`src/dealers/history/ladder.ts`, como `DealersRoute`) | dealers | una pérdida cuenta entera; Abuela y Chato solo por una carta que queramos; Pilar y Pícaros solo si superan el peor hueco y precio ≥ valor; dealer a dealer no gana nada |
| `team-trades` | Ganar valor privado con otros equipos (hasta 50 por trato) | `neg_points`; tratos y contrapartes de la ronda (`score-audit.jsonl`) | trades, markets (escáner, rival-*), team-desk | nunca vender bajo valor; solo repetidas (una 2.ª copia vale ¼ para nosotros); **las cartas ocultas no se venden**; nunca la última carta de una página; ≤ 2 por contraparte y hora; sin alimentar a nadie |
| `market-test` | Igualar o superar al puesto auto en cada sesión | `bench_points`, `bench_efficiency`; sesiones de `bench-sessions.json` | venue, broker | venue abierto en cada sesión (sin venue = 0); sin cambio de mecanismo a < N ticks de un bench; broker vivo si es board |
| `organic` | Que otros dos equipos ganen en nuestro venue | `mm_points`; `trades` de nuestro venue (`markets.venues`) | venue, broker | no podemos operar en nuestro venue; nada de tratos amañados |
| `spend-cash` | Convertir la caja en tratos con valor antes del cierre | caja frente al tiempo que queda de ronda y torneo | todas las de compra | `--cash-floor`; solo compras con valor > precio |
| `album` | Páginas como medio, no como fin | páginas y huecos; `pageTargets` | trades, markets | nunca vender la última carta de una página; comprar la que cierra página si la ganancia > precio |
| `eggs` | Gloria: nunca puntúa | eggs encontrados (`world.eggs`) | eggs, dealers | sonda solo a caballo de una contraoferta; nunca sacrificar una cifra |

`status` sale de reglas fijas:
- `saturated`: el ladder de un nivel está en 3/3 con la peor share ≥ 0,95; o `organic` está en el tope (normalizado ≥ 1).
- `behind`: hay duelos sin contestar a menos de N ticks del final.
- `blocked`: falta caja para lo que exige el objetivo (p. ej. cambiar a board con caja < 290).
- `no-data`: la métrica no está en `/api/me`.

## Dónde se calcula

- **`buildObjectives(state, ctx)`**, pura, en `src/objectives/objectives.ts`. La llama `buildGameState` al final, cuando el resto del estado ya existe, y la rellena en `GameState.objectives`.
- **Entradas:** sin GET nuevos. Usa `ours.score` (`/api/me`), `env.duels`, la escalera (`ladder.ts`), `markets.venues` (tratos alojados), las sesiones de la sombra del broker y `score-parts.jsonl` para `dayStart` y `prevTick`.
- **El catálogo**, es decir objetivo, peso, guardarraíles y `enforcedBy`, es una constante en ese fichero. Cambiarlo es un commit, no un flag.

## Cómo lo enseña el visor

- `/api/bazaar/model` ya construye el `GameState`, así que el campo llega solo. No hace falta un endpoint nuevo.
- **Panel «Objetivos»** en la cabina, encima de «Now». Una fila por objetivo:
  - peso en puntos (barra);
  - métrica: ahora, Δ del día y Δ del tick;
  - chip de estado;
  - chips de las rutas dueñas;
  - guardarraíles plegados, cada uno con su fichero.
- Los instrumentales (peso 0) salen atenuados, con la etiqueta «no puntúa».
- En «Now», cada intención ya lleva un objetivo global (`intentGoals` en `bazaar-now.ts`). Pasaría a llevar el `ObjectiveId`, para poder filtrar por objetivo.
- `goals.levers` desaparece del modelo: lo sustituye `objectives[].levers`, así que hay una sola fuente.

## ¿Debe ordenar las rutas? Todavía no

**Fase 1, la que propongo ahora: solo mostrar.** Motivos:

1. **No conocemos la conversión entre métricas.** Para el ladder está medida (≈ 19 de negotiating por 1,0 de ladder). Para `neg_points` frente a score, no, y además se normaliza al top 3, así que cambia durante el día. Ordenar con pesos inventados sería peor que el `ACCEPT_PRIORITY` actual, que es explícito.
2. **La saturación ya se aplica a mano:** dealers solo abre hilo con ganancia de ladder o por una carta que queremos (`b5dfc5c`), y está la penalización orgánica por rival (`9092fd5`). Primero conviene ver en el visor que `status` coincide con esas reglas.

**Fase 2, cuando `score-parts.jsonl` tenga datos para estimar puntos por unidad de cada parte:**
- cada `Intent` lleva un `objective`;
- `arbitrate` ordena por Δscore esperado = Δmétrica × puntos por unidad de esa métrica, en lugar de por clase fija;
- un objetivo `saturated` deja sus intenciones en `other`, o las bloquea si el guardarraíl lo dice.

`ACCEPT_PRIORITY` se mantendría como desempate.

## Coste y riesgos

- **Coste:** un fichero puro más su AGENTS.md, un campo en `GameState`, un panel en el visor y quitar `LEVERS`. Unas 2–3 horas.
- **Riesgo 1:** que el catálogo se desfase como `LEVERS`. Para evitarlo, `docs:check` puede comprobar que cada `enforcedBy` existe.
- **Riesgo 2:** que el estado se lea como orden en la fase 1. No pasa: ninguna ruta lo lee hasta la fase 2.

## Aparte: dos datos del deck que corrigen el código

- **Tope de 50 por trato entre equipos.** `src/markets/scanner.ts` tiene un `ASSUMPTION` con «cifra desconocida»: ya se conoce, es 50. Es relevante solo si un trato pasa de 50 de ganancia.
- **Market-making = 22,5 Market Test + 7,5 tratos reales.** Confirma el peso de 0,75 que había inferido (site-map § 6.11).
