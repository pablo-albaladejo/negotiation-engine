"""Your first deal in the Bazaar: buy a pack from Abuela Carmen, open it, see your score.

    BAZAAR_URL=https://bazaar.causaprima.ai BAZAAR_KEY=tk-xxxx-xxxx python starter_agent.py
"""
import os

from bazaar_sdk import Bazaar

b = Bazaar(os.environ.get("BAZAAR_URL", "https://bazaar.causaprima.ai"), os.environ["BAZAAR_KEY"])
print("The Bazaar · Cromos de Madrid, hosted by Causa Prima. Welcome!")
me = b.me()
catalog = b.catalog()
cur = catalog.get("currency_symbol", "P")
print(f"{me['name']}: {me['cash']} {cur}, {len(me['assets'])} cards, level {me['level']}")
pack = next(p for p in catalog["packs"] if p["id"] == "sobre_barrio")
budget = min(me["cash"], int(pack["expected_book"] * 0.8))  # we cannot see our value of a pack we do not hold yet
thread = b.open_thread("abuela", topic={"buy": {"pack": "sobre_barrio"}})
offer, status = int(budget * 0.6), "open"
while status == "open":
    t = b.thread(thread["id"])
    status = t["status"]
    hers = [o for o in t["standing_offers"] if o["maker"] == "abuela" and o["status"] == "open"]
    if status == "open" and hers:
        ask = hers[-1]["want"]["cash"]
        if ask <= min(budget, offer + 1) or (hers[-1].get("final") and ask <= budget):  # fine, or her last word
            b.accept(hers[-1]["id"])
        else:  # a polite counter-offer, two primas higher each round
            b.say(t["id"], f"Hola, Abuela! Would {offer} {cur} be all right? Thank you very much.", price=offer)
            offer = min(budget, offer + 2)
    if status == "open":
        b.wait_tick()
if status != "deal":
    raise SystemExit(f"No deal this time (the thread is {status}). Run me again.")
now = b.me()
sealed = next(a for a in now["assets"] if a["kind"] == "pack" and a["ref"] == "sobre_barrio")
print(f"Deal! {sealed['name']}, worth {sealed['your_value']} {cur} to you; you paid {me['cash'] - now['cash']} {cur}.")
for c in b.open_pack(sealed["id"])["cards"]:
    print(f"  pulled {c['name']} · {c['rarity']} · #{c['serial']}/{c['print_run']}")
# A duplicate is worth little to you and a lot to a team that is missing it: offer spares to everyone at their book value.
books = {c["id"]: c["book"] for s in catalog["sets"] for c in s["cards"]}
held = b.me()["assets"]
seen = set()
for a in sorted((a for a in held if a["kind"] == "card"), key=lambda a: a["serial"]):
    if a["ref"] in seen and books.get(a["ref"]):
        b.list_offer({"assets": [a["id"]]}, {"cash": int(books[a["ref"]])}, venue="rastro")
        print(f"  offered a spare {a['name']} for {int(books[a['ref']])} {cur} on El Rastro")
    seen.add(a["ref"])
score = b.me()["score"] or {}
print(f"Board score {score.get('score', 0)} of 60, rank {score.get('rank')} (the public board refreshes every few "
      "minutes). Next: haggle better, trade with teams, or watch b.levels() for what opens next.")
