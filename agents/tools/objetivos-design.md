# Design: explicit list of goals in `GameState`

*Proposal to review with Pablo. No code. 4 Oct 2026.*

## Problem

The team's real goals are scattered:

- `pageTargets` in the state;
- `goal.why` per conversation (`src/state/conversation.ts:25`);
- the agenda triggers;
- `ACCEPT_PRIORITY` (`src/coordinator/coordinator.ts:22`);
- the viewer's `LEVERS` (`viewer/server/bazaar/bazaar-model.ts:237`), which are fixed text and already outdated: they say "Duels I h 6.5" and "SAL-09 +50…+77 with bonus";
- the `bazaar:play` flags and the project memory.

Nobody sees in one place **what scores, how much it weighs, how we are doing and which route moves it**.

## Basis: what scores (Payday + RULES.md)

| Block | Weight (of 100) | Part | Metric in `/api/me` | Note |
|---|---|---|---|---|
| Negotiating | 30 | Duels | `duel_points` | share of the pie in each duel; no deal, 0 for both; the pie shrinks 6 % per round |
| | | Dealer ladder | `ladder_points` | the 3 best deals per level; higher level, more weight; a loss counts in full |
| | | Team deals | `neg_points` | gain with a **cap of 50 per deal** (Payday) and per counterparty; a loss counts in full |
| Market-making | 22.5 | Market Test | `bench_points` (0–1), `bench_efficiency` | 0.5 = auto rank; 1.0 = top-3 average |
| | 7.5 | Real deals in our venue | `mm_points` | √ of the value created between two other teams, capped per pair |
| Judges | 40 | Ideas and craft | — | outside the API: does not enter the state |
| **Never** | 0 | number of deals, commissions, pack luck, gifts, eggs, subsidies, **cash and cards you hold** | — | "a card counts by the deal that brought it" |

Each day is a round (Friday 0.5; Saturday and Sunday 1). The `/api/me` parts are those **of the current round**. `negotiating` and `market` already come normalized to the top 3 and weighted by rounds.

## Type

```ts
// src/objectives/objectives.ts (new folder, with its AGENTS.md)
export type ObjectiveId =
  | "duels" | "dealer-ladder" | "team-trades"     // Negotiating 30
  | "market-test" | "organic"                     // Market-making 30
  | "spend-cash" | "album" | "eggs";              // instrumental: 0 direct points

export interface ObjectiveGuardrail {
  id: string;            // "hidden-never-sold", "only-spares", "dealer-loss-full"…
  text: string;          // in English (UI)
  enforcedBy: string;    // file that enforces it: "src/shared/asset-locks.ts"
}

export interface Objective {
  id: ObjectiveId;
  goal: string;                          // one sentence: what we want
  block: "negotiating" | "market-making" | "none";
  weight: number;                        // points out of 100 (30 shared among the three negotiating parts; 22.5; 7.5; 0)
  metric: { field: keyof ScoreFields | "derived"; label: string };
  progress: {
    now: number | null;                  // value of the round, from /api/me
    dayStart: number | null;             // first snapshot of the day (score-parts)
    prevTick: number | null;
    detail: string[];                    // "L1 3/3 (worst 1.00) · L2 3/3 · L3 2/3 (worst 0.46)"
    status: "open" | "saturated" | "behind" | "blocked" | "no-data";
  };
  owners: Route[];                       // duels | dealers | trades | markets | team-desk | broker | venue | eggs
  guardrails: ObjectiveGuardrail[];
  levers: string[];                      // what moves it today (replaces LEVERS)
}

// GameState
objectives: Objective[];
```

The guardrails are **only cited**, never reimplemented: each one points to the file that enforces it. If a guardrail has no `enforcedBy`, the viewer marks it red ("rule without code").

## Initial catalog

| id | Goal | Progress (where it comes from) | Routes | Guardrails |
|---|---|---|---|---|
| `duels` | Close all duels within the limit, early | `duel_points`; live, pending and unanswered duels from `env.duels` | duels | never outside the limit; answer all (no answer = 0); open with an acceptable offer |
| `dealer-ladder` | Fill and improve the 3 slots per level | `ladder_points`; slots per level and the worst share (`src/dealers/history/ladder.ts`, like `DealersRoute`) | dealers | a loss counts in full; Abuela and Chato only for a card we want; Pilar and Pícaros only if they beat the worst slot and price ≥ value; dealer to dealer earns nothing |
| `team-trades` | Win private value with other teams (up to 50 per deal) | `neg_points`; deals and counterparties of the round (`score-audit.jsonl`) | trades, markets (scanner, rival-*), team-desk | never sell below value; duplicates only (a 2nd copy is worth ¼ to us); **hidden cards are not sold**; never the last card of a page; ≤ 2 per counterparty and hour; feed nobody |
| `market-test` | Match or beat the auto rank in every session | `bench_points`, `bench_efficiency`; sessions from `bench-sessions.json` | venue, broker | venue open in every session (no venue = 0); no mechanism change within < N ticks of a bench; broker live if board |
| `organic` | Get two other teams to win in our venue | `mm_points`; `trades` of our venue (`markets.venues`) | venue, broker | we cannot trade in our venue; no rigged deals |
| `spend-cash` | Convert cash into valuable deals before the close | cash versus the time left in the round and tournament | all buying routes | `--cash-floor`; only purchases with value > price |
| `album` | Pages as a means, not an end | pages and slots; `pageTargets` | trades, markets | never sell the last card of a page; buy the one that closes a page if the gain > price |
| `eggs` | Glory: never scores | eggs found (`world.eggs`) | eggs, dealers | probe only piggybacked on a counteroffer; never sacrifice a figure |

`status` comes from fixed rules:
- `saturated`: the ladder of a level is at 3/3 with the worst share ≥ 0.95; or `organic` is at the cap (normalized ≥ 1).
- `behind`: there are unanswered duels fewer than N ticks from the end.
- `blocked`: not enough cash for what the goal requires (e.g. switching to board with cash < 290).
- `no-data`: the metric is not in `/api/me`.

## Where it is computed

- **`buildObjectives(state, ctx)`**, pure, in `src/objectives/objectives.ts`. `buildGameState` calls it at the end, when the rest of the state already exists, and fills `GameState.objectives` with it.
- **Inputs:** no new GETs. It uses `ours.score` (`/api/me`), `env.duels`, the ladder (`ladder.ts`), `markets.venues` (hosted deals), the broker shadow's sessions and `score-parts.jsonl` for `dayStart` and `prevTick`.
- **The catalog**, i.e. goal, weight, guardrails and `enforcedBy`, is a constant in that file. Changing it is a commit, not a flag.

## How the viewer shows it

- `/api/bazaar/model` already builds the `GameState`, so the field arrives on its own. No new endpoint is needed.
- **"Goals" panel** in the cockpit, above "Now". One row per goal:
  - weight in points (bar);
  - metric: now, day Δ and tick Δ;
  - status chip;
  - chips of the owning routes;
  - collapsed guardrails, each with its file.
- Instrumental goals (weight 0) appear dimmed, with the label "does not score".
- In "Now", each intent already carries a global goal (`intentGoals` in `bazaar-now.ts`). It would carry the `ObjectiveId` instead, so it can be filtered by goal.
- `goals.levers` disappears from the model: `objectives[].levers` replaces it, so there is a single source.

## Should it order the routes? Not yet

**Phase 1, the one I propose now: display only.** Reasons:

1. **We do not know the conversion between metrics.** For the ladder it is measured (≈ 19 of negotiating per 1.0 of ladder). For `neg_points` versus score it is not, and it is also normalized to the top 3, so it changes during the day. Ordering with invented weights would be worse than the current `ACCEPT_PRIORITY`, which is explicit.
2. **Saturation is already applied by hand:** dealers only opens a thread with ladder gain or for a card we want (`b5dfc5c`), and there is the organic per-rival penalty (`9092fd5`). First it is worth seeing in the viewer that `status` matches those rules.

**Phase 2, when `score-parts.jsonl` has data to estimate points per unit of each part:**
- each `Intent` carries an `objective`;
- `arbitrate` orders by expected Δscore = Δmetric × points per unit of that metric, instead of by fixed class;
- a `saturated` goal leaves its intents in `other`, or blocks them if the guardrail says so.

`ACCEPT_PRIORITY` would be kept as a tiebreaker.

## Cost and risks

- **Cost:** one more pure file plus its AGENTS.md, one field in `GameState`, one panel in the viewer and removing `LEVERS`. About 2–3 hours.
- **Risk 1:** the catalog drifting out of date like `LEVERS`. To avoid it, `docs:check` can verify that every `enforcedBy` exists.
- **Risk 2:** the state being read as an order in phase 1. It does not happen: no route reads it until phase 2.

## Aside: two deck facts that correct the code

- **Cap of 50 per deal between teams.** `src/markets/scanner.ts` has an `ASSUMPTION` with "unknown figure": it is now known, it is 50. It matters only if a deal exceeds 50 of gain.
- **Market-making = 22.5 Market Test + 7.5 real deals.** It confirms the 0.75 weight I had inferred (site-map § 6.11).
