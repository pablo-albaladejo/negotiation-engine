import { describe, expect, it } from "vitest";
import { BazaarAgent, type BazaarApi } from "../../src/dealers/agent.js";
import { DealerInfoSchema, ThreadSchema, type Thread } from "../../src/shared/schemas.js";
import { parseOnly } from "../../src/dealers/planning/plan.js";
import type { TraceRecord } from "../../src/shared/trace.js";

const MENU = DealerInfoSchema.parse({
  id: "abuela",
  name: "Abuela Carmen",
  unlock: { early_min_deals: 3 },
  menu: { sells: [{ rarity: "common", sets: "released", list_price: 10 }], buys: [{ rarity: "common", sets: "released" }] },
});
const CATALOG = { sets: [{ id: "AAA", released: true, cards: ["AAA-01", "AAA-02", "AAA-03", "AAA-04"].map((id) => ({ id, rarity: "common", book: 10 })) }], packs: [] };

/** Abuela que nos compra comunes a 13 fijos (hilo 56): nunca se mueve. `walk` = se va tras nuestro primer mensaje. */
function fixedAbuela(opts: { walk?: boolean } = {}) {
  const posts: string[] = [];
  const assets = [1, 2, 3].map((id) => ({ id, kind: "card", ref: `AAA-0${id}`, rarity: "common", set: "AAA", your_value: 5 }));
  const threads = new Map<number, Thread>();
  let nextThread = 50;
  let nextOffer = 300;
  const herOffer = (asset: number) => ({ id: nextOffer++, maker: "abuela", to: "t02", status: "open", give: { cash: 13 }, want: { assets: [{ id: asset }] }, final: false });
  const api: BazaarApi = {
    me: async () => ({ id: "t02", cash: 413, level: 1, assets: [...assets], album: { pages: [{ set: "AAA", have: assets.length, of: 10 }] }, score: { team: "t02", deals: 1 } }) as never,
    catalog: async () => CATALOG as never,
    value: async () => 1.2,
    myThreads: async () => ({ threads: [...threads.values()].filter((t) => t.status === "open").map((t) => ({ id: t.id, status: t.status, with: "abuela" })) }),
    myOffers: async () => ({ offers: [] }),
    thread: async (id) => structuredClone(threads.get(id)!),
    openThread: async (_with, topic) => {
      posts.push("open");
      const asset = (topic as { sell: { assets: number[] } }).sell.assets[0]!;
      const t = ThreadSchema.parse({ id: nextThread++, status: "open", team: "t02", with: "abuela", topic, messages: [], standing_offers: [herOffer(asset)] });
      threads.set(t.id, t);
      return structuredClone(t);
    },
    say: async (id, text, price) => {
      posts.push(price === undefined ? "say" : `say ${price}`);
      const t = threads.get(id)!;
      const asset = (t.topic as { sell: { assets: number[] } }).sell.assets[0]!;
      for (const o of t.standing_offers) o.status = "cancelled";
      if (price !== undefined) t.standing_offers.push({ id: nextOffer++, maker: "t02", to: "abuela", status: "cancelled", give: { assets: [{ id: asset }] }, want: { cash: price }, final: false });
      if (opts.walk) {
        t.status = "walked";
        t.closed_reason = "walked";
      } else t.standing_offers.push(herOffer(asset));
      return {};
    },
    closeThread: async (id) => {
      posts.push("close");
      threads.get(id)!.status = "closed";
      return {};
    },
    accept: async (offerId) => {
      posts.push(`accept ${offerId}`);
      const t = [...threads.values()].find((x) => x.standing_offers.some((o) => o.id === offerId))!;
      t.standing_offers.find((o) => o.id === offerId)!.status = "accepted";
      t.status = "deal";
      const asset = (t.topic as { sell: { assets: number[] } }).sell.assets[0]!;
      assets.splice(assets.findIndex((a) => a.id === asset), 1);
      return {};
    },
  };
  return { api, posts };
}

function agentFor(api: BazaarApi, extra: Partial<ConstructorParameters<typeof BazaarAgent>[1]> = {}) {
  const records: TraceRecord[] = [];
  const a = new BazaarAgent(api, { dealer: { id: "abuela", aliases: ["Abuela Carmen"] }, dryRun: false, maxSpendPerHour: 50, maxSpendTotal: 50, maxDeals: 2, maxThreads: 2, menu: MENU, trace: { write: (r) => records.push(r) }, now: () => 1_700_000_000_000, ...extra });
  return { a, records };
}

describe("topes de la ejecución y precio fijo en el bucle", () => {
  it("vende 2 comunes a su 13 fijo y se para en max-deals (2 hilos, uno a la vez)", async () => {
    const { api, posts } = fixedAbuela();
    const { a, records } = agentFor(api);
    let tick = 1;
    for (; tick < 40 && !a.done(); tick++) await a.step({ tick, tick_seconds: 60 });
    expect(a.done()).toBe(true);
    expect(a.runStats()).toEqual({ deals: 2, threads: 2, spent: 0 });
    expect(posts.filter((p) => p === "open")).toHaveLength(2);
    expect(posts.filter((p) => p.startsWith("accept"))).toHaveLength(2);
    // Ancla tope lista × 1,3 = 14 (no 26): ya cubre su fijo 13 y cierra en el primer mensaje.
    expect(posts.filter((p) => p.startsWith("say "))).toEqual(["say 14", "say 14"]);
    expect(records.filter((r) => r.action === "accept").map((r) => [r.rule, r.ourPrice])).toEqual([
      ["stuck-accept-within-limit", 13],
      ["stuck-accept-within-limit", 13],
    ]);
    const acc = records.find((r) => r.action === "accept")!;
    expect(acc.patience).toMatchObject({ ourMsgs: 1, untilFinal: false });
    expect(acc.patience!.steps.map((s) => [s.ourPrice, s.step, s.herMove])).toEqual([[14, undefined, 0]]);
    const before = posts.length;
    const after = await a.step({ tick: tick + 1, tick_seconds: 60 });
    expect(posts.length).toBe(before);
    expect(after.map((r) => r.rule)).toEqual(["max-deals"]);
  });

  it("--only: abre solo lo pedido, en ese orden", async () => {
    const { api } = fixedAbuela();
    const lines: string[] = [];
    const { a, records } = agentFor(api, { only: parseOnly("sell:AAA-03,sell:AAA-01"), maxDeals: 2, log: (l) => lines.push(l) });
    for (let tick = 1; tick < 40 && !a.done(); tick++) await a.step({ tick, tick_seconds: 60 });
    expect(records.filter((r) => r.action === "open").map((r) => r.target)).toEqual(["sell:3", "sell:1"]);
    // Ancla tope lista × 1,3 = 14 (no 26): ya cubre su fijo 13 y cierra en el primer mensaje.
    expect(lines.filter((l) => /\n  patience: 1 msgs \/ [23] ticks until close · her replies 0 · steps: anchor 14/.test(l))).toHaveLength(4);
  });

  it("max-threads: no abre más conversaciones que el tope aunque no haya trato", async () => {
    const { api, posts } = fixedAbuela({ walk: true });
    const { a, records } = agentFor(api, { maxThreads: 1 });
    for (let tick = 1; tick < 6; tick++) await a.step({ tick, tick_seconds: 60 });
    expect(posts.filter((p) => p === "open")).toHaveLength(1);
    expect(a.done()).toBe(true);
    expect(records.some((r) => r.rule === "max-threads")).toBe(true);
  });

  it("dry-run: imprime el plan y nunca hace POST", async () => {
    const { api, posts } = fixedAbuela();
    const { a } = agentFor(api, { dryRun: true });
    const plan = (await a.plan()).join("\n");
    for (let tick = 1; tick < 4; tick++) await a.step({ tick, tick_seconds: 60 });
    expect(posts).toEqual([]);
    expect(plan).toContain("would open 2 conversation(s)");
    expect(plan).toContain("first message (price 14)");
    expect(plan).toContain("accept her 13 (rule stuck-accept-within-limit)");
  });
});
