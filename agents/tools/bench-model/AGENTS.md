# agents/tools/bench-model — offline Market Test model (v2)

Scripts of the [broker](../../routes/broker.md) agent that back the report [bench-model-v2.md](../bench-model-v2.md). That report concludes that no policy that only sees the present beats auto robustly, so live we stay with greedy without waiting (holdTicks 0). Parent: [agents/tools](../AGENTS.md).

They only read the traces in results/; they do not call the API. They run with python3 from this folder. The default data folder is that of 3 October; change it with the BENCH_DAY_DIR variable.

| File | What it is |
|------|------------|
| [data.py](data.py) | Loads the recorded sessions: book after auto (bench.jsonl, bench-raw.jsonl) and official result (stream-team.jsonl). |
| [sim2.py](sim2.py) | Generative model of operators, with hidden limit, arrival, patience, firms and relaxation. Includes the auto stop and the thin, rollout and leave-first policies. |
| [calibrate2.py](calibrate2.py) | ABC calibration so the simulated book resembles the recorded one. Writes prior2.json and ensemble.json. |
| [replay2.py](replay2.py) | Per-session replays: hidden worlds consistent with what was recorded, scoring auto against each policy. |
| [evaluate.py](evaluate.py) | Synthetic evaluation with new seeds (2000 books or more per set of worlds), including specification error. |
| [pols.py](pols.py) | Compared policies and their belief (belief.json). |
| [prior2.json](prior2.json) · [ensemble.json](ensemble.json) · [belief.json](belief.json) | Calibrated prior, the 20 best ABC candidates and the policies' belief (prior plus mixture of k). |

Order to reproduce: calibrate2.py, then replay2.py and then evaluate.py.

The patch [broker-thin.patch](../broker-thin.patch) is only kept: it is not applied without Pablo's OK.
