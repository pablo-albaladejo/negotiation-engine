# negotiation-ring — Context for Code Agents

Team 2's agent for **El Bazaar** (Causa Prima hackathon): a Madrid trading-card tournament in which we negotiate with dealers, with other teams in El Rastro and in 1-vs-1 duels. **The code decides the figure**; the text is a template carrying that same figure.

**Quick entry:** [`DAY1.md`](DAY1.md) — status, how to play, schedule, commands and measured data. Starting the day: [`DAY2.md`](DAY2.md) (`pnpm bazaar:doctor`, `pnpm bazaar:up`). Day 1 context: [`handoff/2026-10-02/HANDOFF.md`](handoff/2026-10-02/HANDOFF.md).

## Non-negotiable rules

- **The figure always comes from the code** (`src/engine/` + the planners in `src/dealers/`, `src/duels/`…). Messages are templates whose only figure is the decided one (`textMatchesPrice`, `textMatchesOffer`).
- **From the rival we read only the structure** (offers and prices), never their text. Three narrow, approved exceptions: egg hints (the text that sounds like a hint is stored); the news (`/api/news`, news.posted), read as a hint (which dealer, set or card is being talked about) in `GameState.news`, never for a figure, and they may be rumour; and, for a flag (`src/flags/flags.ts`): comparing text against structure, and pressure phrases from a closed list in counteroffers; **never for a figure**. Pressure phrases are only sent with approval (`--approve-flags`).
- **The private valuation is never revealed**, nor the limit (`your_limit`).
- **Hidden cards are NOT sold** (Pablo's decision, 3 Oct): not to dealers (the bank included), not in El Rastro, not to other teams, not in the venue, whatever their `your_value`. Origin case: LAT-13 «La Chulapa Dorada», the prize of the bank's egg.
- **Every offer goes through `enforceGuardrails`**: it does not cross the limit and is monotonic.
- **Guardrails before accepting**: offer shape (`checkStructure`) and one asset in one place only (`src/shared/asset-locks.ts`).
- **Nothing live without approval**: real POSTs require removing `--dry-run` and, where applicable, `--confirm`.

## Language

- **Everything in the repo is in English: code, identifiers, comments, development strings (logs, CLI, errors, UI) and documentation (`*.md`).**
- Only game text (templates, probe phrases, regex over dealer text) keeps its language, because it is data.
- `pnpm docs:check` checks it (`scripts/check-english.mjs`): it fails if a code comment is in Spanish. To keep game text, put `game text` in a comment on that line or the previous one.

## Architecture

```
src/
├─ engine/    pure maths: concession, acceptance, guardrails, RNG
├─ shared/    API client, schemas, keys, traces, the figure
├─ dealers/   negotiating with Abuela and El Chato     (pnpm bazaar)
│   ├─ negotiation/  the figure of each message and the offer shape
│   ├─ planning/     what to buy or sell to each dealer
│   └─ history/      per-conversation summary and lessons
├─ duels/     1-vs-1 duels                       (pnpm bazaar:duels)
├─ trades/    El Rastro with other teams         (pnpm bazaar:trades)
├─ broker/    matching offers in our venue       (pnpm bazaar:broker)
├─ venue/     opening our market                 (pnpm bazaar:venue)
├─ status/    read-only summary                  (pnpm bazaar:status)
├─ state/     per-tick GameState, Conversation, personas, eggs and flags (GET only)
├─ flags/     bad-faith detector: dealer text against the structure of their offer
├─ packs/     packs: state, buy, open or sell sealed (route of pnpm bazaar:play)
├─ workshop/  El Taller: 3 duplicates → 1 card of the next rarity (route of pnpm bazaar:play, live with --workshop)
├─ markets/   markets between El Rastro and other venues: net gap = gap − commission − per-rival penalty (route of pnpm bazaar:play)
├─ hints/     corpus of dealer lines (egg hints; never a figure)
├─ agenda/    calendar as playbook and feed triggers (used by pnpm bazaar:play)
├─ forex/     A → B → C chains between dealers and venues: buy cheap, hold, sell high (GameState.forex and viewer)
├─ news/      Radio Rastro news: viewer and hint in GameState.news (never a figure; pnpm bazaar:news)
├─ teamdesk/  counteroffers to the offers other teams make us (pnpm bazaar:play --team-desk)
├─ intros/    per-thread introductions to our venue (pnpm bazaar:intros)
├─ goals/     team goals and strategy registry (pnpm bazaar:goals, read-only)
├─ audit/     read-only inefficiency auditor (pnpm bazaar:audit)
└─ coordinator/ per-tick coordinator: limits, intents, arbitrage (pnpm bazaar:play)
test/        guardrail tests only (fast-check)
scripts/     API scan and docs check
docs/        dealer lessons and the official Bazaar kit
viewer/         local Bazaar viewer (independent package; server/bazaar/ = /api/bazaar/*)
design-system/  React components of the viewer (by alias, no build; components/ and examples/ by family)
handoff/     handoffs between days (in git only HANDOFF.md and AGENTS.md)
agents/      one agent per Claude Code session: card, startup prompt and relaunch order
results/     live traces (outside git)
```

## `pnpm` scripts

| Command | Description |
|---------|-------------|
| `pnpm test` | Guardrail tests (limit, figure = text, one asset in one place, caps). Must pass before every commit. |
| `pnpm typecheck` | TypeScript. |
| `pnpm docs:check` | Links and identifiers of the AGENTS.md files, the folder tree (≤ 10 files and one linked AGENTS.md per folder) and that code comments are in English. |
| `pnpm bazaar` | Dealer agent (`--serious`, `--dry-run`, `--once`, `--max-spend`, `--cash-floor`…). |
| `pnpm bazaar:duels` | 1-vs-1 duels. |
| `pnpm bazaar:trades` | Offers between teams in El Rastro (live with `--confirm`). |
| `pnpm bazaar:broker` | Broker of our venue (live with `--confirm`). |
| `pnpm bazaar:venue` | Plan for our market (opening requires `--confirm`; `--replace --mechanism board\|auto` changes the venue: closes ours and opens another, with cash ≥ 290 and away from a bench). |
| `pnpm bazaar:play` | Per-tick coordinator: `GameState`, `clock.limits` budget, intents for duels, dealers and El Rastro, arbitrage (`--dry-run --once`; live without `--dry-run` and with `--confirm`; sales targeted at rivals only with `--rival-page`, targeted bids with `--rival-buy`; epic routes (targeted SAL-11, one bid at value − 49 = 185; RET-11 open bid at 240; cash floor 100) with `--rival-buy-epic`; card-for-card swaps of our duplicates with `--rival-swap`; El Taller (3 duplicates → 1 card of the next rarity, unscored) only with `--workshop`; dispersion scanner of the markets route only with `--scanner` (opt-in) and `--scanner-spend-per-hour` (60) as the purchase cap; `--duels-fast` moves the duels to their own one-step-per-tick loop; `--page-targets` (SAL-09) is the only page target and is capped at its base without bonus until `--page-bonus-scored`, which raises it to 0.9 × `your_value`; every Δ of `neg_points` is audited deal by deal in `score-audit.jsonl`; no passive bids in El Rastro or listings < 4 P (bids, with `--rastro-bids`); venue-change reserve: with cash < 290 P only purchases that close a page, until our venue is a board, `--no-venue-reserve` removes it). |
| `pnpm bazaar:audit` | Read-only inefficiency auditor: repeated purchases, round trips at a loss, lost album copy, two routes at once, repeated failures; `--date` report, `--watch` live. |
| `pnpm bazaar:intros` | Per-thread introductions for the market's organic flow: for each pair of duplicate and missing card (`matchPairs`) it tells the holder of the duplicate and the one looking for it to post in our venue, where the broker matches them. No figures; max 3 pairs/h and one per team every 2 h (`--dry-run --once`; live with `--confirm`). |
| `pnpm bazaar:goals` | Team goals and strategy registry: refreshes `results/state/goals.json` every tick (now, Δ of the day and of the tick, status) and the gaps in strategies.json; GET only (`--once`). |
| `pnpm bazaar:news` | Bazaar news (Radio Rastro, Boletín, El Tablón): `news.jsonl` and news-summary.json for the viewer's «Radio Rastro» panel. Display only: never a figure or a decision (`--once`, `--no-llm`). |
| `pnpm bazaar:doctor` | Checks that everything is ready (✓/✗): `.env`, Node, git, tests, API, viewer port and `bazaar:play --dry-run --once` (`--fast`). |
| `pnpm bazaar:up` | Doctor and recorder, viewer, `bazaar:play`, shadow broker, news and audit (`--no-audit` removes it), in dry-run (live: `--live --confirm`; `--broker-live` only with them: broker with `--confirm` instead of `--shadow`); `pnpm bazaar:down` for what `--detach` started. See [`DAY2.md`](DAY2.md). |
| `pnpm bazaar:status` | Read-only summary: team, clock, dealers and threads. |
| `pnpm bazaar:scan` | GET to every endpoint, saves the responses. |
| `pnpm bazaar:feed` | New messages from our threads, live (read-only). |
| `pnpm bazaar:record` | Records the live stream (`/api/events/stream`, team and public) into `results/` to reconstruct the day. |
| `pnpm bazaar:dump` | Dump of the state and the day (cards, threads, duels, feed) into `results/` (read-only). |
| `pnpm viewer` | Viewer at http://127.0.0.1:5199/#bazaar |
| `pnpm viewer:typecheck` · `pnpm viewer:test` | TypeScript and viewer tests (before committing if `viewer/` is touched). |
| `pnpm test:watch` | Guardrail tests in watch mode. |
| `pnpm ds:test` | Design-system safety test (no injected HTML). |

Detail of each piece: [`src/AGENTS.md`](src/AGENTS.md).

## Environment variables

```bash
BAZAAR_URL=https://bazaar.causaprima.ai   # API base
BAZAAR_KEY=                               # team key (X-Team-Key), only in .env
# BAZAAR_BROKER_KEY goes in .env.broker (X-Broker-Key)
```

## Folder structure

- **At most 10 versioned files per folder**; if there are more, subfolders are created by concept.
- **Each folder has a short English AGENTS.md** (what lives there, entry points, own rules; without repeating the parent) that links to the parent's AGENTS.md and to that of each subfolder.
- Exempt: the root does not count towards the cap (the tools' configuration has to live there); `results/` (live traces), `design-system/.design-sync/` (generated), `docs/bazaar/bundles/assets/` (literal copy of the frontend) and `docs/bazaar/bundles/pretty/assets/` (its readable version) are outside the cap and have no per-subfolder AGENTS.md.
- `pnpm docs:check` checks it (`scripts/check-agents-tree.mjs`).

## Links to subfolders

- [`src/`](src/AGENTS.md) — Bazaar agent, one folder per concept
- [`src/engine/`](src/engine/AGENTS.md) — numeric core (the rest of `src/*` is linked from `src/`)
- [`test/`](test/AGENTS.md) — tests
- [`scripts/`](scripts/AGENTS.md) — utilities
- [`docs/`](docs/AGENTS.md) — lessons and kit
- [`viewer/`](viewer/AGENTS.md) — viewer
- [`design-system/`](design-system/AGENTS.md) — React components of the viewer
- [`handoff/`](handoff/AGENTS.md) — handoffs between days
- [`agents/`](agents/AGENTS.md) — one agent per Claude Code session: card and prompt to relaunch each one

---

*Causa Prima hackathon, Team 2 (Pablo, Paula, Gerard).*
