# src/intros/ — per-thread introductions

One-to-one half of the market matcher: for each pair of duplicate and missing card from the rivals registry (`matchPairs` of [`broker/`](../broker/AGENTS.md)), **bid first** (Pablo, 4 Oct: 8 two-sided introductions, 0 orders): we only write to the team that lacks the card, in a thread in El Rastro (in our venue the game rejects it with self_venue) that is closed on the spot, so that it bids right away in **our venue** (read from `/api/me`; if there is no open venue, nothing goes out). As soon as its bid is in the book, the book introductions notify whoever holds the card, who thus always sees a live bid; the broker crosses them. The value created between other teams in our venue is the organic part of the market.

- **Book introductions:** before the pairs, if another team has an open order in our venue (a sale of a card or a bid for any copy; the public book shows the author under a pseudonym), whoever can match it is notified: whoever holds the card if it is a bid, and whoever is looking for it if it is a sale. At most 2 teams per order and 4 messages per hour.
- **No figures:** the text names card, teams and venue; it is game text (`// game text`). From the rival only structure is read (offers, feed, `/api/cards`).
- **Caps** (`INTRO_PARAMS`): 3 pairs per hour, 1 per pass, one team at most every 2 h, the same team is not told about the same card more than once every 6 h; it leaves ≥ 3 conversation slots free (dealers and team desk share them).
- Record of those sent in `results/bazaar-live/intros.json`.

## Files

- **`intros.ts`** — pure: `planIntros`, `bidFirstMessage`, `INTRO_PARAMS`; memory with `loadIntroMemo`/`saveIntroMemo`. `introDemand`: cards from introductions in the last 6 h where we hold the duplicate; neither dealers nor El Taller use them (duplicates go to teams first).
- **`main.ts`** — `pnpm bazaar:intros` (`--dry-run --once`; live with `--confirm`, every `--every-s` seconds, 300 by default).

Parent: [`src/`](../AGENTS.md)
