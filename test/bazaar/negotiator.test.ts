import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { closeText, counterText, numbersIn, textMatchesPrice } from "../../src/bazaar/messages.js";
import { DEFAULT_NEGOTIATOR_PARAMS, decide, effectiveReservation, LEGACY_NEGOTIATOR_PARAMS, type Side, type ThreadView } from "../../src/bazaar/negotiator.js";
import { buyTargets, missingPageCards, spareTargets } from "../../src/bazaar/planner.js";
import { ThreadSchema } from "../../src/bazaar/schemas.js";
import { threadPrices } from "../../src/bazaar/view.js";

function view(partial: Partial<ThreadView> & Pick<ThreadView, "side" | "reservation">): ThreadView {
  return { herPrices: [], ourPrices: [], canMessage: true, canAccept: true, ...partial };
}

/** Simula un hilo con un dealer que concede un poco cada vez que nos movemos. */
function simulate(side: Side, reservation: number, herOpen: number, herLimit: number, rounds = 40) {
  const herPrices = [herOpen];
  const ourPrices: number[] = [];
  const decisions = [];
  for (let i = 0; i < rounds; i++) {
    const her = herPrices[herPrices.length - 1]!;
    const d = decide(view({ side, reservation, herOpening: herOpen, herPrices: [...herPrices], herCurrent: { offerId: i, price: her, final: false }, ourPrices: [...ourPrices] }));
    decisions.push(d);
    if (d.action.kind !== "counter") break;
    ourPrices.push(d.action.price);
    const step = Math.max(1, Math.round(Math.abs(her - d.action.price) * 0.15));
    herPrices.push(side === "buy" ? Math.max(herLimit, her - step) : Math.min(herLimit, her + step));
  }
  return { decisions, ourPrices, herPrices };
}

describe("negotiator: compra", () => {
  it("abre lejos de su precio (ancla); su apertura sin final no se acepta", () => {
    const d = decide(view({ side: "buy", reservation: 100, herOpening: 60, herPrices: [60], herCurrent: { offerId: 1, price: 60, final: false } }));
    expect(d.action).toEqual({ kind: "counter", price: 45 });
    expect(d.rule).toBe("anchor");
    const legacy = decide(view({ side: "buy", reservation: 100, herOpening: 60, herPrices: [60], herCurrent: { offerId: 1, price: 60, final: false } }), LEGACY_NEGOTIATOR_PARAMS);
    expect(legacy.action).toEqual({ kind: "counter", price: 27 });
    const next = decide(view({ side: "buy", reservation: 100, herOpening: 60, herPrices: [60], herCurrent: { offerId: 1, price: 60, final: false }, ourPrices: [45] }));
    expect(next.action.kind).toBe("counter");
  });

  it("una final a su apertura se acepta si cabe en la reserva y crea valor (cuenta como trato); si no, cierra", () => {
    const fin = view({ side: "buy", reservation: 100, herOpening: 60, herPrices: [60], herCurrent: { offerId: 1, price: 60, final: true }, ourPrices: [33] });
    expect(decide(fin).action).toEqual({ kind: "accept", offerId: 1, price: 60 });
    expect(decide({ ...fin, privateValue: 60 }).action.kind).toBe("close");
    expect(decide({ ...fin, reservation: 59 }).action.kind).toBe("close");
  });

  it("acepta su oferta cuando AC_next: no peor que nuestra siguiente y dentro de la reserva", () => {
    const d = decide(view({ side: "buy", reservation: 100, herOpening: 60, herPrices: [60, 52, 45], herCurrent: { offerId: 9, price: 45, final: false }, ourPrices: [33, 40, 44] }));
    expect(d.action).toEqual({ kind: "accept", offerId: 9, price: 45 });
    expect(d.rule).toBe("ac-next");
  });

  it("final por debajo de la reserva: acepta; final por encima: cierra", () => {
    const ok = decide(view({ side: "buy", reservation: 50, herOpening: 60, herPrices: [60, 48], herCurrent: { offerId: 2, price: 48, final: true }, ourPrices: [30] }));
    expect(ok.action).toEqual({ kind: "accept", offerId: 2, price: 48 });
    expect(ok.rule).toBe("final-above-reservation");
    const no = decide(view({ side: "buy", reservation: 40, herOpening: 60, herPrices: [60, 48], herCurrent: { offerId: 2, price: 48, final: true }, ourPrices: [30] }));
    expect(no.action.kind).toBe("close");
    expect(no.rule).toBe("final-below-reservation");
  });

  it("respeta una aceptación por tick y un mensaje por tick", () => {
    const acc = decide(view({ side: "buy", reservation: 100, herOpening: 60, herPrices: [60, 45], herCurrent: { offerId: 9, price: 45, final: false }, ourPrices: [44], canAccept: false }));
    expect(acc.action.kind).toBe("wait");
    expect(acc.rule).toBe("one-accept-per-tick");
    const msg = decide(view({ side: "buy", reservation: 100, herOpening: 60, herPrices: [60], herCurrent: { offerId: 1, price: 60, final: false }, ourPrices: [33], canMessage: false }));
    expect(msg.action.kind).toBe("wait");
  });

  it("aguanta el precio (no cierra) si ya no puede mejorar y ella no ha dado su final", () => {
    const d = decide(view({ side: "buy", reservation: 40, herOpening: 60, herPrices: [60, 55], herCurrent: { offerId: 3, price: 55, final: false }, ourPrices: [22, 40] }));
    expect(d.action).toEqual({ kind: "hold", price: 40 });
    expect(d.rule).toBe("hold");
  });

  it("tras maxHolds aguantes sin su final, cierra", () => {
    const stuckView = view({ side: "buy", reservation: 40, herOpening: 60, herPrices: [60, 55], herCurrent: { offerId: 3, price: 55, final: false }, ourPrices: [22, 40] });
    for (let holdsUsed = 0; holdsUsed < DEFAULT_NEGOTIATOR_PARAMS.maxHolds; holdsUsed++) {
      const d = decide({ ...stuckView, holdsUsed });
      expect(d.action).toEqual({ kind: "hold", price: 40 });
    }
    const last = decide({ ...stuckView, holdsUsed: DEFAULT_NEGOTIATOR_PARAMS.maxHolds });
    expect(last.action.kind).toBe("close");
    expect(last.rule).toBe("holds-exhausted");
  });

  it("precio fijo: tras 2 concesiones sin que se mueva, acepta si cabe en la reserva y crea valor", () => {
    const base = view({ side: "sell", reservation: 6, privateValue: 5, herOpening: 13, herPrices: [13, 13, 13], herCurrent: { offerId: 7, price: 13, final: false } });
    expect(decide({ ...base, ourPrices: [26, 25] }).action.kind).toBe("counter");
    const d = decide({ ...base, ourPrices: [26, 25, 24] });
    expect(d.action).toEqual({ kind: "accept", offerId: 7, price: 13 });
    expect(d.rule).toBe("fixed-price");
    expect(decide({ ...base, ourPrices: [26, 25, 24], canAccept: false }).action.kind).toBe("wait");
    // Fuera de reserva o sin crear valor: cierra (educadamente, el agente manda closeText).
    const out = decide({ ...base, reservation: 15, ourPrices: [26, 25, 24] });
    expect(out.action.kind).toBe("close");
    expect(out.rule).toBe("fixed-price-out-of-range");
    expect(decide({ ...base, privateValue: 13, ourPrices: [26, 25, 24] }).rule).toBe("fixed-price-out-of-range");
    // Si se movió, no es fijo; con el parámetro a 0, la regla se desactiva.
    expect(decide({ ...base, herPrices: [12, 13], ourPrices: [26, 25, 24] }).rule).not.toBe("fixed-price");
    expect(decide({ ...base, ourPrices: [26, 25, 24] }, { ...DEFAULT_NEGOTIATOR_PARAMS, fixedAfterConcessions: 0 }).action.kind).toBe("counter");
  });

  it("precio fijo al comprar: acepta su precio inmóvil dentro de la reserva", () => {
    const d = decide(view({ side: "buy", reservation: 22, privateValue: 24, herOpening: 20, herPrices: [20, 20], herCurrent: { offerId: 3, price: 20, final: false }, ourPrices: [9, 10, 11] }));
    expect(d.action).toEqual({ kind: "accept", offerId: 3, price: 20 });
  });

  it("acepta su oferta final dentro del límite tras aguantar, y nunca su precio de apertura", () => {
    const held = view({ side: "buy", reservation: 40, herOpening: 60, herPrices: [60, 55], herCurrent: { offerId: 3, price: 55, final: false }, ourPrices: [22, 40], holdsUsed: 1 });
    expect(decide(held).action.kind).toBe("hold");
    const final = view({ side: "buy", reservation: 40, herOpening: 60, herPrices: [60, 55, 38], herCurrent: { offerId: 4, price: 38, final: true }, ourPrices: [22, 40], holdsUsed: 2 });
    const d = decide(final);
    expect(d.action).toEqual({ kind: "accept", offerId: 4, price: 38 });
    const atOpening = view({ side: "buy", reservation: 50, herOpening: 60, herPrices: [60], herCurrent: { offerId: 1, price: 60, final: true } });
    expect(decide(atOpening).action.kind).not.toBe("accept");
  });

  it("solo un mensaje de aguante por tic", () => {
    const d = decide(view({ side: "buy", reservation: 40, herOpening: 60, herPrices: [60, 55], herCurrent: { offerId: 3, price: 55, final: false }, ourPrices: [22, 40], canMessage: false }));
    expect(d.action.kind).toBe("wait");
    expect(d.rule).toBe("one-message-per-tick");
  });

  it("propiedad: concesiones monótonas, pequeñas, sin repetir precio y sin cruzar la reserva efectiva", () => {
    fc.assert(
      fc.property(fc.integer({ min: 5, max: 400 }), fc.integer({ min: 5, max: 400 }), fc.integer({ min: 1, max: 400 }), (res, open, limitRaw) => {
        const herLimit = Math.min(open, limitRaw);
        const { decisions, ourPrices } = simulate("buy", res, open, herLimit);
        const effRes = effectiveReservation({ side: "buy", reservation: res, herOpening: open });
        for (let i = 1; i < ourPrices.length; i++) {
          expect(ourPrices[i]!).toBeGreaterThan(ourPrices[i - 1]!);
          expect(ourPrices[i]! - ourPrices[i - 1]!).toBeLessThanOrEqual(DEFAULT_NEGOTIATOR_PARAMS.maxStep);
        }
        for (const p of ourPrices) expect(p).toBeLessThanOrEqual(Math.max(1, effRes));
        const last = decisions[decisions.length - 1]!;
        if (last.action.kind === "accept") {
          expect(last.action.price).toBeLessThanOrEqual(res);
          // A su apertura solo por la regla de precio fijo (no se movió tras nuestras concesiones).
          if (last.action.price === open) expect(last.rule).toBe("fixed-price");
        }
      }),
      { numRuns: 300 },
    );
  });

  it("llega a acuerdo con un dealer razonable por debajo de la reserva", () => {
    const { decisions } = simulate("buy", 80, 70, 50);
    const last = decisions[decisions.length - 1]!;
    expect(last.action.kind).toBe("accept");
    if (last.action.kind === "accept") expect(last.action.price).toBeLessThan(70);
  });
});

describe("negotiator: venta", () => {
  it("abre por encima, concede hacia abajo y acepta pujas por encima de la reserva (no la de apertura)", () => {
    const first = decide(view({ side: "sell", reservation: 10, herOpening: 12, herPrices: [12], herCurrent: { offerId: 1, price: 12, final: false } }));
    expect(first.action).toEqual({ kind: "counter", price: 24 });
    const { decisions, ourPrices } = simulate("sell", 10, 12, 18);
    for (let i = 1; i < ourPrices.length; i++) expect(ourPrices[i]!).toBeLessThan(ourPrices[i - 1]!);
    const last = decisions[decisions.length - 1]!;
    expect(last.action.kind).toBe("accept");
    if (last.action.kind === "accept") expect(last.action.price).toBeGreaterThan(12);
  });

  it("no acepta una puja final por debajo de nuestro valor", () => {
    const d = decide(view({ side: "sell", reservation: 30, herOpening: 12, herPrices: [12, 20], herCurrent: { offerId: 4, price: 20, final: true }, ourPrices: [48] }));
    expect(d.action.kind).toBe("close");
  });
});

describe("messages", () => {
  it("el texto lleva exactamente la cifra del precio estructurado", () => {
    for (const side of ["buy", "sell"] as const) {
      for (let r = 0; r < 10; r++) {
        const t = counterText(side, r, 37 + r);
        expect(textMatchesPrice(t, 37 + r)).toBe(true);
        expect(t.length).toBeLessThan(1200);
      }
    }
    expect(numbersIn(closeText(0))).toEqual([]);
    expect(textMatchesPrice("I offer 30 P, worth 50 to me", 30)).toBe(false);
  });

  it("rota las palabras entre rondas", () => {
    expect(counterText("buy", 1, 40).replace("40", "")).not.toBe(counterText("buy", 2, 40).replace("40", ""));
  });
});

describe("threadPrices", () => {
  it("separa sus precios de los nuestros y toma su oferta abierta vigente", () => {
    const thread = ThreadSchema.parse({
      id: 7,
      status: "open",
      messages: [
        { id: 1, sender: "abuela", text: "60 for you, dear", price: 60 },
        { id: 2, sender: "t07", text: "33?", price: 33 },
        { id: 3, sender: "Abuela Carmen", text: "55", price: 55 },
      ],
      standing_offers: [
        { id: 10, maker: "abuela", status: "withdrawn", give: { assets: [1] }, want: { cash: 60 } },
        { id: 11, maker: "abuela", status: "open", give: { assets: [1] }, want: { cash: 55 }, final: false },
        { id: 12, maker: "t07", status: "open", give: { cash: 33 }, want: { assets: [1] } },
      ],
    });
    const p = threadPrices(thread, "buy", { id: "abuela", aliases: ["Abuela Carmen"] });
    expect(p).toEqual({ herPrices: [60, 55], herOpening: 60, herCurrent: { offerId: 11, price: 55, final: false }, ourPrices: [33] });
  });
});

describe("planner", () => {
  const me = {
    cash: 400,
    assets: [
      { id: 1, kind: "card", ref: "LAV-01", your_value: 20 },
      { id: 2, kind: "card", ref: "LAV-01", your_value: 4 },
      { id: 3, kind: "card", ref: "LAV-02", your_value: 18 },
      { id: 4, kind: "pack", ref: "sobre_barrio", your_value: 30 },
    ],
  };
  const catalog = {
    sets: [
      { id: "LAV", cards: [{ id: "LAV-01", print_run: 300, book: 10 }, { id: "LAV-02", print_run: 300, book: 10 }, { id: "LAV-03", print_run: 90, book: 25 }, { id: "LAV-11", print_run: 9, book: 200 }] },
      { id: "MAL", cards: [{ id: "MAL-01", print_run: 300, book: 10 }, { id: "MAL-02", print_run: 300, book: 10 }, { id: "MAL-03", print_run: 30, book: 80 }] },
    ],
    packs: [],
  };

  it("vende solo copias repetidas, con reserva = su your_value", () => {
    expect(spareTargets(me)).toEqual([{ key: "sell:2", side: "sell", topic: { sell: { assets: [2] } }, reservation: 4, label: "sell spare LAV-01", value: expect.any(Number) }]);
  });

  it("compra cartas de página que faltan, con reserva conservadora y tope de presupuesto", async () => {
    const missing = missingPageCards(me, catalog);
    expect(missing.map((m) => m.id)).toEqual(["LAV-03", "MAL-01", "MAL-02", "MAL-03"]);
    const values: Record<string, number> = { "LAV-03": 60, "MAL-01": 5, "MAL-02": 12, "MAL-03": 300 };
    const targets = await buyTargets(missing, async (c) => values[c]!, { budget: 120, cash: 400, safety: 0.85, maxLookups: 10 });
    expect(targets.map((t) => [t.key, t.reservation])).toEqual([
      ["buy:MAL-03", 120],
      ["buy:LAV-03", 51],
      ["buy:MAL-02", 10],
    ]);
  });
});
