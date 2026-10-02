import { describe, expect, it } from "vitest";
import {
  adaptiveStep,
  anchorPrice,
  bigStepsDidNotPay,
  decide,
  DEFAULT_NEGOTIATOR_PARAMS as P,
  effectiveReservation,
  LEGACY_NEGOTIATOR_PARAMS,
  plannedSchedule,
  stepResponses,
  type ThreadView,
} from "../../src/bazaar/negotiator.js";

function view(partial: Partial<ThreadView> & Pick<ThreadView, "side" | "reservation">): ThreadView {
  return { herPrices: [], ourPrices: [], canMessage: true, canAccept: true, ...partial };
}
const anchor = (v: Pick<ThreadView, "side" | "reservation" | "herOpening" | "herList">, p = P) => anchorPrice(v, p, effectiveReservation(v));

describe("paso adaptativo a su paciencia (hilos 56 y 125)", () => {
  it("paso = ⌈hueco ÷ paciencia restante⌉, entre 1 y maxStep", () => {
    expect(P.patienceBudget).toBe(6);
    expect(P.maxStep).toBe(3);
    expect(adaptiveStep(12, 1, P)).toBe(3);
    expect(adaptiveStep(6, 1, P)).toBe(2);
    expect(adaptiveStep(5, 1, P)).toBe(1);
    expect(adaptiveStep(10, 4, P)).toBe(3);
    expect(adaptiveStep(0, 1, P)).toBe(1);
    expect(adaptiveStep(2, 9, P)).toBe(2);
    expect(adaptiveStep(20, 1, { patienceBudget: 6, maxStep: 5 })).toBe(4);
  });

  it("camino previsto: del ancla a nuestro límite en ≤ patienceBudget mensajes", () => {
    expect(plannedSchedule({ side: "buy", reservation: 30, herOpening: 29 })).toEqual([22, 24, 25, 26, 27, 28]);
    expect(plannedSchedule({ side: "buy", reservation: 9, herOpening: 12 })).toEqual([8, 9]);
    expect(plannedSchedule({ side: "sell", reservation: 10, herOpening: 5 })).toEqual([13, 12, 11, 10]);
    expect(plannedSchedule({ side: "buy", reservation: 30, herOpening: 29 }, { ...P, patienceBudget: 3 })).toEqual([22, 25, 28]);
  });

  it("concede con el paso adaptativo mientras ella responde a los pasos grandes", () => {
    const base = { side: "buy" as const, reservation: 59, herOpening: 60 };
    expect(decide(view({ ...base, herPrices: [60], herCurrent: { offerId: 1, price: 60, final: false } })).action).toEqual({ kind: "counter", price: 45 });
    const d1 = decide(view({ ...base, herPrices: [60, 58], herCurrent: { offerId: 2, price: 58, final: false }, ourPrices: [45] }));
    expect(d1.action).toEqual({ kind: "counter", price: 48 });
    expect(d1.rule).toBe("adaptive");
    const d2 = decide(view({ ...base, herPrices: [60, 58, 55], herCurrent: { offerId: 3, price: 55, final: false }, ourPrices: [45, 48] }));
    expect(d2.action).toEqual({ kind: "counter", price: 51 });
  });

  it("vuelve a pasos de 1 si un paso grande no le arrancó más que un paso de 1", () => {
    const base = { side: "buy" as const, reservation: 59, herOpening: 60 };
    const d = decide(view({ ...base, herPrices: [60, 59, 59], herCurrent: { offerId: 3, price: 59, final: false }, ourPrices: [45, 48] }));
    expect(d.action).toEqual({ kind: "counter", price: 49 });
    expect(d.rule).toBe("adaptive-fallback");
    expect(bigStepsDidNotPay([{ index: 1, step: 1, herMove: 2 }, { index: 2, step: 3, herMove: 2 }])).toBe(true);
    expect(bigStepsDidNotPay([{ index: 1, step: 1, herMove: 2 }, { index: 2, step: 3, herMove: 3 }])).toBe(false);
    expect(bigStepsDidNotPay([{ index: 1, step: 2, herMove: 0 }])).toBe(true);
    expect(bigStepsDidNotPay([{ index: 1, step: 1, herMove: 0 }])).toBe(false);
  });

  it("mide su respuesta con su precio al enviar cada mensaje (herAtOurMessages) si se conoce", () => {
    const v = { side: "sell" as const, ourPrices: [20, 19, 18], herPrices: [5, 5, 6, 6, 6], herCurrent: { offerId: 1, price: 6, final: false } };
    expect(stepResponses(v)).toEqual([
      { index: 1, step: 1, herMove: 1 },
      { index: 2, step: 1, herMove: 0 },
    ]);
    expect(stepResponses({ ...v, herAtOurMessages: [5, 5, 5] })).toEqual([
      { index: 1, step: 1, herMove: 0 },
      { index: 2, step: 1, herMove: 1 },
    ]);
  });
});

describe("anclas moderadas", () => {
  it("compra: round(su apertura × 0,75), por debajo de nuestro límite", () => {
    expect(P.buyAnchorFrac).toBe(0.75);
    expect(anchor({ side: "buy", reservation: 30, herOpening: 29 })).toBe(22);
    expect(anchor({ side: "buy", reservation: 20, herOpening: 29 })).toBe(19);
    expect(anchor({ side: "buy", reservation: 9, herOpening: 12 })).toBe(8);
  });

  it("venta con su puja por debajo de nuestro mínimo: ⌈mínimo × 1,3⌉ (hilo 125: 13, no 20)", () => {
    expect(anchor({ side: "sell", reservation: 10, herOpening: 5 })).toBe(13);
    expect(anchor({ side: "sell", reservation: 10, herOpening: 5 }, LEGACY_NEGOTIATOR_PARAMS)).toBe(20);
    expect(anchor({ side: "sell", reservation: 10 })).toBe(13);
  });

  it("venta con su puja por encima de nuestro mínimo: múltiplo de su puja, recortado para cerrarse en la paciencia", () => {
    expect(anchor({ side: "sell", reservation: 6, herOpening: 13 })).toBe(26);
    expect(anchor({ side: "sell", reservation: 6, herOpening: 20 })).toBe(36);
    expect(anchor({ side: "sell", reservation: 6, herOpening: 20 }, { ...P, maxStep: 2 })).toBe(31);
  });

  it("venta con su lista: el ancla nunca pasa de lista × sellAnchorCapMult, aunque el múltiplo de su puja dé más (lista 10 → ≤ 13)", () => {
    expect(P.sellAnchorCapMult).toBe(1.3);
    expect(anchor({ side: "sell", reservation: 6, herOpening: 10, herList: 10 })).toBe(13);
    expect(anchor({ side: "sell", reservation: 6, herOpening: 10, herList: 10 })).toBeLessThanOrEqual(13);
    // sin su lista, sin tope: el múltiplo de su puja manda, como antes.
    expect(anchor({ side: "sell", reservation: 6, herOpening: 10 })).toBe(20);
  });

  it("hilo 125 con el negociador nuevo: puja 5 < 0,7 × mínimo 10 ⇒ una contraoferta (13) y cierre educado (lowball-bid)", () => {
    const base = { side: "sell" as const, reservation: 10, privateValue: 9, herOpening: 5 };
    const first = decide(view({ ...base, herPrices: [5], herCurrent: { offerId: 1, price: 5, final: false }, ourPrices: [] }));
    expect(first.action).toEqual({ kind: "counter", price: 13 });
    const second = decide(view({ ...base, herPrices: [5, 5], herCurrent: { offerId: 2, price: 5, final: false }, ourPrices: [13] }));
    expect(second.action.kind).toBe("close");
    expect(second.rule).toBe("lowball-bid");
    // Si tras la contraoferta sube hasta ≥ 0,7 × mínimo, se sigue negociando.
    expect(decide(view({ ...base, herPrices: [5, 7], herCurrent: { offerId: 3, price: 7, final: false }, ourPrices: [13] })).action.kind).toBe("counter");
    // Una puja inicial plausible (≥ 7) nunca dispara la regla.
    expect(decide(view({ ...base, herOpening: 8, herPrices: [8, 8], herCurrent: { offerId: 4, price: 8, final: false }, ourPrices: [13] })).rule).not.toBe("lowball-bid");
  });

  it("hilo 125 sin la regla lowball (lowballFrac 0): 13 → 12 → 11 → 10 y aguanta; nunca baja de 10 y cierra ante su final 6", () => {
    const p = { ...P, lowballFrac: 0 };
    const her = [5, 5, 6, 6, 6, 6];
    const ours: number[] = [];
    let holdsUsed = 0;
    for (let i = 0; i < her.length; i++) {
      const d = decide(view({ side: "sell", reservation: 10, privateValue: 9, herOpening: 5, herPrices: her.slice(0, i + 1), herCurrent: { offerId: i, price: her[i]!, final: false }, ourPrices: [...ours], holdsUsed }), p);
      if (d.action.kind === "counter") ours.push(d.action.price);
      else if (d.action.kind === "hold") holdsUsed += 1;
    }
    expect(ours).toEqual([13, 12, 11, 10]);
    const last = decide(view({ side: "sell", reservation: 10, privateValue: 9, herOpening: 5, herPrices: her, herCurrent: { offerId: 9, price: 6, final: true }, ourPrices: ours, holdsUsed }), p);
    expect(last.action.kind).toBe("close");
  });
});
