"""Load recorded bench sessions (post-auto book snapshots) from bench.jsonl + bench-raw.jsonl."""
import json
from datetime import datetime
import os
# Day folder with the recorded sessions; defaults to 3 Oct (h3-h13) relative to the repo root.
D = os.environ.get("BENCH_DAY_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../results/bazaar-live/2026-10-03"))
OFFICIAL = {}  # start_tick -> (session, eff, matches)
for l in open(D + "/stream-team.jsonl"):
    if '"bench.' not in l:
        continue
    d = json.loads(l)
    p = d["data"]["payload"]
    if d["event"] == "bench.started":
        OFFICIAL.setdefault(p["start_tick"], {})["session"] = p["session"]
    elif d["event"] == "bench.finished":
        for st, o in OFFICIAL.items():
            if o.get("session") == p["session"]:
                o.update(eff=p["efficiency"], auto=p["auto_baseline"], matches=p["matches"])


def load(include_live=False):
    """start_tick -> {'snaps': {age: {id: (side, quote)}}, official...}; age = tick - start."""
    snaps, venue = {}, {}
    for fn, kind in (("bench.jsonl", "bench"), ("bench-raw.jsonl", "raw")):
        for l in open(f"{D}/{fn}"):
            r = json.loads(l)
            st = max([s for s in OFFICIAL if s <= r["tick"] + 1], default=None)
            if st is None:
                continue
            if kind == "bench":
                book = {b["id"]: (b["side"], b["quote"]) for b in r["bench"]}
            else:
                book = {}
                for o in r["raw"].get("bench_offers", []):
                    if o["want"].get("cash"):
                        book[o["id"]] = ("ask", o["want"]["cash"])
                    else:
                        book[o["id"]] = ("bid", o["give"]["cash"])
            snaps.setdefault(st, {}).setdefault(kind, []).append((r["tick"], r["ts"], book))
            if kind == "raw":
                venue[st] = r["raw"].get("venue")
    out = {}
    for st, kinds in sorted(snaps.items()):
        if "auto" not in OFFICIAL[st] and not include_live:
            continue
        # prefer bench.jsonl; label lag: force strictly increasing ages in file order
        src = kinds.get("bench") or kinds.get("raw")
        # same tick label twice: < 15 s apart = a re-poll within the tick (keep the later, post-match book);
        # otherwise the label lagged: the later record is the next tick
        S, prev_age, prev_ts = {}, None, None
        for tick, ts, book in src:
            t = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            age = tick - st
            if prev_age is not None and age <= prev_age:
                age = prev_age if (t - prev_ts).total_seconds() < 15 else prev_age + 1
            S[age] = book
            prev_age, prev_ts = age, t
        out[st] = dict(snaps=S, venue=venue.get(st), **OFFICIAL[st])
    return out


def traders(S):
    tr = {}
    for age in sorted(S["snaps"]):
        for i, (side, q) in S["snaps"][age].items():
            x = tr.setdefault(i, {"id": i, "side": side, "path": {}})
            x["path"][age] = q
    return tr


if __name__ == "__main__":
    for st, S in load().items():
        print(f"== start {st} session {S['session']} eff {S['eff']} auto {S['auto']} matches {S['matches']} ages {sorted(S['snaps'])}")
        tr = traders(S)
        for x in sorted(tr.values(), key=lambda x: (x["side"], min(x["path"]))):
            ks = sorted(x["path"])
            print(f"   {x['id']:7} {x['side']} a{ks[0]:>2}-{ks[-1]:>2} {[x['path'][k] for k in ks]}")
