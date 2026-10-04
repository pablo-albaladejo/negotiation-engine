"""Policies compared against auto (all believe belief.json = calibrated prior + k mixture from the replays)."""
import json, sim2

def belief(hard=False):
    b = json.load(open("belief.json"))
    b["kmix"] = {int(k): v for k, v in b["kmix"].items()}
    if hard:
        b.update(firm=0.35, imp=0.35)
    return b

def policies(bel):
    return {
        "(a) leave-first": lambda: sim2.make_leave_first(bel),
        "(b) skip-extramarginal d=.2": lambda: sim2.make_imx(bel, 0.2, 1.01, 0),
        "IMX d=.2 th=.3 te=1": lambda: sim2.make_imx(bel, 0.2, 0.3, 1),
        "thin s=.3 th=.3 te=2": lambda: sim2.make_thin(bel, 0.3, 0.3, 2),
        "rollout K=128 md=1 eps=0.5": lambda: sim2.make_rollout(bel, K=128, max_drop=1, eps=0.5),
        "rollout K=128 md=1 eps=1.5": lambda: sim2.make_rollout(bel, K=128, max_drop=1, eps=1.5),
    }
