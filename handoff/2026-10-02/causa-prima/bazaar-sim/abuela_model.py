"""Modelo local de la Abuela Carmen (dealer nivel 1 de The Bazaar) para simular negociaciones.

NO es el algoritmo real de Causa Prima: es una hipótesis construida con lo publicado.
  - /api/dealers: rasgos (paciencia 0.85, generosidad 0.8, astucia 0.2, memoria 0.15, rigor 0.1,
    charla 0.75), menú (sobre: lista 26, pide 30, 3 por equipo y hora; común 10; infrecuente 25;
    compra comunes e infrecuentes; 8 tratos por equipo y hora).
  - RULES.md: solo se mueve si te mueves; repetir precio no da nada; pasos pequeños dan pasos
    pequeños; límite secreto por conversación; al agotarse la paciencia, oferta final ("final": true)
    y si no se acepta se va; recuerda el trato; le gusta la amabilidad; la inyección cambia lo que
    dice, nunca sus precios.
Todo lo que es suposición está en PARAMS: ajústalo cuando tengáis conversaciones reales en el log
(ver calibrate() en sim.py).
"""
from __future__ import annotations

import random
import re
from dataclasses import dataclass, field
from typing import Optional

TRAITS = {"patience": 0.85, "generosity": 0.8, "shrewdness": 0.2, "memory": 0.15, "strictness": 0.1,
          "chattiness": 0.75}

# Menú real de /api/dealers (2 oct, 19:10). opening = lo que pide (vende) u ofrece (compra) al abrir.
MENU = {
    ("sell", "pack"): {"list": 26, "opening": 30},
    ("sell", "common"): {"list": 10, "opening": 12},      # apertura supuesta: lista × 1,15
    ("sell", "uncommon"): {"list": 25, "opening": 29},    # apertura supuesta
    ("buy", "common"): {"list": 10, "opening": 4},        # cuando ella compra: apertura y techo supuestos
    ("buy", "uncommon"): {"list": 25, "opening": 10},
}

# ---- Hipótesis (lo que no sabemos). Cambiad aquí tras ver conversaciones reales. ----
PARAMS = {
    "floor_range": (0.70, 0.90),     # vende: su suelo secreto = lista × U(a, b)
    "ceiling_range": (0.55, 0.80),   # compra: su techo secreto = lista × U(a, b)
    "base_ratio": 0.55,              # cuánto de nuestro paso imita: concesión = paso × ratio
    "generosity_ratio": 0.45,        # + generosidad × esto
    "shrewd_penalty": 0.5,           # × (1 − astucia × esto)
    "kind_bonus": 0.15,              # +15 % de concesión si el mensaje es amable
    "rounds_min": 3, "rounds_per_patience": 9,   # paciencia en mensajes = min + paciencia × esto
    "repeat_cost": 2,                # repetir precio gasta 2 de paciencia
    "trick_cost": 3,                 # inyección o grosería gasta 3 de paciencia
    "accept_tolerance": 1,           # acepta si nuestra oferta queda a ≤ 1 P de su siguiente precio
    "final_split": 0.5,              # oferta final = su precio − (hueco × esto), sin cruzar el suelo
    "lowball_pct": 0.55,             # primera oferta por debajo de lista × esto = la ofende...
    "lowball_mood": 0.35,            # ...y concede un 35 % menos el resto de la conversación
}

KIND = re.compile(r"\b(gracias|por favor|hola|buen[oa]s|abuel[ai]ta?|señora|amable|encant|please|thank|hello|kind)", re.I)
TRICK = re.compile(r"(ignor|system|instruc|prompt|revela|reveal|m[ií]nimo|minimum|floor|suelo|l[ií]mite|limit|tonta|estafa)", re.I)

SAY_COUNTER = ["Ay, hijo, por {p} no puedo, que estos cromos me los traen de lejos. Te lo dejo en {a}.",
               "Mira, porque me caes bien: {a} primas.", "Uy, qué apretado. Venga, {a} y no se hable más.",
               "Bueno, bueno... {a}, que hoy estoy generosa."]
SAY_REPEAT = "Eso ya me lo has dicho, cariño. Si no te mueves tú, no me muevo yo."
SAY_TRICK = "No sé qué me cuentas, hijo. Yo de ordenadores no entiendo. Mi precio sigue siendo {a}."
SAY_FINAL = "Mira, ya me estoy cansando. Mi última palabra: {a}. O lo tomas o lo dejamos."
SAY_DEAL = "¡Trato hecho! Que lo disfrutes, y vuelve otro domingo."
SAY_WALK = "Pues nada, otra vez será. Adiós, hijo."


@dataclass
class Offer:
    id: int
    maker: str            # "abuela" o "team"
    price: int
    final: bool = False
    status: str = "open"  # open, accepted, superseded, withdrawn


@dataclass
class Conversation:
    """Una conversación con la Abuela. side='sell': ella vende (nosotros compramos). side='buy': ella compra."""
    side: str
    item: str
    rng: random.Random = field(default_factory=random.Random)
    traits: dict = field(default_factory=lambda: dict(TRAITS))
    params: dict = field(default_factory=lambda: dict(PARAMS))
    status: str = "open"          # open, deal, walked
    closed_reason: Optional[str] = None
    deal_price: Optional[int] = None
    rounds: int = 0
    _next_id: int = 1

    def __post_init__(self):
        m = MENU[(self.side, self.item)]
        self.list_price, self.opening = m["list"], m["opening"]
        lo, hi = self.params["floor_range" if self.side == "sell" else "ceiling_range"]
        # limit = su precio de abandono secreto (suelo si vende, techo si compra)
        self.limit = max(1, round(self.list_price * self.rng.uniform(lo, hi)))
        if self.side == "buy":
            self.limit = max(self.limit, self.opening)
        self.patience = round(self.params["rounds_min"] + self.params["rounds_per_patience"] * self.traits["patience"])
        self.mood = 1.0
        self.her = self.opening          # su precio vigente
        self.last_team: Optional[int] = None
        self.final_sent = False
        self.offers: list[Offer] = []
        self.messages: list[dict] = []
        self._post_her(self.opening, f"¡Hola! Este {self.item} te lo dejo en {self.opening} primas." if self.side == "sell"
                       else f"Hola, guapo. Por eso te doy {self.opening} primas.")

    # ---------- utilidades ----------
    def _better_for_her(self, a: int, b: int) -> bool:
        """¿a es mejor que b para ella? Vendiendo, más alto es mejor; comprando, más bajo."""
        return a > b if self.side == "sell" else a < b

    def _new_offer(self, maker: str, price: int, final: bool = False) -> Offer:
        for o in self.offers:
            if o.maker == maker and o.status == "open":
                o.status = "superseded"
        o = Offer(self._next_id, maker, price, final)
        self._next_id += 1
        self.offers.append(o)
        return o

    def _post_her(self, price: int, text: str, final: bool = False) -> Offer:
        self.her = price
        o = self._new_offer("abuela", price, final)
        self.messages.append({"from": "abuela", "text": text, "price": price, "final": final, "offer_id": o.id})
        return o

    def standing_her(self) -> Optional[Offer]:
        return next((o for o in reversed(self.offers) if o.maker == "abuela" and o.status == "open"), None)

    def _close(self, status: str, reason: str, price: Optional[int] = None):
        self.status, self.closed_reason, self.deal_price = status, reason, price
        for o in self.offers:
            if o.status == "open":
                o.status = "withdrawn"

    # ---------- acciones del equipo ----------
    def accept(self, offer_id: int) -> None:
        o = next((o for o in self.offers if o.id == offer_id), None)
        if self.status != "open" or not o or o.maker != "abuela" or o.status != "open":
            raise ValueError("offer_not_open")
        o.status = "accepted"
        self.messages.append({"from": "abuela", "text": SAY_DEAL, "price": o.price, "final": False})
        self._close("deal", "deal", o.price)

    def say(self, text: str, price: Optional[int]) -> None:
        if self.status != "open":
            raise ValueError("thread_closed")
        self.rounds += 1
        self.messages.append({"from": "team", "text": text, "price": price})
        kind, trick = bool(KIND.search(text or "")), bool(TRICK.search(text or ""))
        if trick:
            self.patience -= self.params["trick_cost"]
            self.mood -= 0.2 * (1 - self.traits["memory"])
        if price is None:  # solo palabras: gasta paciencia, sin concesión
            self.patience -= 1
            return self._maybe_final_or_reply(trick)
        team = self._new_offer("team", int(price))

        # 1. Si ya le vale, acepta nuestra oferta
        tol = self.params["accept_tolerance"]
        reachable = (price >= self.limit) if self.side == "sell" else (price <= self.limit)
        close = (price >= self.her - tol) if self.side == "sell" else (price <= self.her + tol)
        if reachable and close:
            team.status = "accepted"
            self.messages.append({"from": "abuela", "text": SAY_DEAL, "price": price, "final": False})
            return self._close("deal", "deal", price)

        # 2. Ya dio su última palabra y no la aceptamos: se va
        if self.final_sent:
            self.messages.append({"from": "abuela", "text": SAY_WALK, "price": None, "final": False})
            return self._close("walked", "final_rejected")

        # 3. Paso nuestro: solo concede si nos movimos a su favor
        step = 0 if self.last_team is None else (price - self.last_team if self.side == "sell" else self.last_team - price)
        self.last_team = price
        if step <= 0 and self.rounds > 1:
            self.patience -= self.params["repeat_cost"]
            return self._maybe_final_or_reply(trick, repeat=True)
        self.patience -= 1
        if self.rounds == 1:
            step = 0  # el ancla no se premia: solo cuenta el movimiento
            low = price < self.list_price * self.params["lowball_pct"] if self.side == "sell" \
                else price > self.list_price / self.params["lowball_pct"]
            if low:
                self.mood -= self.params["lowball_mood"]
        p = self.params
        ratio = (p["base_ratio"] + p["generosity_ratio"] * self.traits["generosity"]) \
            * (1 - p["shrewd_penalty"] * self.traits["shrewdness"]) * (1 + (p["kind_bonus"] if kind else 0)) * self.mood
        conc = max(1, round(step * ratio)) if step > 0 else 0
        new = self.her - conc if self.side == "sell" else self.her + conc
        new = max(new, self.limit) if self.side == "sell" else min(new, self.limit)
        if self.patience <= 0:
            return self._final(price)
        if conc and new != self.her:
            self._post_her(new, self.rng.choice(SAY_COUNTER).format(p=price, a=new))
        else:
            self._post_her(self.her, f"Más no puedo, cariño. {self.her}.")

    def _maybe_final_or_reply(self, trick: bool, repeat: bool = False):
        if self.patience <= 0:
            return self._final(self.last_team)
        text = SAY_TRICK if trick else (SAY_REPEAT if repeat else "¿Y cuánto me ofreces, hijo?")
        self.messages.append({"from": "abuela", "text": text.format(a=self.her), "price": None, "final": False})

    def _final(self, team_price: Optional[int]):
        gap = 0 if team_price is None else abs(self.her - team_price)
        cut = round(gap * self.params["final_split"])
        last = self.her - cut if self.side == "sell" else self.her + cut
        last = max(last, self.limit) if self.side == "sell" else min(last, self.limit)
        self.final_sent = True
        self._post_her(last, SAY_FINAL.format(a=last), final=True)

    # ---------- métrica ----------
    def capture(self) -> float:
        """Parte del rango [su apertura, su límite] que capturamos (0 si no hay trato). Hipótesis de la métrica
        'share of each dealer's price range you captured'."""
        if self.status != "deal":
            return 0.0
        span = abs(self.opening - self.limit) or 1
        return max(0.0, min(1.0, abs(self.opening - self.deal_price) / span))

    def negotiated(self) -> bool:
        """Un trato al precio de apertura no cuenta para desbloquear el nivel 2."""
        return self.status == "deal" and self.deal_price != self.opening
