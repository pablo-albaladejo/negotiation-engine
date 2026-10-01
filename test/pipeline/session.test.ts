import { describe, expect, it } from "vitest";
import { createPipeline } from "../../src/pipeline/pipeline.js";
import { ourLastOffer, rivalCurrentOffer, SessionStore } from "../../src/pipeline/session.js";
import { buyerMandate, champion, makeBrain, turn } from "./helpers.js";

describe("estado de sesión", () => {
  it("mandato y configuración inmutables durante la sesión", () => {
    const store = new SessionStore({ mandateFor: () => buyerMandate, configFor: () => champion, seedFor: () => 1 });
    const session = store.getOrCreate("s");
    expect(() => {
      (session.mandate.reservation as Record<string, number>).pct = 9;
    }).toThrow(TypeError);
    expect(() => {
      (session.config as { beta: number }).beta = 9;
    }).toThrow(TypeError);
    expect(buyerMandate.reservation.pct).toBe(3);
    expect(Object.isFrozen(buyerMandate)).toBe(false);
  });

  it("la versión de configuración queda fija aunque la campeona cambie", () => {
    let version = 1;
    const store = new SessionStore({
      mandateFor: () => buyerMandate,
      configFor: () => ({ ...champion, version }),
      seedFor: () => 1,
    });
    const first = store.getOrCreate("a");
    version = 2;
    expect(store.getOrCreate("a").configVersion).toBe(1);
    expect(first.config.version).toBe(1);
    expect(store.getOrCreate("b").configVersion).toBe(2);
  });

  it("sesiones concurrentes con mandatos distintos no se mezclan", async () => {
    const store = new SessionStore({
      mandateFor: (id) => (id === "buyer" ? { role: "buyer", reservation: { pct: 3 } } : { role: "seller", reservation: { pct: 5 } }),
      configFor: () => champion,
      seedFor: () => 7,
    });
    const shared = createPipeline({ store });
    const outputs = await Promise.all(
      [1, 2, 3].flatMap((round) => [
        shared.turn({ sessionId: "buyer", round, rivalAction: "offer", rivalOffer: { pct: 1 } }),
        shared.turn({ sessionId: "seller", round, rivalAction: "offer", rivalOffer: { pct: 9 } }),
      ]),
    );
    const buyerOffers = outputs.filter((o) => o.sessionId === "buyer").map((o) => (o.action === "walk" ? null : o.offer.pct));
    const sellerOffers = outputs.filter((o) => o.sessionId === "seller").map((o) => (o.action === "walk" ? null : o.offer.pct));
    // El comprador abre alto (quiere descuento) y nunca baja de 3; el vendedor abre bajo y nunca sube de 5.
    for (const pct of buyerOffers) expect(pct!).toBeGreaterThanOrEqual(3);
    for (const pct of sellerOffers) expect(pct!).toBeLessThanOrEqual(5);
    expect(buyerOffers[0]).toBeGreaterThan(sellerOffers[0]!);
    expect(store.get("buyer")!.rivalOffers).toEqual([{ pct: 1 }, { pct: 1 }, { pct: 1 }]);
    expect(store.get("seller")!.rivalOffers).toEqual([{ pct: 9 }, { pct: 9 }, { pct: 9 }]);
  });

  it("guarda nuestra última oferta y la oferta actual del rival", async () => {
    const { brain, store } = makeBrain();
    const out = await brain.turn(turn(1, { rivalAction: "offer", rivalOffer: { pct: 1 } }));
    await brain.turn(turn(2, { rivalAction: "offer", rivalOffer: { pct: 1.5 } }));
    const session = store.get("s1")!;
    expect(rivalCurrentOffer(session)).toEqual({ pct: 1.5 });
    expect(session.ourOffers[0]).toEqual(out.action === "walk" ? undefined : out.offer);
    expect(ourLastOffer(session)).toEqual(session.ourOffers.at(-1));
    expect(session.round).toBe(2);
  });
});
