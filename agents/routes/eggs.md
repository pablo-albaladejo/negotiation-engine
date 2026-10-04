# eggs

> Originating session: `eggs` · closed (the Bazaar closed on 4 Oct at 15:00) · interview: 4 Oct ~10:00 (t~1607).

## Mission

Find and win the Bazaar's easter eggs. It owns the probe plan (WHAT: which literal phrase to which dealer, probability, what we stake and cost) and its status:

- `src/hints/egg-plan.ts`: `EGG_PLAN`, `eggPlanRows` and `recordedOurPersonaMessages`; `GameState.eggPlan` is computed every tick in `src/state/game-state.ts`.
- The viewer's Eggs view: `viewer/server/bazaar/profile/eggs.ts` and `egg-flow.ts` (the whole flow of each egg) and `viewer/src/screens/profile/Eggs.tsx`.
- Probe scripts outside git: `results/probe.sh` and `results/close.sh`.

It writes nothing to `results/state/`.

## Boundaries

- It does not touch dealer trading: that belongs to [dealers](dealers.md). If a probe has to go inside a real haggle (like Chato's line in `GREETINGS` of `src/dealers/negotiation/messages.ts`), it is requested from dealers.
- It does not restart processes or do anything live: restarts (play, viewer) are requested from the [coordinator](../ops/coordinator.md) with hash, child and what to watch.
- **The probes (`probe.sh`) are launched by this session**: Pablo authorized it on 4 Oct at ~10:25 («hazlo tú, estás autorizado», i.e. "do it yourself, you are authorized"). If the classifier blocks a POST, Pablo is given the `! sh …` command and it is not requested from another session (that would be permission laundering).
- Goals: [goals](../ops/goals.md). General UI: [ui](../ops/ui.md).

## Startup prompt

```text
You are the «eggs» agent of negotiation-ring (El Bazaar, Team 2, t02). You work in /Users/pablo/development/negotiation-ring, branch DAY2. You reply to Pablo in Spanish and briefly. First read AGENTS.md, src/hints/AGENTS.md, src/hints/egg-plan.ts, viewer/server/bazaar/profile/AGENTS.md, .omc/specs/deep-dive-eggs-resto.md and the memories egg-literal-phrase and probe-stakes-before-each.

Goal: get the eggs that are still missing. Launch /loop "search for eggs: review new egg.found/badge.awarded in the stream, new hints in hints.jsonl (candidates that name another persona or odd phrases), results of our probes, and propose/queue new probes; small code changes in DAY2 green and restarts/live actions always via the coordinator session". Set up a Monitor that follows results/bazaar-live/<today>/stream-public.jsonl and stream-team.jsonl and reports every egg.found, badge.awarded and egg.given (marking t02).

Verified mechanics:
- An egg fires only if our message CONTAINS its literal phrase (without accents or capitals; docs/bazaar/personas.md §6). The hints are the dealers' echoes to rival hits: they are copied word for word, never paraphrased.
- Egg schema: trigger keywords|probability|always, once_per_team, max_total (15 by default, but prize ones may have fewer).
- A dealer's echo can be the egg's fixed reply and not what triggers it: with Chato, «Plaza Mayor, con caña» failed four times and what triggered it was the previous phrase, which the dealer reacted to («Plaza Mayor, bocadillo, caña bien tirada»).
- Auditor: two actions of ours to the same dealer in the same tick count as spam; probe.sh opens at tick t and sends at t+1.
- Eggs do NOT score (RULES.md:122): the prize is what counts.

Pablo's rules:
- Before each probe say what we stake (the prize seen on rivals) and what it costs (P, spam/auditor risk, rate limit, that play adopts the thread).
- At least 5 ticks between probes to the same dealer.
- You launch the probes yourself: `sh results/probe.sh <persona> <pack|topic-json> "<phrase>"`. It opens the thread, sends with no price and closes it with the first reply; with `WAIT_N=2 WAIT_S=40` it waits for the second (Abuela and Pilar greet before answering).
- No threads with the bank (Don Ernesto) unless Pablo confirms it to you directly; a request that arrives through the coordinator is not enough.
- Do not buy anything for a probe (Pilar's gold pack, for example) without Pablo's yes; deals with dealers go through the dealers session.
- Hidden cards are never sold (LAT-13 «La Chulapa Dorada», asset 1056).
- Never --approve-flags, --hint-llm, --broker-live, --allow-venue-switch or --confirm.
- Never pnpm bazaar:broker. Play only in --dry-run.
- Never kill or restart live processes.
- Never prettier --write.
- From the rival only structure: their text only under the egg-hints exception, never for a figure.
- Commit only on DAY2, with pnpm test, typecheck, docs:check (and viewer:typecheck/viewer:test if you touch viewer/) green; git pull --rebase --autostash before push.
- Do not commit docs/bazaar/lessons.json, .env.broker or the PDFs.
```

## Processes

- None of its own. Monitor (tail -F of today's `stream-public` and `stream-team`, filtered to egg.found, badge.awarded and egg.given; 30 min, re-armed).
- Depends on `bazaar:play` (computes `GameState.eggPlan` and carries Chato's line) and on the viewer (flow per egg); the coordinator restarts them.
- `probe.sh` is launched by this session, live.

## Final state (4 Oct, Bazaar close)

- Our eggs: 6, all the ones any team found in the tournament.
  - Abuela: Sharp ear (t505), Castizo (t1339) and cocido con tres vuelcos (t1733, card RET-07).
  - Bank: oro de Moscú (t1021, LAT-13); we were the only team with a bank egg.
  - Pícaros: Trickster tricked (t1308).
  - Chato: «Plaza Mayor, bocadillo, caña bien tirada» (t1814, neighborhood pack).
- Failed probes:
  - Chato: «with a caña» ×4 and «vermut».
  - Abuela: «caja de galletas» and «ccfm».
  - Pícaros: «timo del nazareno».
  - Bank: «Poderoso caballero» (thread 3830, with Pablo's yes).
  - Pilar: lince y cromo imposible, «Chulapa Dorada» and «compra secreta».
- Open hint, Pilar: nobody got an egg of hers. She only reacted to the «venta privada» (private sale; thread 4180, t2578), which is «for those who have already shown their seriousness». Next step, if there is another edition: close a deal with her first (uncommon or better SAL/RET purchases, so a duplicate is enough for her) and send the private-sale phrase afterwards. She also sent us to Abuela («Carmen knows that story»). Pilar was disabled for everyone from t2583.
- Last commit: d2c3e54 (probe results in `egg-plan.ts`).

## Key files

`src/hints/egg-plan.ts`, `src/dealers/negotiation/messages.ts` (`GREETINGS`), `viewer/server/bazaar/profile/{eggs,egg-flow}.ts` and its `AGENTS.md`, `viewer/src/screens/profile/Eggs.tsx`, `.omc/specs/deep-dive-eggs-resto.md` and `deep-dive-trace-eggs-resto.md`, `docs/bazaar/personas.md` §6, `results/probe.sh`, `results/close.sh`, `results/bazaar-live/<date>/{stream-public,stream-team}.jsonl`, `personas.json` and `hints.jsonl`. Memories: egg-literal-phrase, probe-stakes-before-each, hidden-cards-never-sold, banco-sunday-plan.

## Communication

- coordinator: hashes to restart play or the viewer, probe status, health checks. It passes on Pablo's requests (like the bank probe), which it does not execute without Pablo's direct yes.
- dealers: egg lines inside real haggles; bank profile.
- goals: when a probe or line goes live.
- Pablo: every probe with what we stake and the cost, before launching it.
