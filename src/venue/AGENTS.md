# src/venue/ — Our market

Plan to open our venue. Entry point: `main.ts` (`pnpm bazaar:venue`).

## Files

- **`venue.ts`** — `planVenue` (name, `fee_bps` 0 and `fee_per_card` 0 because fees never score and attract flow, `auto` mechanism by default (`board` only if `mechanism.ts` decides it); cost 250 + 20; checks level ≥ 2, cash ≥ 270, name ≤ 40 and that we do not already have one).
- **`mechanism.ts`** — pure: auto or board? `decideMechanism` with named thresholds (`DEFAULT_MECHANISM_THRESHOLDS`): `switch-to-board` only with ≥ 2 Market Test sessions measured in shadow (≥ 1 hard if a hard bench has already passed), mean shadow/auto ≥ 1.10, no session more than 5 % below auto, cash ≥ 250 + 20 + floor, no bench in progress, ≥ 20 ticks until the next bench (`noSwitchWithinTicks`; 10 to close, open and start the broker) and healthy broker heartbeat (≤ 120 s). Otherwise `stay-auto` or `insufficient-data` with the reason; on board, `back-to-auto` if there is no live broker before a bench. A session counts as measured if it has `ratio`: by surplus or, with the official `bench.finished` (`official`), by pairs (`ratioBasis`); the reason lists each session (`sessionNote`, e.g. «board not better»). `ticksPerHourOf` uses 3600 / `tick_seconds` (the accumulated tick / t_hours ratio is biased by the pause). `formatMechanismLine` gives the `pnpm bazaar:play` line. The surplus is by quotes (proxy: hidden limits are not seen).
- **`route.ts`** — coordinator route `venue-mechanism`: `proposeVenueMechanism` proposes `venue:switch-to-board` (close v04 + open board + live broker) or `venue:back-to-auto`; never board within N ticks of a bench. `venueSwitchGate`: live only with `--confirm` **and** `--allow-venue-switch`; even so `executeVenueMechanism` only prints the steps (`pnpm bazaar:venue --replace`).
- **`switch.ts`** — pure: `planVenueSwitch` decides whether the venue can be switched (close ours and open another with the other mechanism): venue open, different mechanism, cash ≥ 270 + floor (the old deposit comes back after a wait) and no bench in progress nor within `noSwitchWithinTicks` of one (`ticksToNextBench`). Board description: «any copy» and 0 fee.
- **`main.ts`** — `pnpm bazaar:venue --dry-run` only reads; opening requires removing `--dry-run` **and** passing `--confirm` (only with the user's approval); the broker key is saved in the root .env.broker file (ignored by git, permissions 600) and never printed. `--replace --mechanism board|auto` switches the venue: with `--dry-run` it prints the plan and the checks; live (only with approval and `--confirm`) it closes, re-reads `/api/me`, stops if the venue is still open and opens the new one; the broker is restarted by the coordinator session.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`src/broker/`](../broker/AGENTS.md)
