# src/agenda/ — Agenda and triggers

The calendar as a playbook and feed events as triggers; the coordinator applies them before the routes propose. Nothing here makes a POST.

## Files

- **`agenda.ts`** — `PLAYBOOK` per calendar action, with lead time and planned action: bench (1 h before: board venue + broker plan, intent only; the hard bench, a firmer broker), round (replan the ladder: top 3 per level and round), set_release (read the new set's catalog and values, page targets), grant_all (replan purchases with the extra cash; open the pack, intent only), duels (0.5 h before: change the duels configuration, decay and days), day_closes (0.5 h before: close or renew offers that would expire while the gates are closed), announce and end_round (do not open conversations, close what is pending), persona (a stall closes). `agendaItems` marks each event as due-now, due-soon or later; `agendaEffects` gives what applies now and the coordinator applies it BEFORE the routes propose (blocks openings, closes personas, adjusts duel decay). Agenda intents never go out: `arbitrate` prints and discards them.
- **`triggers.ts`** — `runTriggers`: feed events, each one only once (cursor in `results/bazaar-live/<date>/triggers.json`, live only; in dry-run, in memory). level.announced: `personas/<id>.yaml` skeleton; level.activated: read traits and menu and generate the card and `.claude/agents/persona-<id>.md` with `personaFiles` (strategy by type; trickster, flags from the first message; in dry-run it only prints what would be written); level.unlocked for us: allowed conversations; `clock.limits` change: budget recomputed; another team's egg: higher egg priority; warning, strike or cooloff: no probes and a careful tone with that persona.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`coordinator/`](../coordinator/AGENTS.md)
