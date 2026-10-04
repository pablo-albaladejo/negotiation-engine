# src/dealers/history/ — Conversation memory

What happened in each conversation with a dealer and what we learned. It only writes traces and `docs/bazaar/lessons.json`; it never decides a figure.

## Files

- **`ladder.ts`** — dealer ladder (RULES.md:118): per level, the day's three best *shares* among negotiated deals (share = fraction of her opening → limit range captured; limit = her final or the persona model band's). `ladderLevels` reads `docs/bazaar/lessons.json`, `ladderGain` gives what one more deal would add (empty slot or beating the worst of the top 3; ≈ 0.011 × level per slot at share 1, measured with Pilar: thread 901 +0.033, thread 894 +0.014) and the coordinator adds it to the EV of opening (`LADDER_P_PER_POINT` 300, adjustable assumption); `formatLadder` gives the `ladder:` line of `bazaar:play`.
- **`team-received.ts`** — `updateTeamReceived(dir, team, events)`: ids of the cards another team gave us today (settlements from the feed and, the first time, from the recorder's stream-public.jsonl; stored in team-received.json). The dealers planner never offers them to a dealer (coordinator decision, 3 Oct: MAL-10 bought from t13 gave +50.2 and selling it to a dealer scores 0).
- **`thread-log.ts`** — `ThreadSummary` per conversation: cards, received, copies before/after, deals with that dealer in the last hour, tick/ts, her list, opening and final, our prices and hers, patience, result (no_progress counts as walked), value created at our value and, with `welcome-first-deal`, the measured limit (*measuredLimit*); `formatThreadSummary` prints the SUMMARY line.
- **`lessons.ts`** — `appendLesson` adds one entry per conversation to `docs/bazaar/lessons.json` (schema bazaar-lessons/v1) without rewriting the existing ones (insertion in the text, validated with JSON.parse, atomic rename); `deriveLessons` (limit measured in the first conversation (*measured_limit*), did not move, below her list, duplicate received, final after N messages, negative value...); `PendingLessons` waits for neg_points to move (or 5 ticks) to record neg_points_delta and ladder_points_after.
- **`persona-fit.ts`** — fit of the dealer's curve per PERSONA (personas.md § 3.3): `fitPersona` estimates `opening_markup`, β, `max_rounds` and `walk_after_rounds` shared by all her conversations and bands (least squares with the ceil/floor rounding of what she says, editor priors and, for Abuela and El Chato, those measured offline with the public feed (`PERSONA_PRIORS`, [dealer-fit-2026-10-03](../../../docs/bazaar/dealer-fit-2026-10-03.md)): markup, β, max_rounds, walk, Chato's mirror, separate buy markup; Abuela's mirror always «unknown» (not identifiable) (opening_markup_buy) and limit per band; they weigh `priorWeight` pseudo-observations and the live fit starts from there and moves with each data point), the mirror (`personaMirror`; with a mirror, steps clipped by our step do not enter β) and only the limit per band and conversation (± limit_jitter): her final IS her limit for that conversation; when she buys, ceiling = opening ÷ (1 − markup). Per band (`sells:<rarity>` she sells, `buys:<rarity>` she buys): limit mean/lo/hi, samples, the most favorable and *fewSamples* (< 3: open more conversations, low priority). `updatePosterior` adds the tick's conversations and refits; the posterior (observations and estimates with their history) persists in `results/bazaar-live/persona-posterior.json` (`loadPosterior`, `savePosterior`; GET only, also saved in dry-run) so a new conversation starts from what was learned. `offerCap`: never offer beyond her expected limit plus a margin (2 % of book, minimum 1 P); it only narrows the offer's reserve, acceptance still uses the private reserve. It writes into `Persona.model` ([`src/state/persona-model.ts`](../../state/AGENTS.md)). Private: never in a message.

**`welcome: true` label** on an observation of results/bazaar-live/persona-posterior.json: the team's first conversation with that persona (*welcome_first_deal*: her opening is her limit and stays flat; e.g. thread 56 with Abuela, 13 flat for 7 rounds). `updatePosterior` (every tick) marks as welcome the lowest-id one of each persona only if that persona's prior has welcome (Abuela) or its price stayed flat from the opening to the end (≥ 3 rounds without moving); otherwise it counts for the curve (Chato, thread 257). Those conversations measure the welcome limit (`estimates.welcome`: limit in P, fraction of the book and `n`; with `n` 0 it is the prior) but stay OUT of the curve fit (β, max_rounds, markups, mirror and bands).

### Shapes for the viewer (stable, in English)

In each dealer `Conversation`, *prediction*; in each `Persona`, *estimates*:

```
prediction: { herNext?, herLimit: { mean, lo, hi }, curve: [{ round, price, lo, hi }], walkRound: { mean, lo, hi }, mirror: true | false | "unknown", fittedFrom }
estimates: { opening_markup: { mean, lo, hi }, beta: { mean, lo, hi }, max_rounds: { mean, lo, hi }, accept_margin, walk_after_rounds: { mean, lo, hi },
             mirror: true | false | "unknown", bands: { "<sells|buys>:<rarity>": { limit: { mean, lo, hi }, samples, fewSamples, best } },
             fittedFrom, history: [{ tick, param, value }] }
```

## Links

- ↑ [`src/dealers/`](../AGENTS.md)
- → [`docs/`](../../../docs/AGENTS.md) — where the lessons live
