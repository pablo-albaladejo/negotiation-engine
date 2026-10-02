import { describe, expect, it } from "vitest";
import { BazaarAgent, type BazaarApi } from "../../src/dealers/agent.js";
import { numbersIn } from "../../src/dealers/messages.js";
import { ThreadSchema, type Thread } from "../../src/shared/schemas.js";
import type { TraceRecord } from "../../src/shared/trace.js";

const ME = {
  name: "Team 2",
  cash: 400,
  assets: [
    { id: 16, kind: "card", ref: "MAL-02", your_value: 2.2 },
    { id: 23, kind: "card", ref: "MAL-02", your_value: 2.2 },
  ],
};

/** Abuela de mentira: puja 5 por la repetida y sube 1 cada vez que contraofertamos. */
function fakeApi(opts: { closeWith?: { status: string; reason: string } } = {}) {
  const posts: { path: string; body?: unknown }[] = [];
  let thread: Thread | undefined;
  let bid = 5;
  let nextId = 100;
  const herOffer = () => ({ id: nextId++, maker: "abuela", status: "open", give: { cash: bid }, want: { assets: [23] }, final: false });
  const api: BazaarApi = {
    me: async () => ME as never,
    catalog: async () => ({ sets: [], packs: [] }) as never,
    value: async () => 0,
    myThreads: async () => ({ threads: [] }),
    myOffers: async () => ({ offers: [] }),
    thread: async () => thread!,
    openThread: async (withId, topic) => {
      posts.push({ path: "open", body: { withId, topic } });
      thread = ThreadSchema.parse({ id: 7, status: "open", topic, messages: [{ sender: "abuela", price: bid, text: "5?" }], standing_offers: [herOffer()] });
      return thread;
    },
    say: async (id, text, price) => {
      posts.push({ path: "say", body: { id, text, price } });
      if (price !== undefined) {
        bid += 1;
        thread!.messages.push({ sender: "t02", price, text }, { sender: "abuela", price: bid, text: "hmm" });
        for (const o of thread!.standing_offers) o.status = "withdrawn";
        thread!.standing_offers.push(herOffer());
      }
      if (opts.closeWith) {
        thread!.status = opts.closeWith.status;
        thread!.closed_reason = opts.closeWith.reason;
      }
      return {};
    },
    closeThread: async (id) => {
      posts.push({ path: "close", body: { id } });
      return {};
    },
    accept: async (offerId) => {
      posts.push({ path: "accept", body: { offerId } });
      const o = thread!.standing_offers.find((x) => x.id === offerId)!;
      o.status = "accepted";
      thread!.status = "deal";
      return {};
    },
  };
  return { api, posts };
}

function agent(api: BazaarApi, dryRun = false) {
  const records: TraceRecord[] = [];
  const a = new BazaarAgent(api, { dealer: { id: "abuela", aliases: ["Abuela Carmen"] }, dryRun, maxSpendPerHour: 120, trace: { write: (r) => records.push(r) }, now: () => 1_700_000_000_000 });
  return { a, records };
}

const clock = (tick: number) => ({ tick, tick_seconds: 60 });

describe("BazaarAgent", () => {
  it("dry-run: decide qué abrir sin ningún POST", async () => {
    const { api, posts } = fakeApi();
    const { a, records } = agent(api, true);
    await a.step(clock(1));
    expect(posts).toEqual([]);
    expect(records[0]).toMatchObject({ action: "open", target: "sell:23", dryRun: true, rule: "dry-run" });
  });

  it("vende la repetida: abre, contraoferta una vez por tick con la misma cifra en el texto y acepta por AC_next", async () => {
    const { api, posts } = fakeApi();
    const { a, records } = agent(api);
    for (let tick = 1; tick <= 30; tick++) {
      await a.step(clock(tick));
      if (records.some((r) => r.action === "outcome")) break;
    }
    const says = posts.filter((p) => p.path === "say").map((p) => p.body as { text: string; price: number });
    expect(says.length).toBeGreaterThan(0);
    for (const s of says) expect(numbersIn(s.text)).toEqual([s.price]);
    for (let i = 1; i < says.length; i++) expect(says[i]!.price).toBeLessThan(says[i - 1]!.price);
    const ticksWithSay = records.filter((r) => r.action === "counter").map((r) => r.tick);
    expect(new Set(ticksWithSay).size).toBe(ticksWithSay.length);
    const acc = records.find((r) => r.action === "accept")!;
    expect(acc.ourPrice).toBeGreaterThan(5);
    expect(records.find((r) => r.action === "outcome")).toMatchObject({ action: "outcome", status: "deal", settledPrice: acc.ourPrice });
    expect(posts.filter((p) => p.path === "open")).toHaveLength(1);
  });

  it("persona_quota: deja de hablar con el dealer hasta la hora siguiente", async () => {
    const { api, posts } = fakeApi({ closeWith: { status: "closed", reason: "persona_quota" } });
    const { a, records } = agent(api);
    await a.step(clock(1)); // abre
    await a.step(clock(2)); // contraoferta; el dealer cierra por cuota
    await a.step(clock(3)); // ve el cierre
    await a.step(clock(4));
    expect(records.find((r) => r.action === "outcome")).toMatchObject({ closedReason: "persona_quota" });
    expect(records.filter((r) => r.action === "blocked").length).toBeGreaterThanOrEqual(1);
    expect(posts.filter((p) => p.path === "open")).toHaveLength(1);
  });
});
