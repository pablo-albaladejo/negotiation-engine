# Offline fit of Abuela and El Chato (3 Oct 2026)

Read-only analysis with **our threads plus the public feed** (Abuela 29 conversations, 78 figures; Chato 13, 47 figures), much more reliable than the in-code fit, which only saw 9 and 1 of our threads. Only structured figures (offers and deal prices); no figure comes from the dealer's text. These are estimates on the dealer's side: we have no private values. The method is a grid with exact integer rounding (L1 in P) and hard constraints (`final` = rounded limit; if he accepts x, L ≤ x when selling and L ≥ x when buying). The estimates feed the priors of [`persona-fit.ts`](../../src/dealers/history/persona-fit.ts). Model context: [`personas.md`](personas.md) § 3.

Feed window: only ticks 143–159 (the API gives no further back); hour 1 is only seen in our threads.

## Persona parameters

| Parameter | Abuela (level 1) | El Chato (level 2) |
|---|---|---|
| opening_markup | **0.135** [0.122, 0.152], same when buying and selling | **0.25** when selling [0.252, 0.255]; ~0.14 implied when buying |
| β | **3** [2.5, 3.5]: concedes early (~60 % in round 1, then 1 P per round) | **0.35** [0.3, 0.4]: boulware (1–2 rounds at the opening) |
| max_rounds | 6 [5, 7] | 5–6 |
| mirror | not identifiable (the curve already explains it) | **yes**: thread 298, the team goes up +4 and he goes down 4, 4, 4; thread 286, +2 → 2, 2, 2, 2 |
| accept_margin | ≈ 0.02 (upper bound 0.035; rejected 24 against her 25) | not identifiable (none of his acceptances) |
| walk_after_rounds | 5–6 (`final` at r = 4, 5, 6) | ≈ 7 [6, 8] |
| patience_jitter | ≥ 2 | ≥ 1 |
| limit_jitter | ≈ 0.05 [0.015, ~0.10] | ≈ 0.05 [0.018, ~0.10] |
| welcome_first_deal | **yes**: bought a common at 13 = 1.3 × book (`welcome_price_frac` ≈ 0.7) | probably not (his welcome is a pack) |
| demand_markup, politeness_discount | not identifiable | not identifiable |

## Bands (effective limit)

| Dealer · band | book | Opening (P) | Mean limit [lo, hi] (P) | frac of book [lo, hi] | n |
|---|---|---|---|---|---|
| Abuela sells barrio | 26 (list) | 29.05–29.95 | 19.6 [18.1, 21.0] | 0.75 [0.70, 0.81] | 2 |
| Abuela sells common | 10 | 11.05–11.95 | 8.6 [7.0, 10.0] | 0.86 [0.70, 1.00] | 5 |
| Abuela sells uncommon | 25 | 28.05–28.95 | 21.6 [18.5, 24.8] | 0.86 [0.74, 0.99] | 4 |
| Abuela buys common | 10 | 5.0–5.8 | 5.8 [5.0, 6.9] | 0.58 [0.50, 0.69] | 6 |
| Abuela buys uncommon | 25 | 12.0–12.9 | 14.6 [13.1, 16.0] | 0.58 [0.52, 0.64] | 2 |
| Chato buys uncommon | 25 | 13.0–13.7 | 15.3 [13.0, 16.9] | 0.61 [0.52, 0.68] | 3 |
| Chato sells rare | 70 | 96.1–96.6 | 77 [66, 87] | 1.10 [0.94, 1.24] | 3 |
| Chato sells silver pack | 150 (list) | 187.8–189.3 | 169.5 [165.5, 173.5] | 1.13 [1.10, 1.16] | 1 |
| Chato sells uncommon | 25 | 29–33 | 28.6 [28.1, 29.0] | 1.14 [1.12, 1.16] | 1 |

Chato never sells below list (floor ≈ 1.1 × book). With `expected_book` (barrio 33.8; silver 160.8) the fractions drop (0.58 and 1.05) without changing the curve.

## Prediction error (leaving one conversation out)

| | Predictions | MAE (P/round) | Exact | ≤ 1 P | Repeating the last figure (MAE) |
|---|---|---|---|---|---|
| Abuela | 56 (19 conv.) | **0.32** [0.13, 0.57] | 79 % | 95 % | 0.68 |
| Chato | 31 (10 conv.) | **0.29** [0.10, 0.52] | 77 % | 94 % | 0.97 |

The error is concentrated in Abuela's round 1 (0.75; the barrio reaches 5 P in a thread trained only on partials) and in Chato's rounds 2–3.

## What cannot be identified

- Abuela: mirror (the curve alone explains why her step never exceeds ours; we would need a team that concedes less than the curve in r = 1–2), lower bound of `accept_margin`, upper bound of `patience_jitter`, the 5 steps of the limit (confused with `limit_jitter`; our sequence suggests a cycle of 5, not proven), `demand_markup` (the barrio rises from 19 to 21 in hour 2: demand or jitter, n = 2) and `politeness_discount`.
- Chato: `accept_margin`, `demand_markup` and `politeness_discount`; uncommon and silver sales with a single sample.
- Both: n of 1–6 conversations per band and patience almost always censored.

## Surprises

1. **Abuela's welcome is very generous:** 13 P for a common (≈ 2.2 × her normal ceiling of ~5.8). The first conversation with a new dealer should be **selling** them something.
2. **Abuela's asymmetry:** she buys commons at ~0.58 × book and sells them at ~0.86 × book; the barrio, at 0.75 × list.
3. **Chato's mirror is real:** his «1 P per message» against our 1 P steps was an echo. If we take big steps, he concedes big steps, up to his curve.
4. **Open anomaly, Chato's buy opening:** he opens at 13 with ceilings of 15–16; with markup 0.25 a ceiling of 17.3–18.3 would be needed. Either his buy markup is ~0.14, or the base ceiling is ~18 and the two `final`s seen fell on negative steps. It is the only thing that contradicts the frontend model.
5. **Thread 294 (Chato):** he replied with no offer after we asked 13 (equal to his bid): withdrawal at r = 4 without `final`, or the hour's buy budget exhausted. It does not fit `walk_after_rounds` ≈ 7.
6. **Thread 290 (silver):** closed at 181 with an estimated limit of 165–174: we accepted too early.
7. **Abuela's gifts:** 21 in the day, with no visible effect on prices. Chato does not give gifts (his «welcome» is the pack).

## Practical reading

- Abuela: small counteroffers; she concedes ~60 % in round 1 and then 1 P per round down to the floor around r = 5.
- Chato: big, constant steps (the mirror copies them) and patience; he does not move until r ≈ 2–3.

## Links

- ↑ [`docs/bazaar/`](AGENTS.md)
