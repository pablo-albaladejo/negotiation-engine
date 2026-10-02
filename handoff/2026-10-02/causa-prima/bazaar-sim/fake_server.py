"""Servidor local que imita la parte de la API de The Bazaar que usa la Abuela, para probar
vuestro agente real (el mismo código y el mismo bazaar_sdk.py) sin gastar tratos ni cuota.

    python3 fake_server.py --port 8765 --tick 1        # tick de 1 s (el viernes real es 60 s)
    BAZAAR_URL=http://localhost:8765 BAZAAR_KEY=tk-local python3 starter_agent.py

Rutas: /api/clock, /api/me, /api/me/value, /api/catalog, /api/dealers, /api/threads (POST),
/api/threads/{id} (GET), /api/threads/{id}/messages (POST), /api/threads/{id}/close (POST),
/api/offers/{id}/accept (POST), /api/offers (POST, solo lo registra), /api/packs/{id}/open (POST),
/api/sim/stats (GET, resultados de la simulación: límite secreto y captura de cada conversación).
Reglas que aplica: 1 mensaje por conversación y tick, 1 aceptación por tick (429 wait_for_tick),
una conversación abierta con la Abuela a la vez, 3 sobres por hora de juego, insufficient_cash.
Diferencias con el real: el trato se liquida al aceptar (el real, en el siguiente tick); los valores
de cartas y sobres son inventados.
"""
from __future__ import annotations

import argparse
import json
import random
import re
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from abuela_model import Conversation, MENU, TRAITS

SETS = ["LAV", "MAL", "LAT", "SAL"]
RARITY_BOOK = {"common": 8, "uncommon": 20, "rare": 55}


class World:
    def __init__(self, tick: float, seed: int):
        self.tick_s, self.t0, self.rng = tick, time.time(), random.Random(seed)
        self.cash, self.assets, self.next_asset = 400, [], 1
        self.threads: dict[int, dict] = {}
        self.next_thread = 1
        self.last_msg: dict[int, int] = {}
        self.last_accept = -1
        self.packs_bought: dict[int, int] = {}
        for r, n in (("common", 11), ("uncommon", 3), ("rare", 1)):
            for _ in range(n):
                self._card(r)

    def tick(self) -> int:
        return int((time.time() - self.t0) / self.tick_s)

    def hour(self) -> int:
        return self.tick() // 60  # hipótesis: 60 ticks = 1 hora de juego

    def _card(self, rarity):
        s = self.rng.choice(SETS)
        n = self.rng.randint(1, {"common": 5, "uncommon": 3, "rare": 2}[rarity])
        run = {"common": 300, "uncommon": 90, "rare": 30}[rarity]
        a = {"id": self.next_asset, "kind": "card", "ref": f"{s}-{n:02d}", "name": f"{s}-{n:02d}", "rarity": rarity,
             "serial": self.rng.randint(1, run), "print_run": run,
             "your_value": round(RARITY_BOOK[rarity] * self.rng.uniform(0.6, 1.6))}
        self.next_asset += 1
        self.assets.append(a)
        return a


W: World


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body):
        raw = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _err(self, code, err, msg, **extra):
        self._send(code, {"error": err, "message": msg, **extra})

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        return json.loads(self.rfile.read(n) or b"{}") if n else {}

    def _clock(self):
        t = W.tick()
        return {"tick": t, "tick_seconds": W.tick_s, "paused": False,
                "next_tick_in": round(W.tick_s - ((time.time() - W.t0) % W.tick_s), 3),
                "limits": {"accepts_per_team_per_tick": 1, "messages_per_side_per_tick": 1,
                           "max_open_threads_per_team": 6, "max_open_offers_per_team": 30, "offers_per_team_per_tick": 12}}

    def _thread_json(self, tid):
        th = W.threads[tid]
        c: Conversation = th["conv"]
        return {"id": tid, "with": "abuela", "topic": th["topic"], "status": c.status, "closed_reason": c.closed_reason,
                "messages": [{"id": tid * 1000 + i, **m} for i, m in enumerate(c.messages)],
                "standing_offers": [{"id": tid * 1000 + o.id, "maker": "abuela" if o.maker == "abuela" else "you",
                                     "status": o.status, "final": o.final,
                                     "want": {"cash": o.price} if c.side == "sell" and o.maker == "abuela" else {"cash": 0},
                                     "give": {"cash": o.price} if c.side == "buy" and o.maker == "abuela" else {"cash": 0},
                                     "price": o.price} for o in c.offers]}

    def do_GET(self):
        path, _, q = self.path.partition("?")
        if path == "/api/clock":
            return self._send(200, self._clock())
        if path == "/api/me":
            return self._send(200, {"name": "Equipo 2 (local)", "cash": W.cash, "level": 1, "assets": W.assets,
                                    "score": {"score": 0, "rank": None}})
        if path == "/api/me/value":
            return self._send(200, {"card": q.split("=")[-1], "your_value": 10})
        if path == "/api/catalog":
            return self._send(200, {"currency_symbol": "P", "packs": [{"id": "sobre_barrio", "expected_book": 32}],
                                    "sets": [{"id": s, "cards": [{"id": f"{s}-{i:02d}", "book": 8} for i in range(1, 13)]} for s in SETS]})
        if path == "/api/dealers":
            return self._send(200, {"personas": [{"id": "abuela", "name": "Abuela Carmen (local)", "level": 1,
                                                  "traits": TRAITS, "menu": {str(k): v for k, v in MENU.items()}}]})
        if path == "/api/sim/stats":
            rows = [{"thread": tid, "item": th["topic"], "status": th["conv"].status, "opening": th["conv"].opening,
                     "secret_limit": th["conv"].limit, "price": th["conv"].deal_price, "rounds": th["conv"].rounds,
                     "capture": round(th["conv"].capture(), 3), "negotiated": th["conv"].negotiated()}
                    for tid, th in W.threads.items()]
            return self._send(200, {"threads": rows})
        m = re.fullmatch(r"/api/threads/(\d+)", path)
        if m and int(m[1]) in W.threads:
            return self._send(200, self._thread_json(int(m[1])))
        self._err(404, "not_found", path)

    def do_POST(self):
        path, b = self.path.split("?")[0], self._body()
        if path == "/api/threads":
            if b.get("with") != "abuela":
                return self._err(404, "unknown_dealer", "Solo la Abuela existe en local")
            if any(th["conv"].status == "open" for th in W.threads.values()):
                return self._err(409, "thread_open", "Ya tienes una conversación abierta con la Abuela")
            topic = b.get("topic") or {}
            side, spec = ("sell", topic["buy"]) if "buy" in topic else ("buy", topic.get("sell", {}))
            item = "pack" if "pack" in spec else spec.get("rarity", "common")
            if side == "buy" and "assets" in spec:
                a = next((x for x in W.assets if x["id"] in spec["assets"]), None)
                item = a["rarity"] if a else "common"
            if (side, item) not in MENU:
                return self._err(400, "not_on_menu", f"La Abuela no {'vende' if side == 'sell' else 'compra'} {item}")
            if item == "pack" and W.packs_bought.get(W.hour(), 0) >= 3:
                return self._err(429, "persona_quota", "3 sobres por hora")
            tid = W.next_thread
            W.next_thread += 1
            W.threads[tid] = {"topic": topic, "conv": Conversation(side, item, rng=random.Random(W.rng.random())),
                              "assets": spec.get("assets", [])}
            return self._send(200, self._thread_json(tid))
        m = re.fullmatch(r"/api/threads/(\d+)/(messages|close)", path)
        if m and int(m[1]) in W.threads:
            tid, th = int(m[1]), W.threads[int(m[1])]
            c: Conversation = th["conv"]
            if m[2] == "close":
                c._close("closed", "team_closed")
                return self._send(200, self._thread_json(tid))
            if c.status != "open":
                return self._err(409, "thread_closed", c.closed_reason or "closed")
            if W.last_msg.get(tid) == W.tick():
                return self._err(429, "wait_for_tick", "Un mensaje por conversación y tick", next_tick=W.tick() + 1)
            price = b.get("price")
            if price is not None and c.side == "sell" and price > W.cash:
                return self._err(400, "insufficient_cash", "No tienes tanto")
            W.last_msg[tid] = W.tick()
            c.say(b.get("text", ""), price)
            self._settle(tid)
            return self._send(200, self._thread_json(tid))
        m = re.fullmatch(r"/api/offers/(\d+)/accept", path)
        if m:
            oid = int(m[1])
            tid, local = divmod(oid, 1000)
            if tid not in W.threads:
                return self._err(404, "not_found", "oferta")
            if W.last_accept == W.tick():
                return self._err(429, "wait_for_tick", "Una aceptación por tick", next_tick=W.tick() + 1)
            c: Conversation = W.threads[tid]["conv"]
            o = next((o for o in c.offers if o.id == local), None)
            if c.side == "sell" and o and o.price > W.cash:
                return self._err(400, "insufficient_cash", "No tienes tanto")
            try:
                c.accept(local)
            except ValueError as e:
                return self._err(409, str(e), "La oferta ya no está abierta")
            W.last_accept = W.tick()
            self._settle(tid)
            return self._send(200, {"ok": True, "settles_at_tick": W.tick() + 1})
        if path == "/api/offers":
            return self._send(200, {"id": 999999, "status": "open", "note": "registrada en local, no se cruza"})
        m = re.fullmatch(r"/api/packs/(\d+)/open", path)
        if m:
            a = next((x for x in W.assets if x["id"] == int(m[1]) and x["kind"] == "pack"), None)
            if not a:
                return self._err(404, "not_owner", "No tienes ese sobre")
            W.assets.remove(a)
            cards = [W._card(r) for r in ("common", "common", "common", "uncommon", W.rng.choice(["uncommon", "rare"]))]
            return self._send(200, {"cards": cards, "luck": 0})
        self._err(404, "not_found", path)

    def _settle(self, tid):
        th = W.threads[tid]
        c: Conversation = th["conv"]
        if c.status != "deal" or th.get("settled"):
            return
        th["settled"] = True
        if c.side == "sell":
            W.cash -= c.deal_price
            if c.item == "pack":
                W.packs_bought[W.hour()] = W.packs_bought.get(W.hour(), 0) + 1
                W.assets.append({"id": W.next_asset, "kind": "pack", "ref": "sobre_barrio", "name": "Sobre de barrio",
                                 "your_value": 32})
                W.next_asset += 1
            else:
                W._card(c.item)
        else:
            W.cash += c.deal_price
            W.assets = [a for a in W.assets if a["id"] not in th["assets"]]


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--tick", type=float, default=1.0, help="segundos por tick (real: 60 vie, 30 sáb, 15 dom)")
    ap.add_argument("--seed", type=int, default=1)
    a = ap.parse_args()
    W = World(a.tick, a.seed)
    print(f"Abuela local en http://localhost:{a.port} · tick {a.tick} s · resultados en /api/sim/stats")
    ThreadingHTTPServer(("127.0.0.1", a.port), H).serve_forever()
