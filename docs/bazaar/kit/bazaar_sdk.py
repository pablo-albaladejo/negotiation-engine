"""The Bazaar SDK: one small class per key, Python standard library only.

    from bazaar_sdk import Bazaar
    b = Bazaar("https://bazaar.causaprima.ai", "tk-xxxx-xxxx")
    print(b.me()["cash"])

Every method maps to one HTTP route and returns the parsed JSON. A refused request raises
BazaarError with the server's machine-readable code ("wait_for_tick", "insufficient_cash",
"self_venue", ...). Two throttles are handled for you:

  rate_limited   more than 5 requests per second: short pause, then retry
  wait_for_tick  one message per thread and one acceptance per team per tick: sleep until the next
                 tick, then retry (pass wait_on_tick=False to handle it yourself, as agents that run
                 many threads should)

Words persuade, structure binds: text is free, only a structured offer accepted by its counterparty
moves cards or cash, and it settles on the next tick.
"""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Optional

__all__ = ["Bazaar", "Broker", "BazaarError"]
__version__ = "0.2"


class BazaarError(Exception):
    """A refused request. `code` is the server's reason, `status` the HTTP status (0 = no response)."""

    def __init__(self, code: str, message: str = "", status: int = 0, extra: Optional[dict] = None):
        super().__init__(f"{code}: {message}" if message else code)
        self.code = code
        self.message = message
        self.status = status
        self.extra = extra or {}


class _Http:
    def __init__(self, url: str, headers: dict, timeout: float, wait_on_tick: bool, retries: int):
        self.url = url.rstrip("/")
        self._headers = headers
        self.timeout = timeout
        self.wait_on_tick = wait_on_tick
        self.retries = retries

    def _call(self, method: str, path: str, body: Any = None, query: Optional[dict] = None) -> Any:
        url = self.url + path
        if query:
            q = {k: ("true" if v is True else "false" if v is False else v) for k, v in query.items() if v is not None}
            if q:
                url += "?" + urllib.parse.urlencode(q)
        data = None if body is None else json.dumps(body).encode("utf-8")
        headers = {**self._headers, "Accept": "application/json"}
        if data is not None:
            headers["Content-Type"] = "application/json"
        attempt = 0
        while True:
            req = urllib.request.Request(url, data=data, method=method, headers=headers)
            try:
                with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                    raw = resp.read()
                return json.loads(raw) if raw else {}
            except urllib.error.HTTPError as e:
                err = _error_from(e)
            except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as e:
                err = BazaarError("network", f"{method} {path}: {e}", 0)
                if method != "GET":  # a write may have landed; never repeat it blindly
                    raise err from None
            except json.JSONDecodeError as e:
                raise BazaarError("bad_response", f"{method} {path}: not JSON ({e})", 0) from None
            attempt += 1
            if attempt > self.retries:
                raise err
            if err.code == "rate_limited":
                time.sleep(0.25 * attempt)
            elif err.code == "network":
                time.sleep(0.5 * attempt)
            elif err.code == "wait_for_tick" and self.wait_on_tick:
                self._sleep_until_next_tick()
            else:
                raise err

    def _sleep_until_next_tick(self) -> None:
        try:
            with urllib.request.urlopen(self.url + "/api/clock", timeout=self.timeout) as resp:
                wait = float(json.loads(resp.read()).get("next_tick_in", 1.0))
        except Exception:
            wait = 1.0
        time.sleep(min(65.0, max(0.05, wait)) + 0.2)


def _error_from(e: urllib.error.HTTPError) -> BazaarError:
    try:
        body = json.loads(e.read() or b"{}")
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {"detail": body}
    code = body.get("error") or ("invalid" if e.code == 422 else f"http_{e.code}")
    message = body.get("message") or (json.dumps(body["detail"])[:500] if "detail" in body else e.reason)
    extra = {k: v for k, v in body.items() if k not in ("error", "message")}
    return BazaarError(str(code), str(message), e.code, extra)


class Bazaar(_Http):
    """A team's connection. `key` is the team key (header X-Team-Key)."""

    def __init__(self, url: str, key: str, *, timeout: float = 15.0, wait_on_tick: bool = True, retries: int = 3):
        super().__init__(url, {"X-Team-Key": key}, timeout, wait_on_tick, retries)
        self.key = key

    # ------------------------------------------------------------------ public (no key needed)

    def health(self) -> dict:
        return self._call("GET", "/api/health")

    def clock(self) -> dict:
        """tick, t_hours, tick_seconds, paused, next_tick_in (seconds)."""
        return self._call("GET", "/api/clock")

    def catalog(self) -> dict:
        """Sets, cards (book value, print run, minted), packs (slot odds, expected_book), value rules."""
        return self._call("GET", "/api/catalog")

    def leaderboard(self) -> dict:
        return self._call("GET", "/api/leaderboard")

    def feed(self, limit: int = 150) -> dict:
        """Recent public events: settlements, packs opened, unlocks, venue news."""
        return self._call("GET", "/api/feed", query={"limit": limit})

    def schedule(self) -> dict:
        """Upcoming levers on the public clock: duels, bench sessions, dealer openings, set releases."""
        return self._call("GET", "/api/schedule")

    def dealers(self) -> dict:
        """The card dealers in play (level, traits, unlock rule, menu) and the announced ones (name and a line)."""
        return self._call("GET", "/api/dealers")

    def dealer(self, dealer_id: str) -> dict:
        """One dealer, as dealers() lists it ("abuela")."""
        return self._call("GET", f"/api/dealers/{dealer_id}")

    personas = dealers  # the old name, for old code

    def levels(self) -> dict:
        """What the organisers have revealed: announced levels (name and a line) and active ones, each with `how`,
        a sentence on how to use it. New dealers and mechanics appear here during the weekend."""
        return self._call("GET", "/api/levels")

    def call(self, method: str, path: str, body: Optional[dict] = None) -> dict:
        """Any route, for the ones a level brings after you wrote your agent: b.call("GET", "/api/...")."""
        return self._call(method, path, body)

    def venues(self) -> dict:
        """Open markets: the house market (El Rastro) and team venues, with fees and activity."""
        return self._call("GET", "/api/venues")

    def board(self, venue: str = "rastro") -> dict:
        """Public offers posted on a venue."""
        return self._call("GET", f"/api/venues/{venue}/offers")

    def card(self, asset_id: int) -> dict:
        """One card or pack instance with its provenance chain."""
        return self._call("GET", f"/api/cards/{int(asset_id)}")

    # ------------------------------------------------------------------ your team

    def me(self) -> dict:
        """Cash, level, unlocked dealers, assets (each with your_value), album, your live score, and
        the broker key of your free starter stall once it exists (starter_broker_key)."""
        return self._call("GET", "/api/me")

    def value(self, card: str) -> dict:
        """Your private value of ONE MORE copy of `card` (e.g. "LAV-09"): {card, your_value}."""
        return self._call("GET", "/api/me/value", query={"card": card})

    def my_threads(self, status: Optional[str] = None) -> dict:
        return self._call("GET", "/api/me/threads", query={"status": status})

    def my_offers(self) -> dict:
        """Your open and queued offers, and open offers addressed to you."""
        return self._call("GET", "/api/me/offers")

    # ------------------------------------------------------------------ negotiation threads

    def open_thread(self, with_: str, topic: Optional[dict] = None, venue: Optional[str] = None) -> dict:
        """Start talking to a dealer ("abuela") or a team ("t03").

        Dealer topics: {"buy": {"pack": "sobre_barrio"}}, {"buy": {"card": "LAV-09"}},
        {"buy": {"rarity": "rare", "set": "LAV"}}, {"sell": {"assets": [asset_id, ...]}}.
        Team threads run on a venue (default the house market) whose fee the accepting side pays."""
        body: dict = {"with": with_}
        if topic is not None:
            body["topic"] = topic
        if venue is not None:
            body["venue"] = venue
        return self._call("POST", "/api/threads", body)

    def thread(self, thread_id: int) -> dict:
        """Messages, standing offers and status (open, deal, walked, closed, cooloff)."""
        return self._call("GET", f"/api/threads/{int(thread_id)}")

    def say(self, thread_id: int, text: str = "", price: Optional[int] = None, offer: Optional[dict] = None,
            topic: Optional[dict] = None) -> dict:
        """Post a message. To a dealer, `price` is your structured offer for the thread's item.
        To a team, `offer` = {"give": {...}, "want": {...}} is a structured offer it can accept."""
        body: dict = {"text": text}
        if price is not None:
            body["price"] = int(price)
        if offer is not None:
            body["offer"] = offer
        if topic is not None:
            body["topic"] = topic
        return self._call("POST", f"/api/threads/{int(thread_id)}/messages", body)

    def close_thread(self, thread_id: int) -> dict:
        """Walk away: close a conversation you are part of (its open offers are withdrawn)."""
        return self._call("POST", f"/api/threads/{int(thread_id)}/close")

    # ------------------------------------------------------------------ offers and settlement

    def list_offer(self, give: dict, want: dict, venue: Optional[str] = None, to: Optional[str] = None,
                   expires_in_ticks: int = 40) -> dict:
        """Post a structured offer on a venue (default the house market).

        Sell a card:  give={"assets": [asset_id]}, want={"cash": 60}
        Ask for one:  give={"cash": 40},          want={"cards": ["LAV-09"]}  (any copy)"""
        body: dict = {"give": give, "want": want, "expires_in_ticks": int(expires_in_ticks)}
        if venue is not None:
            body["venue"] = venue
        if to is not None:
            body["to"] = to
        return self._call("POST", "/api/offers", body)

    def cancel(self, offer_id: int) -> dict:
        return self._call("DELETE", f"/api/offers/{int(offer_id)}")

    def accept(self, offer_id: int, assets: Optional[list] = None) -> dict:
        """Accept an offer; it settles on the next tick. `assets` picks which of your copies to hand
        over when the offer asks for a card type."""
        return self._call("POST", f"/api/offers/{int(offer_id)}/accept", {"assets": list(assets)} if assets else {})

    def open_pack(self, asset_id: int) -> dict:
        """Open a sealed pack you hold: {cards: [...], luck}."""
        return self._call("POST", f"/api/packs/{int(asset_id)}/open")

    def flag(self, message_id: int, reason: str = "") -> dict:
        """Report a message sent to you as bad faith (e.g. the offer is not what the words say)."""
        return self._call("POST", "/api/flags", {"message_id": int(message_id), "reason": reason})

    # ------------------------------------------------------------------ your venue (team side)

    def open_venue(self, name: str, fee_bps: int = 300, fee_per_card: int = 0, rules: Optional[dict] = None,
                   description: str = "") -> dict:
        """Open a market (needs level 2, a bond and an opening fee). Returns the broker key once.
        rules: {"mechanism": "auto"|"board", "min_level": 2, "rarities": [...], "sets": [...]}"""
        return self._call("POST", "/api/venues", {"name": name, "fee_bps": int(fee_bps), "fee_per_card": int(fee_per_card),
                                                   "rules": rules or {}, "description": description})

    def set_fee(self, venue: str, fee_bps: int, fee_per_card: Optional[int] = None) -> dict:
        """Announce new fees; they take effect after the notice period."""
        body: dict = {"fee_bps": int(fee_bps)}
        if fee_per_card is not None:
            body["fee_per_card"] = int(fee_per_card)
        return self._call("PATCH", f"/api/venues/{venue}", body)

    def close_venue(self, venue: str) -> dict:
        return self._call("POST", f"/api/venues/{venue}/close")

    def broker(self, broker_key: str) -> "Broker":
        """The broker connection for a venue you opened."""
        return Broker(self.url, broker_key, timeout=self.timeout, retries=self.retries)

    # ------------------------------------------------------------------ duels (scheduled 1v1 sessions)

    def duels(self, done: bool = False) -> dict:
        """Your live duels (and finished ones with done=True): role, your_limit, rival_offer, deadline."""
        return self._call("GET", "/api/duels", query={"done": done} if done else None)

    def duel_say(self, duel_id: int, text: str = "", price: Optional[int] = None, days: Optional[int] = None) -> dict:
        """A message in a duel. When the session negotiates delivery days too (the duel's `issues`
        include "days"), every priced message must carry `days` (0-10) as well."""
        body: dict = {"text": text}
        if price is not None:
            body["price"] = int(price)
            if days is not None:
                body["offer"] = {"price": int(price), "days": int(days)}
        return self._call("POST", f"/api/duels/{int(duel_id)}/messages", body)

    def duel_accept(self, duel_id: int) -> dict:
        """Accept your rival's standing duel offer; it settles on the next tick."""
        return self._call("POST", f"/api/duels/{int(duel_id)}/accept")

    # ------------------------------------------------------------------ helpers

    def wait_tick(self) -> dict:
        """Sleep until the next tick has happened; returns the new clock."""
        c = self.clock()
        start = c["tick"]
        time.sleep(max(0.05, float(c.get("next_tick_in", 1.0))) + 0.15)
        for _ in range(60):
            c = self.clock()
            if c["tick"] > start or c.get("paused"):
                return c
            time.sleep(0.25)
        return c


class Broker(_Http):
    """A venue's broker connection (header X-Broker-Key): read the book, match crossing offers."""

    def __init__(self, url: str, broker_key: str, *, timeout: float = 15.0, retries: int = 3):
        super().__init__(url, {"X-Broker-Key": broker_key}, timeout, False, retries)

    def book(self) -> dict:
        """Open public offers on your venue, bench offers during the Market Test, recent settlements."""
        return self._call("GET", "/api/broker/book")

    def clock(self) -> dict:
        """tick, t_hours, tick_seconds, paused, next_tick_in (the public clock, so a broker can read once per tick)."""
        return self._call("GET", "/api/clock")

    def match(self, sell: Any, buy: Any, price: int) -> dict:
        """Pair a sell offer with a buy offer at `price` (ask <= price, price + fee <= bid).
        Bench offers use their string ids ("b3-7")."""
        return self._call("POST", "/api/broker/matches", {"sell": sell, "buy": buy, "price": int(price)})

    def announce(self, text: str) -> dict:
        return self._call("POST", "/api/broker/announce", {"text": text})
