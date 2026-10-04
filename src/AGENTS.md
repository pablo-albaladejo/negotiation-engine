# src/ — Bazaar agent (Cromos de Madrid)

Negotiates with the Bazaar's dealers (today, Abuela Carmen) through their HTTP API: sells duplicates and buys missing cards to complete pages. Same rules as the rest of the repo: **the figure comes from the engine** (`engine/`), the text is a template with that same figure, and the private valuation is never revealed.

## Folders

One concept per folder; each `pnpm` command starts at the main.ts of its own.

| Folder | What it is | Command |
|---|---|---|
| [`engine/`](engine/AGENTS.md) | Pure math, no API or I/O: concession, acceptance, guardrails, RNG. Used by `dealers/negotiation/negotiator.ts` and `duels/duels.ts` | — |
| [`shared/`](shared/AGENTS.md) | What everyone uses: the API's HTTP client, Zod schemas, keys, «one asset in one place», traces and the figure | — |
| [`dealers/`](dealers/AGENTS.md) | Negotiating with dealers (Abuela, El Chato): plan of what to buy or sell, negotiator, message templates, patience, spending caps, continuous `--serious` mode | `pnpm bazaar` |
| [`duels/`](duels/AGENTS.md) | 1-on-1 duels with other teams (under alias) | `pnpm bazaar:duels` |
| [`trades/`](trades/AGENTS.md) | Buying and selling cards with other teams in El Rastro | `pnpm bazaar:trades` |
| [`broker/`](broker/AGENTS.md) | Matching offers in our venue (only works with `board` mechanism; ours is `auto`) | `pnpm bazaar:broker` |
| [`venue/`](venue/AGENTS.md) | Plan to open our market | `pnpm bazaar:venue` |
| [`status/`](status/AGENTS.md) | Read-only summary | `pnpm bazaar:status` |
| [`state/`](state/AGENTS.md) | `GameState` per tick (GET only), the `Conversation` entity, personas, eggs, gifts and flags | — |
| [`teamdesk/`](teamdesk/AGENTS.md) | Counteroffers to the offers other teams make us | (`pnpm bazaar:play --team-desk`) |
| [`intros/`](intros/AGENTS.md) | Per-thread introductions: pairs of duplicate and missing card, sent to our venue | `pnpm bazaar:intros` |
| [`markets/`](markets/AGENTS.md) | Markets between venues: net gap = gap − commission − per-rival penalty | (`pnpm bazaar:play`) |
| [`packs/`](packs/AGENTS.md) | Packs: our sealed ones, expected value with supply, buy, open or sell sealed | (`pnpm bazaar:play`) |
| [`workshop/`](workshop/AGENTS.md) | El Taller: three duplicates of one rarity for a random card of the next (unscored); state in `GameState.workshop`, strategy and route | (`pnpm bazaar:play --workshop`) |
| [`hints/`](hints/AGENTS.md) | Hint corpus: every dealer line, with candidates by deterministic rule | (`pnpm bazaar:play`) |
| [`agenda/`](agenda/AGENTS.md) | Calendar as playbook (lead time and effect per action) and feed triggers | (`pnpm bazaar:play`) |
| [`flags/`](flags/AGENTS.md) | Flag detector: dealer text versus the structure of her offer, and pressure phrases from a closed list in our counteroffers | (`pnpm bazaar:play`) |
| [`forex/`](forex/AGENTS.md) | Forex chains A → B → C (buy cheap, hold, sell dear) between dealers and venues, in `GameState.forex` and in the viewer; dealer-to-dealer ones are executed by the dealers agent | (`pnpm bazaar:play`) |
| [`news/`](news/AGENTS.md) | Radio Rastro news (recorder stream and `GET /api/news`) with a summary for the viewer and, as a hint, `GameState.news` (`readNewsSignals`). No route imports it and it never gives a figure | `pnpm bazaar:news` |
| [`coordinator/`](coordinator/AGENTS.md) | Per-tick coordinator: `clock.limits` budget, intents of each route, arbitration | `pnpm bazaar:play` |
| [`goals/`](goals/AGENTS.md) | Team goals (what scores, weight, status) and strategy registry per session, in `results/state/`; read-only | `pnpm bazaar:goals` |
| [`audit/`](audit/AGENTS.md) | Read-only inefficiency monitor: duplicates bought, round trips at a loss, sales under the best bid, last page copy, double acts, repeated failures; writes audit.jsonl and audit-status.json | `pnpm bazaar:audit` |

## Invariants

- **The figure comes from the code** (`engine/` + the planners of each folder), never from a text.
- **Every offer goes through `enforceGuardrails`**: it does not cross the limit and is monotonic.
- **From the rival only structure is read** (offers and prices), never their text. Two narrow, approved exceptions: egg hints (the text that sounds like a hint is stored) and, for a flag (`src/flags/flags.ts`): comparing text with structure, and pressure phrases from a closed list in counteroffers; **never for a figure**. Pressure phrases are only sent with approval (`--approve-flags`).

## Usage

```bash
pnpm bazaar:status                 # read-only: team, clock, limits, dealers, threads
pnpm bazaar:play --dry-run --once  # coordinator: state, budget, intents and arbitration; no POST
pnpm bazaar --dry-run --once       # dealers (flags in dealers/AGENTS.md)
pnpm bazaar:venue --dry-run        # which market it would open on reaching level 2; no POST
```

## Links

- ↑ [root `AGENTS.md`](../AGENTS.md)
- → [`engine/`](engine/AGENTS.md) · [`shared/`](shared/AGENTS.md) · [`dealers/`](dealers/AGENTS.md) · [`duels/`](duels/AGENTS.md) · [`trades/`](trades/AGENTS.md) · [`broker/`](broker/AGENTS.md) · [`venue/`](venue/AGENTS.md) · [`status/`](status/AGENTS.md)
- → [`state/`](state/AGENTS.md) · [`markets/`](markets/AGENTS.md) · [`packs/`](packs/AGENTS.md) · [`workshop/`](workshop/AGENTS.md) · [`hints/`](hints/AGENTS.md) · [`agenda/`](agenda/AGENTS.md) · [`flags/`](flags/AGENTS.md) · [`teamdesk/`](teamdesk/AGENTS.md) · [`intros/`](intros/AGENTS.md) · [`coordinator/`](coordinator/AGENTS.md) · [`news/`](news/AGENTS.md) · [`forex/`](forex/AGENTS.md) · [`audit/`](audit/AGENTS.md) · [`goals/`](goals/AGENTS.md)
- → [`test/`](../test/AGENTS.md) — guardrail tests only
