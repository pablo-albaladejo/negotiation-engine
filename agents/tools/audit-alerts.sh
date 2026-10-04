#!/bin/bash
# Live alerts for the audit agent: one stdout line per event worth a look (read-only, tails local files).
# play.log crashes/errors, banco/picaros dealer actions, score-audit mismatches; clock pause, bench.finished,
# our venue opened/closed; HIGH/MEDIUM auditor lines; our settlements (team deals, big dealer buys, hidden card sold).
# Usage from the repo root: bash agents/tools/audit-alerts.sh [YYYY-MM-DD]   (default: today, UTC)
cd "$(dirname "$0")/../.." || exit 1
D=${1:-$(date -u +%Y-%m-%d)}
L=results/logs/$D/play.log
P=results/bazaar-live/$D/stream-public.jsonl
T=results/bazaar-live/$D/stream-team.jsonl
A=results/logs/$D/audit-standalone.log

(tail -n0 -F "$L" | grep --line-buffered -E "crash|exited|Error|dealer banco: \[tick|dealer picaros: \[tick|score audit: .*mismatch") &
(tail -n0 -F "$P" | grep --line-buffered -E '"clock.changed"|"bench.finished"|"venue.(opened|closed)".*"t02"' \
  | grep --line-buffered -oE '"paused":(true|false)|"type":"bench.finished"[^}]{0,200}|"type":"venue.(opened|closed)"[^}]{0,150}') &
(tail -n0 -F "$A" | grep --line-buffered -E "HIGH|MEDIUM" | grep --line-buffered -v "flags:flag:10") &
tail -n0 -F "$T" | python3 -u -c '
import sys, json
for l in sys.stdin:
    try: d = json.loads(l)["data"]
    except Exception: continue
    if d.get("type") != "settlement": continue
    p = d.get("payload", {}); parts = p.get("parties", [])
    if "t02" not in parts: continue
    items = p.get("items", [])
    if any(i.get("print_run") == 1 or i.get("ref") == "LAT-13" for i in items if i.get("frm") == "t02"):
        print("HIDDEN-CARD-SOLD", d["tick"], items, flush=True)
    if p.get("persona") and p.get("price", 0) >= 60 and any(i.get("to") == "t02" for i in items):
        print("BIG-DEALER-BUY", d["tick"], p.get("persona"), p.get("price"), [i["ref"] for i in items], flush=True)
    if not p.get("persona"):
        print("TEAM-DEAL", d["tick"], parts, "@" + str(p.get("price")), [(i["ref"], i["frm"], i["to"]) for i in items], flush=True)
'
