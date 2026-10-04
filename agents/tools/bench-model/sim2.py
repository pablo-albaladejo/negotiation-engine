"""Market Test model v2: generative traders, auto stall, Bayesian per-trader posterior and the
intramarginal-filter policy (IMX).

Trader model (Bench.js hints + recorded books):
- side bid/ask, hidden limit L ~ U[vlo,vhi] (bids) / U[clo,chi] (asks), arrival a ~ U{0..arr_max}
- impatient (share imp): stays P in {1,2}+pextra ticks; otherwise P in {3..6}+pextra
- firm (share firm): quote never moves
- first quote q0 = round(L(1+m)) for asks, round(L(1-m)) for bids, m ~ U[mlo_side, mhi_side]
- relaxing: quote(age) = round(q0 + (L-q0) * min(1, age / (P-1+k))) (k=0: reaches L at its last tick)
Score: efficiency = realised sum(Lb - La) / competitive-equilibrium surplus of all traders.
"""
import random
from functools import lru_cache

T = 17  # recorded sessions span ages 0..16

PRIOR = dict(vlo=15, vhi=120, clo=30, chi=90, amlo=0.10, amhi=0.28, bmlo=0.10, bmhi=0.38,
             arr_max=10, firm=0.20, imp=0.25, pextra=1, k=0)


class Trader:
    __slots__ = ("id", "side", "arr", "P", "firm", "L", "q0", "k", "path")

    def __init__(self, id, side, arr, P, firm, L, q0, k=0, path=None):
        self.id, self.side, self.arr, self.P, self.firm, self.L, self.q0, self.k = id, side, arr, P, firm, L, q0, k
        self.path = path  # optional fixed observed quotes by age (replays)

    def quote(self, age):
        if self.path and age in self.path:
            return self.path[age]
        if self.firm or self.P <= 1:
            return self.q0
        f = min(1.0, age / (self.P - 1 + self.k))
        return round(self.q0 + (self.L - self.q0) * f)


def gen_trader(rng, id, side, pr, arr=None):
    L = rng.uniform(pr["vlo"], pr["vhi"]) if side == "bid" else rng.uniform(pr["clo"], pr["chi"])
    imp = rng.random() < pr["imp"]
    P = (rng.randint(1, 2) if imp else rng.randint(3, 6)) + pr["pextra"]
    firm = rng.random() < pr["firm"]
    if side == "ask":
        q0 = round(L * (1 + rng.uniform(pr["amlo"], pr["amhi"])))
    else:
        q0 = round(L * (1 - rng.uniform(pr["bmlo"], pr["bmhi"])))
    a = rng.randint(0, pr["arr_max"]) if arr is None else arr
    k = pr.get("k", 0)
    if "kmix" in pr:
        k = rng.choices(list(pr["kmix"]), list(pr["kmix"].values()))[0]
    return Trader(id, side, a, P, firm, L, q0, k)


def gen_session(rng, n, pr):
    return [gen_trader(rng, f"x-{i}", "bid", pr) for i in range(n)] + \
           [gen_trader(rng, f"x-{n + i}", "ask", pr) for i in range(n)]


def ce(bids, asks):
    """Competitive equilibrium of two value lists: (quantity, surplus, price interval lo, hi)."""
    V = sorted(bids, reverse=True)
    C = sorted(asks)
    k = 0
    while k < min(len(V), len(C)) and V[k] >= C[k]:
        k += 1
    s = sum(V[i] - C[i] for i in range(k))
    lo = max(([C[k - 1]] if k else []) + ([V[k]] if k < len(V) else []) or [0])
    hi = min(([V[k - 1]] if k else []) + ([C[k]] if k < len(C) else []) or [lo])
    return k, s, lo, hi


def feasible(traders):
    return ce([t.L for t in traders if t.side == "bid"], [t.L for t in traders if t.side == "ask"])[1]


# ------------------------------------------------------------------ engine

def auto_pairs(book):
    bids = sorted((x for x in book if x[0].side == "bid"), key=lambda x: -x[1])
    asks = sorted((x for x in book if x[0].side == "ask"), key=lambda x: x[1])
    out = []
    for (b, qb), (a, qa) in zip(bids, asks):
        if qb < qa:
            break
        out.append((b, a))
    return out


def simulate(traders, policy=None, record=False, T_=None):
    """policy(book, t, view) -> pairs; None = auto. Returns (gains, n_matches, snaps post-match)."""
    T_ = T_ or T
    done = set()
    gains, nm, snaps = 0.0, 0, {}
    view = View(policy.ctx if policy else None, traders)
    for t in range(T_):
        book = [(x, x.quote(t - x.arr)) for x in traders
                if x.arr <= t and t - x.arr < x.P and x.id not in done]
        view.see(t, book)
        pairs = auto_pairs(book) if policy is None else policy(book, t, view)
        q = {x.id: v for x, v in book}
        for b, a in pairs:
            if b.id in done or a.id in done or q[b.id] < q[a.id]:
                raise ValueError("invalid pair")
            done |= {b.id, a.id}
            gains += b.L - a.L
            nm += 1
        if record:
            snaps[t] = {x.id: v for x, v in book if x.id not in done}
    return gains, nm, snaps


class View:
    """What a broker observes: per id the quote history (age-indexed from first sight)."""

    def __init__(self, ctx, traders):
        self.ctx = ctx
        self.h = {}       # id -> list of quotes since first seen
        self.first = {}   # id -> first tick seen
        self.side = {}
        self.last_seen = {}
        self.n_side = sum(1 for x in traders if x.side == "bid")  # ids reveal it in the real game

    def see(self, t, book):
        for x, q in book:
            if x.id not in self.first:
                self.first[x.id] = t
                self.h[x.id] = []
                self.side[x.id] = x.side
            self.h[x.id].append(q)
            self.last_seen[x.id] = t


# ------------------------------------------------------------------ Bayesian per-trader posterior

M_GRID = 24


@lru_cache(maxsize=200000)
def posterior(side, qs, pr_key):
    """Posterior summary given the quotes seen at consecutive ages 0..j (still present):
    (mean L, P(leaves after this tick), P(impatient), P(firm), Lmin, Lmax)."""
    pr = dict(pr_key)
    hs = hypotheses(side, qs, pr_key)
    j = len(qs) - 1
    prev = W = SL = Sleave = Simp = Sfirm = 0.0
    Lmin, Lmax = 1e9, -1e9
    for acc, L, P, firm, k in hs:
        w = acc - prev
        prev = acc
        SL += w * L
        Sleave += w * (P == j + 1)
        Simp += w * (P <= 2 + pr["pextra"])
        Sfirm += w * firm
        Lmin, Lmax = min(Lmin, L), max(Lmax, L)
    return SL, Sleave, Simp, Sfirm, Lmin, Lmax


def prior_key(pr):
    kmix = tuple(sorted(pr.get("kmix", {pr.get("k", 0): 1.0}).items()))
    return tuple(sorted((k, v) for k, v in pr.items() if k in
                        ("amlo", "amhi", "bmlo", "bmhi", "imp", "firm", "pextra"))) + (("kmix", kmix),)


# ------------------------------------------------------------------ policies

def make_imx(pr, delta=0.05, theta=0.5, t_end=2, mode="greedy"):
    """Intramarginal filter. Each tick:
    1. posterior mean limit L^ of every trader seen so far (present, matched or gone) + expected
       limits of the not-yet-arrived traders (prior quantiles) -> CE price p^.
    2. extramarginal = bid with L^ < p^(1-delta) or ask with L^ > p^(1+delta).
    3. auto crossing among non-extramarginal present traders.
    4. leftover crossing pairs (auto order) are also matched when the non-extramarginal side is urgent
       (P(leaves after this tick) >= theta) or the session ends within t_end ticks, or both sides are
       extramarginal (no intramarginal partner at stake).
    """
    pk = prior_key(pr)
    n_unseen_cache = {}

    def pol(book, t, view):
        est = {}
        for xid, qs in view.h.items():
            est[xid] = posterior(view.side[xid], tuple(qs), pk)
        bidsL = [est[i][0] for i in est if view.side[i] == "bid"]
        asksL = [est[i][0] for i in est if view.side[i] == "ask"]
        n = view.n_side
        ub, ua = n - len(bidsL), n - len(asksL)
        bidsL += [pr["vlo"] + (pr["vhi"] - pr["vlo"]) * (i + 0.5) / ub for i in range(ub)]
        asksL += [pr["clo"] + (pr["chi"] - pr["clo"]) * (i + 0.5) / ua for i in range(ua)]
        _, _, lo, hi = ce(bidsL, asksL)
        p = (lo + hi) / 2

        def extra(x):
            L = est[x.id][0]
            return L < p * (1 - delta) if x.side == "bid" else L > p * (1 + delta)

        endgame = t >= T - 1 - t_end
        good = [(x, q) for x, q in book if not extra(x)]
        pairs = auto_pairs(good)
        used = {i for b, a in pairs for i in (b.id, a.id)}
        rest = [(x, q) for x, q in book if x.id not in used]
        for b, a in auto_pairs(rest):
            eb, ea = extra(b), extra(a)
            urgent = (not eb and est[b.id][1] >= theta) or (not ea and est[a.id][1] >= theta)
            if endgame or urgent or (eb and ea):
                pairs.append((b, a))
            else:
                continue
        return pairs

    pol.ctx = None
    pol.__name__ = f"imx(d={delta},th={theta},te={t_end})"
    return pol


# ------------------------------------------------------------------ hypotheses (for sampling) and rollout policy

@lru_cache(maxsize=200000)
def hypotheses(side, qs, pr_key):
    """Consistent (L, P, firm, k) hypotheses with normalised cumulative weights for sampling (P >= len(qs))."""
    pr = dict(pr_key)
    j = len(qs) - 1
    q0 = qs[0]
    mlo, mhi = (pr["amlo"], pr["amhi"]) if side == "ask" else (pr["bmlo"], pr["bmhi"])
    pe = pr["pextra"]
    Ps = [(p + pe, pr["imp"] / 2) for p in (1, 2)] + [(p + pe, (1 - pr["imp"]) / 4) for p in (3, 4, 5, 6)]
    const = all(q == q0 for q in qs)
    hs = []
    for widen in (0.0, 0.15, 0.4):
        lo, hi = max(0.0, mlo - widen), min(0.9, mhi + widen)
        for i in range(M_GRID):
            m = lo + (hi - lo) * (i + 0.5) / M_GRID
            L = q0 / (1 + m) if side == "ask" else q0 / (1 - m)
            for P, wp in Ps:
                if P < j + 1:
                    continue
                for firm, wf in ((True, pr["firm"]), (False, 1 - pr["firm"])):
                    for k, wk in pr["kmix"]:
                        if firm or P <= 1:
                            if not const or k != pr["kmix"][0][0]:
                                continue
                            wk = 1.0
                        elif any(abs(q0 + (L - q0) * min(1.0, a / (P - 1 + k)) - q) > 1.01 for a, q in enumerate(qs)):
                            continue
                        hs.append((wp * wf * wk, L, P, firm, k))
        if hs:
            break
    if not hs:  # outside the model even widened: limit = last quote, leaves soon
        hs = [(1.0, float(qs[-1]), j + 1, True, 0)]
    tot = sum(h[0] for h in hs)
    acc, out = 0.0, []
    for w, L, P, firm, k in hs:
        acc += w / tot
        out.append((acc, L, P, firm, k))
    return tuple(out)


def sample_h(hs, u):
    for acc, L, P, firm, k in hs:
        if u <= acc:
            return L, P, firm, k
    return hs[-1][1:]


def _future_auto(items, t0, T_):
    """items: list of [side, L, arr, P, firm, q0, k, qfix] (qfix: quote at t0 for present ones). Auto from t0."""
    gains = 0.0
    done = [False] * len(items)
    for t in range(t0, T_):
        bids, asks = [], []
        for idx, (side, L, arr, P, firm, q0, k) in enumerate(items):
            if done[idx] or arr > t or t - arr >= P:
                continue
            age = t - arr
            if firm or P <= 1:
                q = q0
            else:
                q = round(q0 + (L - q0) * min(1.0, age / (P - 1 + k)))
            (bids if side == "bid" else asks).append((q, idx))
        if not bids or not asks:
            continue
        bids.sort(reverse=True)
        asks.sort()
        for (qb, ib), (qa, ia) in zip(bids, asks):
            if qb < qa:
                break
            done[ib] = done[ia] = True
            gains += items[ib][1] - items[ia][1]
    return gains


def make_rollout(pr, K=24, seed=0, max_drop=3, eps=0.0):
    """One-step lookahead over auto: candidates 'match the top j auto pairs' (j = len..len-max_drop); each scored
    by K posterior samples of the present traders' hidden (L, P, firm) + unseen arrivals from the prior, with auto
    as continuation (common random numbers)."""
    pk = prior_key(pr)
    rng = random.Random(seed)

    def pol(book, t, view):
        pairs = auto_pairs(book)
        if not pairs:
            return pairs
        n = view.n_side
        seen_b = sum(1 for i in view.side if view.side[i] == "bid")
        seen_a = len(view.side) - seen_b
        cands = list(range(len(pairs), max(-1, len(pairs) - 1 - max_drop), -1))
        score = {j: 0.0 for j in cands}
        for _ in range(K):
            items, idx = [], {}
            for x, q in book:
                hs = hypotheses(x.side, tuple(view.h[x.id]), pk)
                L, P, firm, k = sample_h(hs, rng.random())
                age = len(view.h[x.id]) - 1
                arr = t - age
                idx[x.id] = len(items)
                # present: reproduce observed quote path, then model; q0 from the first seen quote
                items.append([x.side, L, arr, P, firm, view.h[x.id][0], k])
            for side, cnt in (("bid", n - seen_b), ("ask", n - seen_a)):
                for _u in range(cnt):
                    lo = t + 1
                    if lo > pr["arr_max"]:
                        break
                    u = gen_trader(rng, "u", side, pr, arr=rng.randint(lo, pr["arr_max"]))
                    items.append([side, u.L, u.arr, u.P, u.firm, u.q0, u.k])
            for j in cands:
                its = [list(it) for it in items]
                g = 0.0
                for b, a in pairs[:j]:
                    g += its[idx[b.id]][1] - its[idx[a.id]][1]
                    its[idx[b.id]][3] = its[idx[a.id]][3] = -1  # gone
                # traders whose t is their last tick: P = t - arr + 1, so they cannot appear at t+1
                score[j] += g + _future_auto(its, t + 1, T)
        full = len(pairs)
        best = max(cands, key=lambda j: (score[j] - (eps * K if j != full else 0), j))
        return pairs[:best]

    pol.ctx = None
    pol.__name__ = f"rollout(K={K},md={max_drop},eps={eps})"
    return pol


def clearing_price(view, pr, pk):
    """CE price of posterior-mean limits of every trader seen so far + prior quantiles for the unseen ones."""
    est = {i: posterior(view.side[i], tuple(q), pk) for i, q in view.h.items()}
    n = view.n_side
    bL = [est[i][0] for i in est if view.side[i] == "bid"]
    aL = [est[i][0] for i in est if view.side[i] == "ask"]
    ub, ua = n - len(bL), n - len(aL)
    bL += [pr["vlo"] + (pr["vhi"] - pr["vlo"]) * (i + 0.5) / ub for i in range(ub)]
    aL += [pr["clo"] + (pr["chi"] - pr["clo"]) * (i + 0.5) / ua for i in range(ua)]
    _, _, lo, hi = ce(bL, aL)
    return (lo + hi) / 2, est


def make_thin(pr, s=0.3, theta=0.3, t_end=2):
    """Thin-pair deferral (the rule the rollout's decisions point to). Auto crossing; then, from the marginal pair
    upward, defer a pair while (1) its estimated surplus at the posterior-mean limits is below s * p^ (CE price
    estimate), (2) neither side is likely to leave after this tick (posterior P(leave) < theta), and (3) more than
    t_end ticks remain."""
    pk = prior_key(pr)

    def pol(book, t, view):
        pairs = auto_pairs(book)
        if not pairs or t >= T - 1 - t_end:
            return pairs
        p, est = clearing_price(view, pr, pk)
        while pairs:
            b, a = pairs[-1]
            eb, ea = est[b.id], est[a.id]
            if eb[0] - ea[0] < s * p and eb[1] < theta and ea[1] < theta:
                pairs = pairs[:-1]
            else:
                break
        return pairs

    pol.ctx = None
    pol.__name__ = f"thin(s={s},th={theta},te={t_end})"
    return pol


def make_leave_first(pr):
    """Coordinator's (a): asks ascending by quote; each takes, among the free bids that cross it, the one most likely
    to leave after this tick (posterior P(leave), then age, then quote) instead of the highest bid."""
    pk = prior_key(pr)

    def pol(book, t, view):
        bids = [(x, q) for x, q in book if x.side == "bid"]
        asks = sorted((x for x in book if x[0].side == "ask"), key=lambda x: x[1])
        used, out = set(), []
        for a, qa in asks:
            c = [(b, qb) for b, qb in bids if b.id not in used and qb >= qa]
            if not c:
                break
            b, _ = max(c, key=lambda bq: (posterior("bid", tuple(view.h[bq[0].id]), pk)[1], len(view.h[bq[0].id]), bq[1]))
            used.add(b.id)
            out.append((b, a))
        return out

    pol.ctx = None
    pol.__name__ = "leave-first"
    return pol
