"""Per-session replays: sample hidden worlds consistent with what we recorded (Bayesian update of the
calibrated prior per session, by constructive proposal + rejection), then score auto vs the policies.

Observation model (auto venue v04, sessions h3-h11): each snapshot is the post-auto book; a trader matched by auto
on arrival is never seen. A world is accepted when a simulated auto reproduces (1) exactly the visible set at every
recorded age, (2) the official number of matches, (3) the official efficiency within +-0.02.
Visible traders keep their recorded quotes; their hidden (L, P, firm) are drawn from the per-trader posterior under a
prior drawn from the ABC ensemble. Unseen traders are drawn from the prior, conditioned on crossing on arrival."""
import json, math, random, statistics as st, sys
import sim2
from data import load, traders

ENS = json.load(open("ensemble.json"))
W_ENS = [math.exp(-e["loss"] / 2) for e in ENS]
BELIEF = json.load(open("prior2.json"))
KS = (0, 1, 2)


def fill_gaps(path):
    ages = sorted(path)
    out = dict(path)
    for a, b in zip(ages, ages[1:]):
        for g in range(a + 1, b):
            out[g] = round(path[a] + (path[b] - path[a]) * (g - a) / (b - a))
    return out


def run_auto(world):
    return sim2.simulate(world, None, record=True)


def pick_h(hs, rng, cond):
    """Sample (L, P, firm) from the cumulative hypotheses list restricted to cond(P)."""
    sub, prev = [], 0.0
    for acc, L, P, firm, k in hs:
        if cond(P):
            sub.append((acc - prev, L, P, firm, k))
        prev = acc
    if not sub:
        return None
    r = rng.random() * sum(x[0] for x in sub)
    for wgt, L, P, firm, k in sub:
        r -= wgt
        if r <= 0:
            return L, P, firm, k
    return sub[-1][1:]


def sample_world(S, vis, rng):
    w = dict(rng.choices([e["prior"] for e in ENS], W_ENS)[0], k=rng.choice(KS))
    pk = sim2.prior_key(w)
    O = sorted(S["snaps"])
    end_obs = O[-1]
    run = next(iter(vis)).split("-")[0]
    n = 10
    ids = {int(i.split("-")[1]) for i in vis}
    ub = [f"{run}-{j}" for j in range(n) if j not in ids]
    ua = [f"{run}-{j}" for j in range(n, 2 * n) if j not in ids]
    rng.shuffle(ub); rng.shuffle(ua)
    gaps = [g for g in range(0, w["arr_max"] + 1) if g not in O]
    # singles (arrive in an unrecorded age and leave unseen), unseen-unseen pairs u, visible traders hit by unseen
    sb = rng.randint(0, min(1, len(ub))) if gaps else 0
    sa = rng.randint(0, min(1, len(ua))) if gaps else 0
    early = {i: x for i, x in vis.items() if max(x["path"]) < end_obs}
    # vv visible-visible matches: a bid and an ask that vanish at the same tick
    vv_c = [(b, a) for b in early for a in early if vis[b]["side"] == "bid" and vis[a]["side"] == "ask"
            and max(vis[b]["path"]) == max(vis[a]["path"])]
    vv = rng.randint(0, min(2, len(vv_c)))
    vvp, taken = [], set()
    for b, a in rng.sample(vv_c, len(vv_c)):
        if len(vvp) < vv and b not in taken and a not in taken:
            vvp.append((b, a)); taken |= {b, a}
    if len(vvp) < vv:
        return None
    u = (len(ub) - sb) + (len(ua) - sa) - (S["matches"] - vv)
    hit_ask, hit_bid = len(ub) - sb - u, len(ua) - sa - u  # visible asks hit by unseen bids, and vice versa
    if u < 0 or hit_ask < 0 or hit_bid < 0:
        return None
    ca = [i for i, x in early.items() if x["side"] == "ask" and i not in taken]
    cb = [i for i, x in early.items() if x["side"] == "bid" and i not in taken]
    if hit_ask > len(ca) or hit_bid > len(cb):
        return None
    hit = set(rng.sample(ca, hit_ask) + rng.sample(cb, hit_bid))
    world, byid = [], {}
    for i, x in vis.items():
        p = fill_gaps(x["path"])
        ages = sorted(p)
        f, l = ages[0], ages[-1]
        qs = tuple(p[a] for a in ages)
        hs = sim2.hypotheses(x["side"], qs, pk)
        nq = len(qs)
        cond = (lambda P: P > nq) if (i in hit or i in taken) else (lambda P: P >= nq) if l >= end_obs else (lambda P: P == nq)
        h = pick_h(hs, rng, cond)
        if h is None:
            return None
        L, P, firm, k = h
        tr = sim2.Trader(i, x["side"], f, P, firm, L, qs[0], k, path={a - f: p[a] for a in ages})
        world.append(tr); byid[i] = tr
    for i in sorted(hit, key=lambda i: max(vis[i]["path"])):
        x = byid[i]
        t = max(vis[i]["path"]) + 1
        qx = x.quote(t - x.arr)
        pool, side = (ub, "bid") if x.side == "ask" else (ua, "ask")
        for _try in range(300):
            v = sim2.gen_trader(rng, pool[-1], side, w, arr=t)
            if (v.quote(0) >= qx) if side == "bid" else (v.quote(0) <= qx):
                break
        else:
            return None
        pool.pop()
        world.append(v)
    for _ in range(u):
        t = rng.randint(0, w["arr_max"])
        a = sim2.gen_trader(rng, ua.pop(), "ask", w, arr=t)
        for _try in range(300):
            b = sim2.gen_trader(rng, ub[-1], "bid", w, arr=t)
            if b.quote(0) >= a.quote(0):
                break
        else:
            return None
        ub.pop()
        world += [a, b]
    for pool, side in ((ub, "bid"), (ua, "ask")):
        while pool:
            g = rng.choice(gaps)
            v = sim2.gen_trader(rng, pool.pop(), side, w, arr=g)
            nxt = min([o for o in O if o > g], default=10 ** 6)
            v.P = min(v.P, nxt - g)
            world.append(v)
    return w["k"], world


def consistent(S, world):
    g, m, snaps = run_auto(world)
    if m != S["matches"]:
        return None
    for t, book in S["snaps"].items():
        if set(snaps.get(t, {})) != set(book):
            return None
    F = sim2.feasible(world)
    if F <= 0 or abs(g / F - S["auto"]) > 0.02:
        return None
    return F, g / F


def main(tries=200000, want=60, seed=5):
    rng = random.Random(seed)
    import pols as P
    pols = P.policies(P.belief())
    out = {}
    only = sys.argv[1:] and [int(a) for a in sys.argv[1:]]
    for st_, S in load().items():
        if only and S["session"] not in only:
            continue
        vis = traders(S)
        acc, ks = [], []
        for _ in range(tries):
            res = sample_world(S, vis, rng)
            if res is None:
                continue
            kk, wd = res
            c = consistent(S, wd)
            if c:
                acc.append((wd, *c))
                ks.append(kk)
                if len(acc) >= want:
                    break
        r = {"session": S["session"], "official_auto": S["auto"], "accepted": len(acc),
             "k_accepted": {k: ks.count(k) for k in KS}}
        if acc:
            r["sim_auto"] = st.mean(a for _, _, a in acc)
            r["oracle_feasible_share"] = None
            for k, mk in pols.items():
                d = [sim2.simulate(wd, mk())[0] / F - a for wd, F, a in acc]
                r[k] = dict(mean=st.mean(d), sd=st.pstdev(d), worst=min(d), best=max(d),
                            win=sum(x > 1e-9 for x in d) / len(d), lose=sum(x < -1e-9 for x in d) / len(d))
        out[S["session"]] = r
        print(json.dumps(r), flush=True)
    json.dump(out, open(f"replay-{'-'.join(map(str, only)) if only else 'all'}.json", "w"), indent=1)


if __name__ == "__main__":
    main()
