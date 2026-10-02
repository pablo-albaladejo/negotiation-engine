import { describe, expect, it } from "vitest";
import { BazaarAgent, type BazaarApi } from "../../src/bazaar/agent.js";
import { DealerInfoSchema, ThreadSchema, type Thread } from "../../src/bazaar/schemas.js";
import { cashFloorOf, statusLine } from "../../src/bazaar/serious.js";
import { TeamBudget } from "../../src/bazaar/team.js";
import type { TraceRecord } from "../../src/bazaar/trace.js";

const MENU = DealerInfoSchema.parse({ id: "abuela", menu: { sells: [{ card: "SAL-05", rarity: "uncommon", list_price: 10 }], buys: [] } });
const NOW = 1_700_000_000_000;

/** Abuela que nos vende SAL-05 con una oferta final a 8; `dealerAccepts`: el trato se cierra solo y el hilo no deja ver el precio. */
function seller(opts: { dealerAccepts?: boolean } = {}) {
  const posts: string[] = [];
  let cash = 400;
  let thread: Thread | undefined;
  const api: BazaarApi = {
    me: async () => {
      // Entre ticks: ella acepta nuestra oferta y la caja baja 9; el hilo cerrado no muestra ninguna oferta.
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
      // El hilo cerrado ya no muestra la oferta aceptada ("deal at ?").
      thread = ThreadSchema.parse({ ...thread, status: "deal", standing_offers: [], messages: [] });
      cash -= 8;
      return {};
    },
  };
  return { api, posts };
}

describe("gasto: se cuenta el precio real de cada compra", () => {
  const run = async (opts: { dealerAccepts?: boolean }) => {
    const { api, posts } = seller(opts);
    const team = new TeamBudget({ maxSpendPerHour: 60, maxSpendTotal: 150, cashFloor: 20, now: () => NOW });
    const lines: string[] = [];
    const records: TraceRecord[] = [];
    const a = new BazaarAgent(api, { dealer: { id: "abuela", aliases: [] }, dryRun: false, maxSpendPerHour: 60, team, menu: MENU, maxThreads: 1, trace: { write: (r) => records.push(r) }, now: () => NOW, log: (l) => lines.push(l) });
    for (let tick = 1; tick <= 3; tick++) await a.step({ tick, tick_seconds: 60 });
    return { team, posts, lines, a };
  };

  it("aceptamos su final a 8 y el hilo cerrado no deja ver el precio: 8 contado una sola vez", async () => {
    const { team, posts, a } = await run({});
    expect(posts).toEqual(["open", "accept 1"]);
    expect(team.spentThisHour()).toBe(8);
    expect(team.spentTotal()).toBe(8);
    expect(a.runStats().spent).toBe(8);
  });

  it("el trato se cierra sin nuestra aceptación y sin precio visible: cuenta la caída de caja", async () => {
    const { team, lines } = await run({ dealerAccepts: true });
    expect(team.spentThisHour()).toBe(9);
    expect(lines.some((l) => l.includes("9 P counted against the budgets (cash delta)"))).toBe(true);
  });
});

describe("suelo de caja", () => {
  it("por defecto 270 + 10; con --cash-floor 20, el suelo es 20", () => {
    expect(cashFloorOf(undefined, undefined)).toEqual({ floor: 280, venue: 270, reserve: 10 });
    expect(cashFloorOf("20", undefined)).toEqual({ floor: 20, venue: 20, reserve: 0 });
    expect(cashFloorOf("20", "5")).toEqual({ floor: 25, venue: 20, reserve: 5 });
  });

  it("avisa en la línea de estado cuando el suelo supera la caja", () => {
    const base = { clock: { tick: 130 }, cashFloor: 280, spentHour: 0, maxSpendHour: 60, spentTotal: 0, maxSpendTotal: 150, dealers: [] };
    expect(statusLine({ ...base, cash: 40 })).toContain("cash 40 (floor 280 > cash: WARNING no buys; lower it with --cash-floor)");
    expect(statusLine({ ...base, cash: 40, cashFloor: 20 })).toContain("cash 40 (floor 20) ·");
  });
});
