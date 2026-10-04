# neg_points formula (measured on 3 Oct)

**Result:** `neg_points` adds up, for each deal (with dealers and between teams), the **value gained at private value, uncapped**; the fee is **not subtracted**.

- Purchase at price `p` of a card of value `v`: `v − p`.
- Sale at price `p`: `p − v`.
- No `min(value, book)`: the earlier assumption (`dealerCap`, «neg_points anomaly») is **discarded**.

## Evidence

Saturday, tick 361: `/api/me` → `score.neg_points = 46.2` (Friday −14.9, `duel_points` 0). With our 26 deals on Saturday (12 between teams in El Rastro and 14 with dealers) and the values in `results/bazaar-live/values.json`:

| Formula | Total | Distance to 46.2 |
|---------|------:|-----------------:|
| Uncapped: purchase `v − p`, sale `p − v`, fee not subtracted | 49.5 | 3.3 |
| Uncapped, minus fee | 16.5 | 29.7 |
| With cap `min(v, book) − p` | −66 | 112 |
| Losses only | −146 | 192 |

The 3.3 residual is probably explained by the lower marginal value of duplicates.

## Example: round trip

RET-02: bought for 12 at tick 205 and sold for 49 at tick 230 → **+37** (`Y − X`).

## Caveats

- Medium-high confidence: it is **a single aggregate**, not an isolated Δ. Verify with a `neg_points` Δ after the next standalone deal.
- Friday's reading (thread 222: Δ0 on a purchase below value) is **superseded** by this measurement.
- **Δ0 on a dealer deal (Saturday, tick 530):** RET-10, the card that completed the RET page, bought from El Chato for 91 P, left `neg_points` at 69.1 (unchanged from tick 507 to 630). Even without the page bonus (~106) its base gave +21 (112 − 91), so a Δ0 contradicts either that dealer deals always add, or that the page bonus scores. In contrast RET-09 at 84 P to another team (tick 504) moved +23. Until this is clarified: the album is only pursued in SAL-09, capped at its base (`--page-bonus-scored` lifts it) and each Δ is audited deal by deal (`score-audit.jsonl`, verdict `match` / `dealer-unscored` / `mismatch`; see `src/coordinator/AGENTS.md`).
