# Market Test (bench): model v2 and policy versus "auto"

**Verdict:** no policy robustly beats *auto*. "thin" is the safest: +0.001 on synthetic, +0.006 on average in the replays and −0.004 in the worst session; it is almost neutral. Rollout gains between +0.004 and +0.012 on synthetic, but loses −0.067 in session 6.

**Data:** 6 sessions from 3 October (h3, h5, h7, h9 and h11 on v04 *auto*; h13 on v26 *board*). Official efficiency, always equal to `auto_baseline`: 0.899 · 0.967 · 0.769 · 0.928 · 0.866 · 0.696.

**Data correction:** two records with the same tick less than 15 s apart are a re-read of the book within the same tick, not an extra tick. Counting them as an extra tick created false pauses. Once corrected, the trajectories are linear and nobody lasts more than 6 ticks.

## Calibrated model (ABC, 6000 candidates)

Bids U[10,130] · asks U[25,100] · initial margin ask U[.05,.35], bid U[.10,.30] · arrival U{0..9} · patience: 25 % impatient (1–2 ticks), the rest 3–6 · 20 % firm · linear relaxation that ends k steps before the limit (k = 0/1/2 at 0.4/0.4/0.2). Fit: auto efficiency 0.855 versus 0.854 observed.

## Efficiency Δ versus auto in the replays (60 coherent worlds per session)

| Session | leave-first | skip-extramarginal | thin | rollout |
|---|---|---|---|---|
| 1 | −0.038 | −0.000 | +0.001 | −0.007 |
| 2 | −0.012 | 0 | 0 | −0.006 |
| 3 | +0.002 | +0.011 | +0.007 | +0.002 |
| 4 | −0.040 | +0.000 | −0.004 | −0.000 |
| 5 | −0.010 | +0.038 | +0.033 | +0.039 |
| 6 | 0 | −0.003 | 0 | −0.067 |
| Mean / worst session | −0.016 / −0.040 | +0.008 / −0.003 | +0.006 / −0.004 | −0.007 / −0.067 |

On synthetic (2000 books per world): leave-first ≈ −0.02; skip-extramarginal ≈ 0; thin between +0.0003 and +0.0018 (p5 = 0); rollout between +0.004 and +0.010.

## Recommendation

1. Live, keep `planBench` (holdTicks 0, equivalent to auto).
2. thin (s 0.3, θ 0.3, te 2) only as an option disabled by default (`broker-thin.patch`, not applied). Realistic expectation: between +0.000 and +0.002 per session.
3. Discard rollout and leave-first.
4. The full-information ceiling is about +0.07 above auto. No policy that only sees the present gets close, because impatient traders punish any waiting.
