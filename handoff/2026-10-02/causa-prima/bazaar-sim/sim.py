"""Simulaciones rápidas (sin HTTP) contra el modelo local de la Abuela.

    python3 sim.py                 # compara estrategias comprando sobres
    python3 sim.py --n 5000 --seed 7
    python3 sim.py --sweep         # barrido de ancla y pasos para la estrategia del plan
    python3 sim.py --item common   # otro artículo del menú

Una estrategia es una función (vista) -> acción:
    vista  = {"her": precio vigente de ella, "final": bool, "offer_id": id, "round": n, "last": nuestro último precio,
              "list": precio de lista, "opening": su apertura, "budget": nuestro tope}
    acción = ("accept",) | ("say", texto, precio) | ("walk",)
"""
from __future__ import annotations

import argparse
import random
import statistics as st

from abuela_model import Conversation

KIND_LINES = ["¡Hola, Abuela! ¿Le parecería bien {p}? Muchas gracias.", "Qué cromos tan bonitos. ¿{p}, por favor?",
              "Gracias por su paciencia, señora. Puedo llegar a {p}.", "Me encanta su puesto. ¿Lo dejamos en {p}?",
              "Es usted muy amable. {p} primas, ¿le va bien?", "Venga, hago un esfuerzo: {p}. ¡Gracias!"]


def starter(v):
    """La lógica de starter_agent.py: empieza en 60 % del tope y sube de 2 en 2."""
    offer = int(v["budget"] * 0.6) + 2 * (v["round"])
    offer = min(v["budget"], offer)
    if v["her"] <= min(v["budget"], offer + 1) or (v["final"] and v["her"] <= v["budget"]):
        return ("accept",)
    return ("say", f"Hola, Abuela! Would {offer} P be all right? Thank you very much.", offer)


def plan(anchor_pct=0.65, steps=(3, 2, 2, 1, 1)):
    """La estrategia del plan: ancla = lista × anchor_pct, pasos decrecientes, nunca repetir, AC_next."""
    def f(v):
        r = v["round"]
        anchor = round(v["list"] * anchor_pct)
        nxt = min(v["budget"], anchor + sum(steps[:r]) + max(0, r - len(steps)))  # tras los pasos, +1 por ronda
        if v["last"] is not None and nxt <= v["last"]:
            nxt = v["last"] + 1
        if v["her"] <= nxt or (v["final"] and v["her"] <= v["budget"]):     # AC_next / última palabra
            return ("accept",)
        if nxt > v["budget"]:
            return ("walk",)
        return ("say", KIND_LINES[r % len(KIND_LINES)].format(p=nxt), nxt)
    return f


def play(strategy, item="pack", budget=26, seed=None, max_rounds=40):
    rng = random.Random(seed)
    c = Conversation("sell", item, rng=rng)
    last = None
    for r in range(max_rounds):
        if c.status != "open":
            break
        o = c.standing_her()
        if o is None:  # ella no tiene oferta vigente (respondió solo con palabras)
            o_price, o_final, o_id = c.her, False, None
        else:
            o_price, o_final, o_id = o.price, o.final, o.id
        v = {"her": o_price, "final": o_final, "offer_id": o_id, "round": r, "last": last,
             "list": c.list_price, "opening": c.opening, "budget": budget}
        a = strategy(v)
        if a[0] == "accept" and o_id is not None:
            c.accept(o_id)
        elif a[0] == "walk":
            c._close("walked", "team_walked")
        else:
            _, text, price = a if a[0] == "say" else ("say", "", last)
            c.say(text, price)
            last = price
    return c


def report(name, convs):
    deals = [c for c in convs if c.status == "deal"]
    prices = [c.deal_price for c in deals]
    print(f"{name:28s} tratos {len(deals)/len(convs):6.1%}  precio medio {st.mean(prices) if prices else 0:5.1f}"
          f"  captura media {st.mean(c.capture() for c in convs):5.2f}"
          f"  negociados {sum(c.negotiated() for c in convs)/len(convs):6.1%}"
          f"  rondas {st.mean(c.rounds for c in convs):4.1f}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=2000)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--item", default="pack", choices=["pack", "common", "uncommon"])
    ap.add_argument("--budget", type=int, default=None, help="tope de compra (por defecto, el precio de lista)")
    ap.add_argument("--sweep", action="store_true")
    a = ap.parse_args()
    from abuela_model import MENU
    budget = a.budget or MENU[("sell", a.item)]["list"]
    seeds = [a.seed * 100000 + i for i in range(a.n)]
    print(f"Comprando '{a.item}' · tope {budget} · {a.n} conversaciones simuladas\n")
    report("starter_agent", [play(starter, a.item, budget, s) for s in seeds])
    report("plan (ancla 65 %, 3-2-2-1-1)", [play(plan(), a.item, budget, s) for s in seeds])
    if a.sweep:
        print("\nBarrido del plan (mejor captura primero):")
        rows = []
        for anchor_pct in (0.45, 0.55, 0.6, 0.65, 0.75):
            for steps in ((3, 2, 2, 1, 1), (2, 2, 1, 1, 1), (4, 3, 2, 1, 1), (1, 1, 1, 1, 1), (5, 3, 1, 1, 1)):
                cs = [play(plan(anchor_pct, steps), a.item, budget, s) for s in seeds[:500]]
                rows.append((st.mean(c.capture() for c in cs), sum(c.status == "deal" for c in cs) / len(cs), anchor_pct, steps))
        for cap, dr, anchor, steps in sorted(rows, reverse=True)[:8]:
            print(f"  ancla {anchor:4.0%} de lista  pasos {steps}  captura {cap:4.2f}  tratos {dr:5.1%}")


if __name__ == "__main__":
    main()
