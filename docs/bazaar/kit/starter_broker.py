"""A starter broker for your venue: it crosses the Market Test's bench offers exactly as the free auto stall does, and your
venue's public offers card by card. Run it for the whole game on a venue opened with {"mechanism": "board"} (on an
'auto' venue, the free stall included, the engine crosses every pair before a broker reads the book):
    BROKER_KEY=bk_... python3 starter_broker.py   # BAZAAR_URL defaults to https://bazaar.causaprima.ai

On the Market Test it earns what the free stall earns, half the bench points and no more, because it crosses by quote and a
quote is not a limit. Bench traders shade their quotes away from a limit they keep hidden. Some are patient and some
leave soon; most relax their quotes as their patience runs out, and the firm ones never do. the Market Test counts the gains
between the true limits, so a broker that estimates those limits, and who is about to leave, beats the stall."""
import math, os, time  # noqa: E401
from bazaar_sdk import BazaarError, Broker


def bench_plan(book: dict) -> list:
    """[(sell id, buy id, price)]: in each bench run, the highest bid against the lowest ask while the bid covers it,
    at the midpoint. sorted() keeps the book's order among equal quotes, as the stall does."""
    plan, runs = [], {}  # run ("b12" in the offer id "b12-7") -> (asks, bids): a match pairs two offers of one run
    for o in book.get("bench_offers") or []:
        asks, bids = runs.setdefault(o["id"].split("-")[0], ([], []))
        if o["want"]["cash"]:  # a bench seller asks for cash, a bench buyer bids it
            asks.append((o["want"]["cash"], o["id"]))
        else:
            bids.append((o["give"]["cash"], o["id"]))
    for asks, bids in runs.values():
        for (ask, sell), (bid, buy) in zip(sorted(asks, key=lambda a: a[0]), sorted(bids, key=lambda b: -b[0])):
            if bid < ask:
                break
            plan.append((sell, buy, (ask + bid) // 2))
    return plan


def public_plan(book: dict) -> list:
    """[(sell id, buy id, price)]: your venue's real offers, card by card, the lowest ask against the highest bid for
    that card, at the midpoint, lowered until the buyer can also pay your fee. At most 10 matches per tick."""
    def fee(price: int) -> int:  # as the venue charges it, rounded up
        return math.ceil(book["fee_bps"] * price / 10000) + book["fee_per_card"]
    plan, offers = [], book.get("offers") or []
    bids = sorted((o for o in offers if o["give"]["cash"] and len(o["want"]["types"]) == 1), key=lambda o: -o["give"]["cash"])
    for s in sorted((o for o in offers if len(o["give"]["assets"]) == 1 and o["want"]["cash"]), key=lambda o: o["want"]["cash"]):
        ask, card = s["want"]["cash"], "{kind}:{ref}".format(**s["give"]["assets"][0])
        b = next((b for b in bids if b["want"]["types"] == [card] and b["maker"] != s["maker"]
                  and ask + fee(ask) <= b["give"]["cash"]), None)  # the highest bid for this card that covers ask + fee
        if b:
            bids.remove(b)
            price = next(p for p in range((ask + b["give"]["cash"]) // 2, ask - 1, -1) if p + fee(p) <= b["give"]["cash"])
            plan.append((s["id"], b["id"], price))
    return plan[:10]


if __name__ == "__main__":
    broker, seen = Broker(os.environ.get("BAZAAR_URL", "https://bazaar.causaprima.ai"), os.environ["BROKER_KEY"]), None
    while True:  # two reads a second: a new tick, a session opening mid-tick or a new offer is seen within 1 s
        try:
            tick, book = broker.clock()["tick"], broker.book()
            now = (tick, [o["id"] for o in (book.get("bench_offers") or []) + (book.get("offers") or [])])
            if now != seen:  # plan once per state of the book, so a refused match is not retried every second
                seen = now
                for sell, buy, price in bench_plan(book) + public_plan(book):
                    try:
                        broker.match(sell, buy, price)
                    except BazaarError as e:  # an offer taken since the read, a shape the venue cannot cross, ...
                        print(f"tick {tick}: {sell} x {buy} at {price} refused ({e})")
        except BazaarError as e:  # the server restarting, say: keep going, on a board venue nothing matches without you
            print(f"cannot read the book ({e}), trying again")
        time.sleep(1.0)
