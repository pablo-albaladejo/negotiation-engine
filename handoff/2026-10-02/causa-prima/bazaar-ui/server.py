#!/usr/bin/env python3
"""Read-only web UI server for our team's Bazaar conversations.

Serves a static index.html plus a single /api/data JSON endpoint that
aggregates the live Bazaar API with our local negotiation traces.

Security: the team key (BAZAAR_KEY) is read from the environment or from
negotiation-ring/.env, kept only in memory, used solely as the X-Team-Key
header on outbound GET requests to bazaar.causaprima.ai, and is never
logged, written to disk, or included in any response this server returns.
"""
import json
import os
import socket
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
CACHE_DIR = BASE_DIR / "cache"
CACHE_DIR.mkdir(exist_ok=True)

API_BASE = "https://bazaar.causaprima.ai"
TRACES_ROOT = Path("/Users/pablo/development/hackathon/negotiation-ring/results/bazaar-live")
ENV_FALLBACK = Path("/Users/pablo/development/hackathon/negotiation-ring/.env")
SNAPSHOTS_PATH = Path(
    "/Users/pablo/development/hackathon/causa-prima/bazaar-sim/monitor/data/snapshots.jsonl"
)

HOST = "127.0.0.1"
DEFAULT_PORT = 5310
FALLBACK_PORT = 5311


def load_key():
    k = os.environ.get("BAZAAR_KEY")
    if k:
        return k.strip()
    try:
        for line in ENV_FALLBACK.read_text().splitlines():
            line = line.strip()
            if line.startswith("BAZAAR_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return None


TEAM_KEY = load_key()
if not TEAM_KEY:
    print("ERROR: BAZAAR_KEY not found (env or negotiation-ring/.env)", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Rate-limited, cached fetcher (<= ~4.5 req/s to the Bazaar API, 5s cache)
# ---------------------------------------------------------------------------
_api_lock = threading.Lock()
_last_call_ts = 0.0
_MIN_INTERVAL = 0.22
_mem_cache = {}
_MEM_TTL = 5.0


def api_get(path):
    now = time.time()
    cached = _mem_cache.get(path)
    if cached and now - cached[0] < _MEM_TTL:
        return cached[1]
    global _last_call_ts
    with _api_lock:
        wait = _MIN_INTERVAL - (time.time() - _last_call_ts)
        if wait > 0:
            time.sleep(wait)
        req = urllib.request.Request(API_BASE + path, headers={"X-Team-Key": TEAM_KEY})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            data = {"_error": f"http_{e.code}"}
        except Exception as e:
            data = {"_error": type(e).__name__}
        _last_call_ts = time.time()
    _mem_cache[path] = (time.time(), data)
    return data


def value_for_card(ref):
    if not ref:
        return None
    safe = "".join(c if c.isalnum() or c in "-_." else "_" for c in ref)
    cache_file = CACHE_DIR / f"value_{safe}.json"
    if cache_file.exists():
        try:
            return json.loads(cache_file.read_text()).get("your_value")
        except Exception:
            pass
    data = api_get(f"/api/me/value?card={urllib.parse.quote(ref)}")
    val = data.get("your_value")
    if val is not None:
        cache_file.write_text(json.dumps({"card": ref, "your_value": val}))
    return val


# ---------------------------------------------------------------------------
# Local trace loading
# ---------------------------------------------------------------------------
def newest_date_dir():
    if not TRACES_ROOT.exists():
        return None
    dirs = [d for d in TRACES_ROOT.iterdir() if d.is_dir()]
    if not dirs:
        return None
    return sorted(dirs, key=lambda d: d.name)[-1]


def load_jsonl(path):
    rows = []
    if not path.exists():
        return rows
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except Exception:
            continue
    return rows


def load_local_traces():
    d = newest_date_dir()
    if d is None:
        return {"decisions": [], "score": [], "date_dir": None}
    return {
        "decisions": load_jsonl(d / "decisions.jsonl"),
        "score": load_jsonl(d / "score.jsonl"),
        "date_dir": d.name,
    }


def load_leaderboard_history():
    rows = []
    if not SNAPSHOTS_PATH.exists():
        return rows
    try:
        with SNAPSHOTS_PATH.open() as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    row = json.loads(line)
                except Exception:
                    continue
                if row.get("endpoint") == "leaderboard" and row.get("status") == 200:
                    body = row.get("body") or {}
                    rows.append({"tick": body.get("tick"), "teams": body.get("teams", [])})
    except Exception:
        pass
    return rows


# ---------------------------------------------------------------------------
# Conversation building
# ---------------------------------------------------------------------------
def build_score_by_thread(score_rows):
    by_thread = {}
    for row in score_rows:
        for c in row.get("cause") or []:
            tid = c.get("thread")
            if tid is None:
                continue
            by_thread.setdefault(tid, []).append(
                {
                    "tick": row.get("tick"),
                    "neg_delta": (row.get("delta") or {}).get("neg_points", 0),
                    "ladder_delta": (row.get("delta") or {}).get("ladder_points", 0),
                }
            )
    return by_thread


def build_decisions_by_thread(decisions):
    by_thread = {}
    for d in decisions:
        tid = d.get("thread")
        if tid is None:
            continue
        by_thread.setdefault(tid, []).append(d)
    for v in by_thread.values():
        v.sort(key=lambda d: d.get("tick", 0))
    return by_thread


def find_settled_offer(thread):
    for msg in reversed(thread.get("messages", [])):
        offer = msg.get("offer")
        if offer and offer.get("status") == "settled":
            return offer
    return None


def find_any_offer(thread):
    for msg in reversed(thread.get("messages", [])):
        if msg.get("offer"):
            return msg["offer"]
    return None


def determine_side(thread, our_team):
    topic = thread.get("topic") or {}
    if "buy" in topic:
        return "buy"
    if "sell" in topic:
        return "sell"
    offer = find_settled_offer(thread) or find_any_offer(thread)
    if offer:
        give = offer.get("give", {}) or {}
        want = offer.get("want", {}) or {}
        maker = offer.get("maker")
        if maker == our_team:
            if give.get("assets") or any(t.startswith("card:") for t in give.get("types", [])):
                return "sell"
            if give.get("cash"):
                return "buy"
        else:
            if want.get("assets") or any(t.startswith("card:") for t in want.get("types", [])):
                return "buy"
            if want.get("cash"):
                return "sell"
    return "unknown"


def price_from_offer(offer):
    if not offer:
        return None
    give = offer.get("give", {}) or {}
    want = offer.get("want", {}) or {}
    if give.get("cash"):
        return give["cash"]
    if want.get("cash"):
        return want["cash"]
    return None


def extract_card_ref(thread):
    offer = find_settled_offer(thread) or find_any_offer(thread)
    if offer:
        for side in (offer.get("give", {}), offer.get("want", {})):
            for a in side.get("assets", []) or []:
                if a.get("ref"):
                    return a["ref"]
            for t in side.get("types", []) or []:
                if t.startswith("card:"):
                    return t.split(":", 1)[1]
    return None


def compute_value_and_surplus(thread_id, side, price, thread, score_by_thread, decisions_by_thread):
    """Precedence:
    - sells and specific-card buys (topic buy.card): decisions.jsonl reservation first
    - random buys (topic buy by rarity/set): score delta.neg_points, but ONLY when
      non-zero (a zero delta means "no booking yet", not "value == price"); else the
      cached /api/me/value of the received card
    - delta_neg / delta_ladder columns always reflect the real score.jsonl numbers
      (possibly zero), independent of which source produced our_value.
    """
    rows = score_by_thread.get(thread_id)
    delta_neg = rows[0]["neg_delta"] if rows else None
    delta_ladder = rows[0]["ladder_delta"] if rows else None
    score_tick = rows[0]["tick"] if rows else None

    topic = thread.get("topic") or {}
    buy_topic = topic.get("buy") if isinstance(topic.get("buy"), dict) else None
    is_specific_or_sell = ("sell" in topic) or (buy_topic is not None and "card" in buy_topic)
    is_random_buy = buy_topic is not None and "card" not in buy_topic

    def from_reservation():
        drows = decisions_by_thread.get(thread_id)
        if not drows:
            return None
        for d in reversed(drows):
            summary_val = (d.get("summary") or {}).get("ourValue")
            res = summary_val if summary_val is not None else d.get("effectiveReservation", d.get("reservation"))
            if res is not None:
                surplus = None
                if price is not None and side == "buy":
                    surplus = round(res - price, 3)
                elif price is not None and side == "sell":
                    surplus = round(price - res, 3)
                return res, surplus, "reservation"
        return None

    def from_score():
        if rows and price is not None and rows[0]["neg_delta"]:
            surplus = round(rows[0]["neg_delta"], 3)
            if side == "buy":
                our_value = round(price + surplus, 3)
            elif side == "sell":
                our_value = round(price - surplus, 3)
            else:
                our_value = None
            return our_value, surplus, "score"
        return None

    def from_live_value():
        card_ref = extract_card_ref(thread)
        if not card_ref or price is None:
            return None
        val = value_for_card(card_ref)
        if val is None:
            return None
        surplus = round(val - price, 3) if side == "buy" else round(price - val, 3)
        return val, surplus, "live_value"

    if is_specific_or_sell:
        result = from_reservation() or from_score() or from_live_value()
    elif is_random_buy:
        result = from_score() or from_live_value() or from_reservation()
    else:
        result = from_reservation() or from_score() or from_live_value()

    if result is None:
        return None, None, delta_neg, delta_ladder, score_tick, None
    our_value, surplus, source = result
    return our_value, surplus, delta_neg, delta_ladder, score_tick, source


def verdict_for(surplus):
    if surplus is None:
        return None
    if surplus >= 1:
        return "good"
    if surplus <= -1:
        return "bad"
    return "neutral"


def score_delta_after_tick(history, team_id, settle_tick):
    if settle_tick is None or not history:
        return None
    hist_sorted = sorted((h for h in history if h.get("tick") is not None), key=lambda h: h["tick"])
    prev_score = None
    for h in hist_sorted:
        team_row = next((t for t in h.get("teams", []) if t.get("team") == team_id), None)
        score = team_row.get("score") if team_row else None
        if h["tick"] > settle_tick and score is not None:
            if prev_score is not None:
                return round(score - prev_score, 3)
            return None
        if score is not None:
            prev_score = score
    return None


def build_thread_row(thread, our_team, score_by_thread, decisions_by_thread):
    tid = thread["id"]
    kind = "dealer" if thread.get("kind") == "persona" else "team"
    item = thread.get("item")
    if not item:
        topic = thread.get("topic") or {}
        item = json.dumps(topic) if topic else None
    side = determine_side(thread, our_team)
    offer = find_settled_offer(thread)
    price = price_from_offer(offer)
    messages = thread.get("messages", [])
    status = thread.get("status")
    settled_tick = messages[-1]["tick"] if messages and status != "open" else None
    our_value, surplus, delta_neg, delta_ladder, score_tick, source = compute_value_and_surplus(
        tid, side, price, thread, score_by_thread, decisions_by_thread
    )
    return {
        "id": tid,
        "kind": kind,
        "counterparty": thread.get("with"),
        "item": item,
        "side": side,
        "status": status,
        "closed_reason": thread.get("closed_reason"),
        "opened_tick": thread.get("created_tick"),
        "settled_tick": settled_tick if settled_tick is not None else score_tick,
        "price": price,
        "our_value": our_value,
        "surplus": surplus,
        "verdict": verdict_for(surplus),
        "delta_neg": delta_neg,
        "delta_ladder": delta_ladder,
        "delta_score": None,
        "messages": messages,
        "standing_offers": thread.get("standing_offers", []),
        "decisions": decisions_by_thread.get(tid, []),
        "value_source": source,
    }


def build_duel_row(duel):
    did = duel.get("duel")
    side = duel.get("role")
    price = duel.get("price")
    if price is None:
        price = (duel.get("your_offer") or {}).get("price")
    our_value = duel.get("your_limit")
    surplus = None
    if price is not None and our_value is not None:
        if side == "buyer":
            surplus = round(our_value - price, 3)
        elif side == "seller":
            surplus = round(price - our_value, 3)
    status = duel.get("status")
    msgs = [
        {"sender": m.get("from"), "tick": m.get("tick"), "text": m.get("text"), "price": m.get("price")}
        for m in duel.get("messages", [])
    ]
    return {
        "id": f"duel-{did}",
        "kind": "duel",
        "counterparty": duel.get("rival"),
        "item": duel.get("item"),
        "side": side,
        "status": status,
        "closed_reason": duel.get("result"),
        "opened_tick": None,
        "settled_tick": duel.get("deadline_tick") if status != "live" else None,
        "price": price,
        "our_value": our_value,
        "surplus": surplus,
        "verdict": verdict_for(surplus),
        "delta_neg": None,
        "delta_ladder": None,
        "delta_score": None,
        "messages": msgs,
        "standing_offers": [],
        "decisions": [],
        "value_source": "vs limit" if our_value is not None else None,
    }


def build_field_moved_rows(score_rows):
    rows = []
    for row in score_rows:
        if row.get("cause"):
            continue
        delta = row.get("delta") or {}
        if not delta.get("score"):
            continue
        rows.append(
            {
                "id": f"field-{row.get('tick')}",
                "kind": "field moved",
                "counterparty": None,
                "item": None,
                "side": None,
                "status": None,
                "closed_reason": None,
                "opened_tick": row.get("tick"),
                "settled_tick": row.get("tick"),
                "price": None,
                "our_value": None,
                "surplus": None,
                "verdict": None,
                "delta_neg": delta.get("neg_points"),
                "delta_ladder": delta.get("ladder_points"),
                "delta_score": delta.get("score"),
                "messages": [],
                "standing_offers": [],
                "decisions": [],
                "value_source": None,
            }
        )
    return rows


def build_full_data():
    me = api_get("/api/me")
    threads_resp = api_get("/api/me/threads")
    duels_resp = api_get("/api/duels")
    clock = api_get("/api/clock")
    feed = api_get("/api/feed?limit=100")
    rastro = api_get("/api/venues/rastro/offers")
    leaderboard = api_get("/api/leaderboard")

    our_team = me.get("id")
    traces = load_local_traces()
    score_by_thread = build_score_by_thread(traces["score"])
    decisions_by_thread = build_decisions_by_thread(traces["decisions"])
    history = load_leaderboard_history()

    conversations = []
    for th in threads_resp.get("threads", []) if isinstance(threads_resp, dict) else []:
        conversations.append(build_thread_row(th, our_team, score_by_thread, decisions_by_thread))
    for d in duels_resp.get("duels", []) if isinstance(duels_resp, dict) else []:
        conversations.append(build_duel_row(d))
    conversations.extend(build_field_moved_rows(traces["score"]))

    for row in conversations:
        if row["kind"] != "field moved" and row.get("settled_tick") is not None:
            row["delta_score"] = score_delta_after_tick(history, our_team, row["settled_tick"])

    conversations.sort(key=lambda r: (r.get("opened_tick") if r.get("opened_tick") is not None else (r.get("settled_tick") or 0)))

    return {
        "clock": clock if not clock.get("_error") else None,
        "me": me if not me.get("_error") else None,
        "conversations": conversations,
        "leaderboard": leaderboard if not leaderboard.get("_error") else None,
        "feed": (feed.get("events") or [])[-20:] if isinstance(feed, dict) and not feed.get("_error") else [],
        "rastro": rastro.get("offers", []) if isinstance(rastro, dict) and not rastro.get("_error") else [],
        "trace_date": traces["date_dir"],
        "generated_at": time.time(),
    }


# ---------------------------------------------------------------------------
# HTTP server
# ---------------------------------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # keep default stdio quiet (also never risks logging secrets)

    def _send_json(self, obj, status=200):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/" or parsed.path == "/index.html":
            index_path = BASE_DIR / "index.html"
            body = index_path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if parsed.path == "/api/data":
            try:
                data = build_full_data()
                self._send_json(data)
            except Exception as e:
                self._send_json({"error": type(e).__name__}, status=500)
            return
        self.send_response(404)
        self.end_headers()


def port_is_free(port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind((HOST, port))
        return True
    except OSError:
        return False
    finally:
        s.close()


def main():
    port = DEFAULT_PORT if port_is_free(DEFAULT_PORT) else FALLBACK_PORT
    if port != DEFAULT_PORT:
        print(f"Port {DEFAULT_PORT} busy, using {FALLBACK_PORT} instead.")
    server = ThreadingHTTPServer((HOST, port), Handler)
    print(f"Bazaar UI serving on http://{HOST}:{port}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
