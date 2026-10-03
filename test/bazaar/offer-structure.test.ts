import { describe, expect, it } from "vitest";
import { BazaarAgent, type BazaarApi } from "../../src/dealers/agent.js";
import { checkStructure, expectationOf, firstMismatch } from "../../src/dealers/negotiation/offer-structure.js";
import { DealerInfoSchema, StandingOfferSchema, ThreadSchema, type Thread } from "../../src/shared/schemas.js";
import type { TraceRecord } from "../../src/shared/trace.js";

const SAL07 = { id: 438, kind: "card", ref: "SAL-07", serial: 10, rarity: "uncommon", set: "SAL", print_run: 90 };
const offer = (o: object) => StandingOfferSchema.parse({ id: 1, maker: "chato", status: "open", final: false, ...o });
const SELL = { side: "sell", assetIds: [438] } as const;

describe("forma de la oferta del dealer", () => {
  it("hilo 257 real: Chato da 13 de efectivo y quiere solo el activo 438 → forma de compra válida", () => {
    const real = offer({ give: { cash: 13, assets: [], types: [] }, want: { cash: 0, assets: [SAL07], types: [] } });
    expect(checkStructure(real, SELL, { accept: true })).toEqual({ ok: true });
  });

  it("venta: si nos ofrece un sobre y pide efectivo (nos vende), nunca se acepta", () => {
    const pack = offer({ give: { cash: 0, assets: [], types: ["pack:sobre_plata"] }, want: { cash: 13, assets: [], types: [] } });
    expect(checkStructure(pack, SELL)).toEqual({ ok: false, reason: "dealer-selling" });
    expect(checkStructure(offer({ give: { cash: 13 }, want: { cash: 13, assets: [SAL07] } }), SELL, { accept: true }).reason).toBe("dealer-selling");
  });

  it("venta: quiere otro activo además del nuestro, o no da efectivo → no", () => {
    const extra = offer({ give: { cash: 40 }, want: { assets: [SAL07, { ...SAL07, id: 439 }] } });
    expect(checkStructure(extra, SELL, { accept: true }).reason).toBe("wants-other-assets");
    expect(checkStructure(offer({ give: { cash: 0 }, want: { assets: [SAL07] } }), SELL, { accept: true }).reason).toBe("no-cash");
    expect(checkStructure(offer({ give: { cash: 12 }, want: { assets: [] } }), SELL, { accept: true }).reason).toBe("wants-other-assets");
    expect(checkStructure(offer({ give: { cash: 12 }, want: { types: ["card:SAL-07"] } }), SELL).reason).toBe("wants-other-assets");
    // Sin aceptar se tolera que aún no repita nuestro activo (sí lo exige al aceptar).
    expect(checkStructure(offer({ give: { cash: 12 } }), SELL)).toEqual({ ok: true });
  });

  it("compra: exactamente la carta pedida, solo efectivo y dentro del límite", () => {
    const exp = { side: "buy", card: "SAL-05" } as const;
    expect(checkStructure(offer({ give: { types: ["card:SAL-05"] }, want: { cash: 20 } }), exp, { accept: true, maxCash: 20 })).toEqual({ ok: true });
    expect(checkStructure(offer({ give: { types: ["card:SAL-05"] }, want: { cash: 21 } }), exp, { accept: true, maxCash: 20 }).reason).toBe("over-limit");
    expect(checkStructure(offer({ give: { types: ["card:SAL-06"] }, want: { cash: 10 } }), exp, { accept: true, maxCash: 20 }).reason).toBe("wrong-goods");
    expect(checkStructure(offer({ give: { types: ["pack:sobre_plata"] }, want: { cash: 10 } }), exp).reason).toBe("wrong-goods");
    expect(checkStructure(offer({ give: { types: ["card:SAL-05", "card:SAL-06"] }, want: { cash: 10 } }), exp).reason).toBe("wrong-goods");
    expect(checkStructure(offer({ give: { cash: 10 }, want: { assets: [SAL07] } }), exp).reason).toBe("dealer-buying");
    // Aún sin revelar la carta: se puede seguir negociando, pero no aceptar.
    expect(checkStructure(offer({ want: { cash: 10 } }), exp)).toEqual({ ok: true });
    expect(checkStructure(offer({ want: { cash: 10 } }), exp, { accept: true, maxCash: 20 }).reason).toBe("wrong-goods");
  });

  it("compra rareza+set: la carta que da debe ser de esa rareza y set", () => {
    const exp = expectationOf({ buy: { rarity: "uncommon", set: "SAL" } }, "buy", (ref) => ref === "SAL-05")!;
    expect(checkStructure(offer({ give: { assets: [{ ...SAL07, ref: "SAL-05" }] }, want: { cash: 9 } }), exp, { accept: true, maxCash: 9 })).toEqual({ ok: true });
    expect(checkStructure(offer({ give: { types: ["card:LAT-01"] }, want: { cash: 9 } }), exp).reason).toBe("wrong-goods");
  });

  it("firstMismatch revisa todas sus ofertas del hilo (mensajes y vigentes)", () => {
    const thread = ThreadSchema.parse({
      id: 1,
      topic: { sell: { assets: [438] } },
      messages: [{ sender: "chato", offer: { id: 5, maker: "chato", give: { types: ["pack:sobre_plata"] }, want: { cash: 13 } } }],
      standing_offers: [{ id: 6, maker: "chato", status: "open", give: { cash: 13 }, want: { assets: [SAL07] } }],
    });
    expect(firstMismatch(thread, { id: "chato", aliases: [] }, SELL)).toMatchObject({ offer: { id: 5 }, reason: "dealer-selling" });
  });
});

const MENU = DealerInfoSchema.parse({ id: "chato", name: "El Chato", menu: { sells: [{ rarity: "uncommon", sets: "released", list_price: 26 }], buys: [{ rarity: "uncommon", sets: "released" }] } });

/** Dealer que, en un hilo de venta, responde con una oferta de forma `herOffer` a un precio muy bueno. */
function dealerWith(herOffer: (asset: number) => object) {
  const posts: string[] = [];
  const threads = new Map<number, Thread>();
  let nextOffer = 500;
  const api: BazaarApi = {
    me: async () => ({ id: "t02", cash: 400, assets: [{ ...SAL07, your_value: 9 }], score: { team: "t02" } }) as never,
    catalog: async () => ({ sets: [{ id: "SAL", released: true, cards: [{ id: "SAL-07", rarity: "uncommon", book: 20 }] }], packs: [] }) as never,
    value: async () => 9,
    myThreads: async () => ({ threads: [...threads.values()].filter((t) => t.status === "open").map((t) => ({ id: t.id, status: t.status, with: "chato" })) }),
    myOffers: async () => ({ offers: [] }),
    thread: async (id) => structuredClone(threads.get(id)!),
    openThread: async (_with, topic) => {
      posts.push("open");
      const t = ThreadSchema.parse({ id: 257, status: "open", team: "t02", with: "chato", topic, messages: [], standing_offers: [{ id: nextOffer++, maker: "chato", to: "t02", status: "open", final: false, ...herOffer(438) }] });
      threads.set(t.id, t);
      return structuredClone(t);
    },
    say: async (_id, _text, price) => {
      posts.push(price === undefined ? "say" : `say ${price}`);
      return {};
    },
    closeThread: async (id) => {
      posts.push("close");
      threads.get(id)!.status = "closed";
      return {};
    },
    accept: async (offerId) => {
      posts.push(`accept ${offerId}`);
      return {};
    },
  };
  return { api, posts };
}

describe("el agente nunca acepta una oferta con forma equivocada", () => {
  const run = async (herOffer: (asset: number) => object) => {
    const { api, posts } = dealerWith(herOffer);
    const records: TraceRecord[] = [];
    const lines: string[] = [];
    const a = new BazaarAgent(api, { dealer: { id: "chato", aliases: ["El Chato"] }, dryRun: false, maxSpendPerHour: 50, maxThreads: 1, menu: MENU, trace: { write: (r) => records.push(r) }, now: () => 1_700_000_000_000, log: (l) => lines.push(l) });
    for (let tick = 1; tick < 6; tick++) await a.step({ tick, tick_seconds: 60 });
    return { posts, records, lines };
  };

  it("venta en la que el dealer nos vende un sobre por 13: cierra educadamente tras leerla (structure-mismatch)", async () => {
    const { posts, records, lines } = await run(() => ({ give: { cash: 0, types: ["pack:sobre_plata"] }, want: { cash: 13 } }));
    expect(posts.some((p) => p.startsWith("accept"))).toBe(false);
    expect(posts).toEqual(["open", "say", "close"]);
    expect(records.find((r) => r.action === "close")?.rule).toBe("structure-mismatch");
    expect(lines.some((l) => l.includes("structure-mismatch (dealer-selling"))).toBe(true);
  });

  it("venta con 99 de efectivo pero pidiendo además otro activo: nunca acepta", async () => {
    const { posts, records } = await run((asset) => ({ give: { cash: 99 }, want: { assets: [{ id: asset }, { id: 999 }] }, final: true }));
    expect(posts.some((p) => p.startsWith("accept"))).toBe(false);
    expect(records.find((r) => r.action === "close")?.rule).toBe("structure-mismatch");
  });

  it("control: la misma puja final con la forma correcta sí se acepta", async () => {
    const { posts } = await run((asset) => ({ give: { cash: 99 }, want: { assets: [{ id: asset }] }, final: true }));
    expect(posts.slice(0, 2)).toEqual(["open", "accept 500"]);
  });
});
