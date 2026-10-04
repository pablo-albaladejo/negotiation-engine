"""Calibrate the generative prior: random search (ABC-style) so the simulated post-auto book matches the
recorded one (5 sessions) and the official auto efficiency / matches. Writes prior2.json."""
import json, random, statistics as st, sys
import sim2
from data import load, traders

def book_stats(sessions):
    """sessions: list of (snaps {age: {id: quote}}, side_of id fn, eff, matches, n_side)."""
    eff, mt, uns, bq, aq, brel, arel, bdur, adur, firm2 = [], [], [], [], [], [], [], [], [], []
    for snaps, side, e, m, n in sessions:
        eff.append(e); mt.append(m)
        path = {}
        for age in sorted(snaps):
            for i, q in snaps[age].items():
                path.setdefault(i, []).append(q)
        uns.append(1 - len(path) / (2 * n))
        for i, qs in path.items():
            s = side(i)
            (bq if s == "bid" else aq).append(qs[0])
            (bdur if s == "bid" else adur).append(len(qs))
            if len(qs) >= 2:
                firm2.append(1.0 if all(q == qs[0] for q in qs) else 0.0)
            if len(qs) >= 3 and qs[-1] != qs[0]:
                r = (qs[-1] - qs[0]) / qs[0]
                (brel if s == "bid" else arel).append(abs(r))
    f = lambda v: st.mean(v) if v else 0.0
    return dict(eff=f(eff), matches=f(mt), unseen=f(uns), bq0=f(bq), aq0=f(aq), brel=f(brel), arel=f(arel),
                bdur=f(bdur), adur=f(adur), firm2=f(firm2))

def observed():
    out = []
    for st_, S in load().items():
        tr = traders(S)
        side = {i: x["side"] for i, x in tr.items()}
        snaps = {a: {i: q for i, (s, q) in b.items()} for a, b in S["snaps"].items()}
        out.append((snaps, side.get, S["auto"], S["matches"], 10))
    return out

def simulated(pr, N, seed):
    rng = random.Random(seed); out = []
    for _ in range(N):
        tr = sim2.gen_session(rng, 10, pr)
        F = sim2.feasible(tr)
        if F <= 0: continue
        g, m, snaps = sim2.simulate(tr, record=True)
        side = {x.id: x.side for x in tr}
        out.append((snaps, side.get, g / F, m, 10))
    return out

# scale of each stat (rough sd of a 5-session mean) for the loss
SCALE = dict(eff=0.03, matches=0.4, unseen=0.04, bq0=4, aq0=5, brel=0.04, arel=0.03, bdur=0.4, adur=0.4, firm2=0.08)

def loss(s, o):
    return sum(((s[k] - o[k]) / SCALE[k]) ** 2 for k in SCALE)

if __name__ == "__main__":
    O = book_stats(observed())
    print("observed", {k: round(v, 3) for k, v in O.items()})
    rng = random.Random(5)
    base = dict(sim2.PRIOR)
    space = dict(vlo=[10, 15, 20, 25], vhi=[90, 100, 110, 120, 130], clo=[20, 25, 30, 35, 40], chi=[80, 90, 100, 110],
                 amlo=[0.05, 0.1, 0.15], amhi=[0.2, 0.25, 0.3, 0.35], bmlo=[0.05, 0.1, 0.15], bmhi=[0.25, 0.3, 0.35, 0.4, 0.45],
                 arr_max=[9, 10, 11], pextra=[0, 1], k=[0, 1, 2])
    res = []
    for it in range(int(sys.argv[1]) if len(sys.argv) > 1 else 400):
        pr = dict(base, **{k: rng.choice(v) for k, v in space.items()})
        s = book_stats(simulated(pr, 200, 1))
        res.append((loss(s, O), pr, s))
    res.sort(key=lambda x: x[0])
    for l, pr, s in res[:8]:
        print(round(l, 2), {k: pr[k] for k in space}, {k: round(v, 3) for k, v in s.items()})
    # refine: re-evaluate top 8 with more sessions, keep the best
    best = min(((loss(book_stats(simulated(pr, 1500, 9)), O), pr) for _, pr, _ in res[:8]), key=lambda x: x[0])
    print("best (1500 sessions):", round(best[0], 2), best[1])
    print("its stats", {k: round(v, 3) for k, v in book_stats(simulated(best[1], 1500, 9)).items()})
    json.dump(best[1], open("prior2.json", "w"), indent=1)
    json.dump([dict(loss=l, prior=pr) for l, pr, _ in res[:20]], open("ensemble.json", "w"), indent=1)
