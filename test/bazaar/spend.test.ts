import { describe, expect, it } from "vitest";
import { BazaarAgent, type BazaarApi } from "../../src/dealers/agent.js";
import { DealerInfoSchema, ThreadSchema, type Thread } from "../../src/shared/schemas.js";
import { cashFloorOf, statusLine } from "../../src/dealers/serious.js";
import { TeamBudget } from "../../src/dealers/team.js";
import type { TraceRecord } from "../../src/shared/trace.js";

const MENU = DealerInfoSchema.parse({ id: "abuela", menu: { sells: [{ card: "SAL-05", rarity: "uncommon", list_price: 10 }], buys: [] } });
const NOW = 1_700_000_000_000;

/** Abuela who sells us SAL-05 with a final offer of 8; `dealerAccepts`: the deal closes on its own and the thread does not show the price. */
function seller(opts: { dealerAccepts?: boolean } = {}) {
  const posts: string[] = [];
  let cash = 400;
  let thread: Thread | undefined;
  const api: BazaarApi = {
    me: async () => {
      // Between ticks: she accepts our offer and cash drops 9; the closed thread shows no offer.
      if (opts.dealerAccepts && thread?.status === "open") {
        thread = ThreadSchema.parse({ ...thread, status: "deal", standing_offers: [], messages: [] });
        cash -= 9;
      }
      return { id: "t02", cash, assets: [], score: { team: "t02" } } as never;
    },
    catalog: async () => ({ sets: [{ id: "SAL", released: true, cards: [{ id: "SAL-05", rarity: "uncommon", book: 25 }] }], packs: [] }) as never,
    value: async () => 30,
    myThreads: async () => ({ threads: [] }),
    myOffers: async () => ({ offers: [] }),
    thread: async () => structuredClone(thread!),
    openThread: async (_w, topic) => {
      posts.push("open");
      thread = ThreadSchema.parse({ id: 300, status: "open", team: "t02", with: "abuela", topic, messages: [], standing_offers: [{ id: 1, maker: "abuela", status: "open", give: { types: ["card:SAL-05"] }, want: { cash: 8 }, final: true }] });
      return structuredClone(thread);
    },
    say: async () => ({}),
    closeThread: async () => ({}),
    accept: async (id) => {
      posts.push(`accept ${id}`);
      // The closed thread no longer shows the accepted offer ("deal at ?").
      thread = ThreadSchema.parse({ ...thread, status: "deal", standing_offers: [], messages: [] });
      cash -= 8;
      return {};
    },
  };
  return { api, posts };
}

describe("spend: the real price of each purchase is counted", () => {
  const run = async (opts: { dealerAccepts?: boolean }) => {
    const { api, posts } = seller(opts);
    const team = new TeamBudget({ maxSpendPerHour: 60, maxSpendTotal: 150, cashFloor: 20, now: () => NOW });
    const lines: string[] = [];
    const records: TraceRecord[] = [];
    const a = new BazaarAgent(api, { dealer: { id: "abuela", aliases: [] }, dryRun: false, maxSpendPerHour: 60, team, menu: MENU, maxThreads: 1, trace: { write: (r) => records.push(r) }, now: () => NOW, log: (l) => lines.push(l) });
    for (let tick = 1; tick <= 3; tick++) await a.step({ tick, tick_seconds: 60 });
    return { team, posts, lines, a };
  };

  it("we accept her final at 8 and the closed thread does not show the price: 8 counted only once", async () => {
    const { team, posts, a } = await run({});
    expect(posts).toEqual(["open", "accept 1"]);
    expect(team.spentThisHour()).toBe(8);
    expect(team.spentTotal()).toBe(8);
    expect(a.runStats().spent).toBe(8);
  });

  it("the deal closes without our acceptance and with no visible price: the cash drop counts", async () => {
    const { team, lines } = await run({ dealerAccepts: true });
    expect(team.spentThisHour()).toBe(9);
    expect(lines.some((l) => l.includes("9 P counted against the budgets (cash delta)"))).toBe(true);
  });
});

describe("cash floor", () => {
  it("by default 270 + 10; with --cash-floor 20, the floor is 20", () => {
    expect(cashFloorOf(undefined, undefined)).toEqual({ floor: 280, venue: 270, reserve: 10 });
    expect(cashFloorOf("20", undefined)).toEqual({ floor: 20, venue: 20, reserve: 0 });
    expect(cashFloorOf("20", "5")).toEqual({ floor: 25, venue: 20, reserve: 5 });
  });

  it("warns in the status line when the floor exceeds cash", () => {
    const base = { clock: { tick: 130 }, cashFloor: 280, spentHour: 0, maxSpendHour: 60, spentTotal: 0, maxSpendTotal: 150, dealers: [] };
    expect(statusLine({ ...base, cash: 40 })).toContain("cash 40 (floor 280 > cash: WARNING no buys; lower it with --cash-floor)");
    expect(statusLine({ ...base, cash: 40, cashFloor: 20 })).toContain("cash 40 (floor 20) ·");
  });
});
