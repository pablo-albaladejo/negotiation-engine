"""Fresh-seed synthetic evaluation (>= 2000 books per world set): auto vs IMX, thin, rollout.
The policies always believe the calibrated prior (prior2.json; for hard books with the known hard shares);
the worlds may differ from it (ensemble, k=1, the older bench-sim prior) to test misspecification."""
import json, random, statistics as st, sys, sim2
pr = json.load(open("prior2.json"))
ens = [e["prior"] for e in json.load(open("ensemble.json"))]
# Older bench-sim prior (v1), kept inline to test misspecification.
old = {"vlo": 15, "vhi": 120, "clo": 30, "chi": 90, "mlo": 0.1, "mhi": 0.25, "arr_max": 10, "firm": 0.2, "imp": 0.25, "pextra": 1}
old = dict(pr, vlo=old["vlo"], vhi=old["vhi"], clo=old["clo"], chi=old["chi"], amlo=old["mlo"], amhi=old["mhi"],
           bmlo=old["mlo"], bmhi=old["mhi"], arr_max=old["arr_max"], pextra=old["pextra"])
HARD = dict(firm=0.35, imp=0.35)
import pols
B, BH = pols.belief(), pols.belief(True)
KMIX = B["kmix"]
WORLDS = {  # name: (n per side, world prior sampler, belief prior)
    "today_cal_k0": (10, lambda r: pr, B),
    "today_kmix": (10, lambda r: dict(pr, kmix=KMIX), B),
    "today_k1": (10, lambda r: dict(pr, k=1), B),
    "today_ens_kmix": (10, lambda r: dict(r.choice(ens), kmix=KMIX), B),
    "today_oldprior": (10, lambda r: old, B),
    "hard_kmix": (12, lambda r: dict(pr, kmix=KMIX, **HARD), BH),
    "hard_ens_kmix": (12, lambda r: dict(r.choice(ens), kmix=KMIX, **HARD), BH),
}
policies = pols.policies
if __name__ == "__main__":
    name = sys.argv[1]; N = int(sys.argv[2]) if len(sys.argv) > 2 else 2000
    n, wsamp, bel = WORLDS[name]
    rng = random.Random(777)
    P = policies(bel)
    res = {"auto": []} | {k: [] for k in P}
    while len(res["auto"]) < N:
        w = wsamp(rng)
        tr = sim2.gen_session(rng, n, w); F = sim2.feasible(tr)
        if F <= 0: continue
        a = sim2.simulate(tr)[0] / F; res["auto"].append(a)
        for k, mk in P.items():
            res[k].append(sim2.simulate(tr, mk())[0] / F - a)
    out = {"world": name, "N": N, "auto_mean": st.mean(res["auto"]), "auto_sd": st.pstdev(res["auto"])}
    for k in P:
        d = res[k]
        out[k] = dict(mean=st.mean(d), sd=st.pstdev(d), se=st.pstdev(d) / len(d) ** 0.5, worst=min(d), best=max(d),
                      win=sum(x > 1e-9 for x in d) / len(d), lose=sum(x < -1e-9 for x in d) / len(d),
                      p5=sorted(d)[len(d) // 20])
    json.dump(out, open(f"eval-{name}.json", "w"), indent=1)
    print(json.dumps(out))
