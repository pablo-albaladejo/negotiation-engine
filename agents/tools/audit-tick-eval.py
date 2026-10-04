"""Per-tick evaluation of play.log: one line per tick with deltas and flags (FLAG:...).

Read-only. Run from the repo root:
  python3 -u agents/tools/audit-tick-eval.py [--date YYYY-MM-DD] [--from-end]
The date defaults to today (UTC, like the results/ folders).
"""
import re, time, os, sys, datetime

DATE = sys.argv[sys.argv.index("--date") + 1] if "--date" in sys.argv else datetime.datetime.now(datetime.timezone.utc).date().isoformat()
L = f"results/logs/{DATE}/play.log"
TICK = re.compile(r"== tick (\d+)")
prev = {}
RECENT = []
threads = {}  # thread -> (her, ours) last seen
DUELW, OURS = {}, {}
LASTDUEL = [None]  # duel whose "assumption: W P per day" line comes next


def evaluate(tick, lines):
    s = {}
    flags, acts = [], []
    for l in lines:
        m = re.search(r"  us: .*cash (-?\d+) P", l)
        if m: s["cash"] = int(m.group(1))
        m = re.search(r"  score: ([\d.]+) .*ladder ([\d.]+) · neg ([\d.]+) · duels ([\d.]+) · mm ([\d.]+) · deals (\d+) · rank (\d+)", l)
        if m: s.update(score=float(m.group(1)), ladder=float(m.group(2)), neg=float(m.group(3)), duels=float(m.group(4)), mm=float(m.group(5)), deals=int(m.group(6)), rank=int(m.group(7)))
        m = re.search(r"dealer (\w+): \[tick \d+\] · (\w+) · thread (\d+) · (\S+)(?: · her (\d+)(?: \(final\))? · ours (\d+))?(?: · rule (\S+))?", l)
        if m:
            dealer, act, th, tgt, her, ours, rule = m.groups()
            acts.append(f"{dealer}#{th} {act} {tgt}" + (f" her {her}/ours {ours}" if her else ""))
            if her and ours:
                her, ours = int(her), int(ours)
                p = threads.get(th)
                if p and p[0] == her and ours != p[1] and act == "counter":
                    flags.append(f"FLAG:one-sided-concession {dealer}#{th} her held {her}, we moved {p[1]}->{ours}")
                threads[th] = (her, ours)
        m = re.search(r"dealer (\w+): \[tick \d+\] · error · (\S+) · error (\S+)", l)
        if m: flags.append(f"FLAG:dealer-error {m.group(1)} {m.group(2)} {m.group(3)}")
        m = re.search(r"\[duels\] duel (\d+) \((\w+),.*?([\d.]+) P per day", l)
        if m: DUELW[m.group(1)] = float(m.group(3))
        m = re.search(r"\[duels\] message: duel (\d+): COUNTER (\d+) P day (\d+)", l)
        if m: OURS[m.group(1)] = (int(m.group(2)), int(m.group(3)))
        m = re.search(r"\s+assumption: ([\d.]+) P per day", l)
        if m and LASTDUEL[0]: DUELW[LASTDUEL[0]] = float(m.group(1))
        m = re.search(r"duel (\d+) · (\w+) · .*limit (\d+) · rival (\S+)(?: P/day (\d+))?", l)
        if m:
            did, role, lim, riv, rday = m.groups()
            LASTDUEL[0] = did
            lim = int(lim)
            w = DUELW.get(did)
            if w is None:
                acts.append(f"duel{did} {role} lim {lim} rival {riv}" + (f"/d{rday}" if rday else "") + " (w?)")
                continue
            def surplus(price, day):
                return (lim - price - w * day) if role == "buyer" else (price - lim + w * day)
            txt = f"duel{did} {role} lim {lim} rival {riv}" + (f"/d{rday}" if rday else "")
            if riv not in ("-",) and rday is not None:
                txt += f" real {surplus(int(riv), int(rday)):+.1f}"
            if did in OURS:
                sv = surplus(*OURS[did])
                txt += f" ours {OURS[did][0]}/d{OURS[did][1]} real {sv:+.1f}"
                if sv < 0: flags.append(f"FLAG:duel-own-offer-below-limit duel{did} {OURS[did][0]}/d{OURS[did][1]} real {sv:+.1f} (w {w})")
            acts.append(txt)
        m = re.search(r"→ (ACCEPT|COUNTER|WAIT)[^\[]*\((?:surplus [\d.]+, )?(?:round \d+, )?([\w-]+)\)", l)
        if m and m.group(1) != "WAIT": acts.append(f"{m.group(1)}({m.group(2)})")
        if re.search(r"failed:|Traceback|\bError\b", l) and "429" not in l and "rate_limited" not in l and "already_flagged" not in l:
            flags.append("FLAG:error " + l.strip()[:120])
        if re.search(r"(sell:1056|LAT-13|asset:1056)", l) and re.search(r"SELECTED|open|list|post|offer|accept", l) and "hidden cards" not in l and "to-me" not in l:
            flags.append("FLAG:HIDDEN-CARD-MOVE " + l.strip()[:120])
        if "SELECTED" in l and ":accept:" in l:
            acts.append(l.split("SELECTED", 1)[1].strip()[:70])
    d = []
    for k, fmt in (("score", "{:+.2f}"), ("ladder", "{:+.3f}"), ("neg", "{:+.1f}"), ("duels", "{:+.2f}"), ("cash", "{:+d}")):
        if k in s and k in prev and s[k] != prev[k]:
            d.append(f"{k} " + fmt.format(s[k] - prev[k]))
    own = [k for k in ("ladder", "neg", "duels", "mm") if k in s and k in prev and s[k] != prev[k]]
    if "score" in s and "score" in prev and s["score"] != prev["score"]:
        recent = sorted({k for t, k in RECENT if tick - t <= 15} | set(own))
        d.append("cause: ours (" + ",".join(recent) + ", score lags a few ticks)" if recent else "cause: field (our components flat)")
    RECENT.extend((tick, k) for k in own)
    if "rank" in s and "rank" in prev and s["rank"] != prev["rank"]:
        d.append(f"rank {prev['rank']}->{s['rank']}")
        if s["rank"] > prev["rank"]: flags.append(f"FLAG:rank-down {prev['rank']}->{s['rank']}")
    if "cash" in s and s["cash"] < 25: flags.append(f"FLAG:low-cash {s['cash']}")
    if "deals" in s and "deals" in prev and s["deals"] > prev["deals"] and s.get("score", 0) <= prev.get("score", 0) and s.get("ladder") == prev.get("ladder") and s.get("neg") == prev.get("neg") and s.get("duels") == prev.get("duels"):
        flags.append("FLAG:deal-scored-0")
    prev.update(s)
    head = f"t{tick} " + (f"{s['score']} r{s['rank']} cash {s.get('cash','?')} lad {s['ladder']}" if "score" in s else "(no score line)")
    if not d and not acts and not flags and tick % 10:
        return
    print(" | ".join([head] + (["Δ " + ", ".join(d)] if d else []) + acts[:9] + flags), flush=True)


with open(L, errors="ignore") as f0:
    for l0 in f0:
        m0 = re.search(r"\[duels\] duel (\d+) \((\w+),.*?([\d.]+) P per day", l0)
        if m0: DUELW[m0.group(1)] = float(m0.group(3))
        m0 = re.search(r"duel (\d+) · (?:buyer|seller) · ", l0)
        if m0: LASTDUEL[0] = m0.group(1)
        m0 = re.search(r"\s+assumption: ([\d.]+) P per day", l0)
        if m0 and LASTDUEL[0]: DUELW[LASTDUEL[0]] = float(m0.group(1))
pos = os.path.getsize(L) if "--from-end" in sys.argv else max(0, os.path.getsize(L) - 400000)
buf, cur = [], None
while True:
    with open(L, errors="ignore") as f:
        f.seek(pos)
        data = f.read()
        pos = f.tell()
    for l in data.splitlines():
        m = TICK.search(l)
        if m:
            if cur is not None and buf:
                evaluate(cur, buf)
            cur, buf = int(m.group(1)), []
        elif cur is not None:
            buf.append(l)
    time.sleep(5)
