import { describe, expect, it } from "vitest";
import { BazaarError } from "../../src/bazaar/client.js";
import { DealerInfoSchema, DealersSchema, type Clock } from "../../src/bazaar/schemas.js";
import { runSerious, type SeriousApi, type SeriousOptions } from "../../src/bazaar/serious-run.js";
import type { TraceRecord } from "../../src/bazaar/trace.js";

const NOW = 1_700_000_000_000;
const ABUELA = { id: "abuela", name: "Abuela Carmen", open_to_all: true, traits: { patience: 0.85, strictness: 0.1 }, menu: { sells: [{ rarity: "common", sets: "released", list_price: 10 }], buys: [{ rarity: "common", sets: "released" }], deals_per_team_per_hour: 8 } };
const CHATO = { id: "chato", name: "El Chato", open_to_all: false, traits: { patience: 0.35, strictness: 0.85 }, menu: { sells: [{ rarity: "rare", sets: "released", list_price: 77 }], buys: [{ rarity: "rare", sets: "released" }], deals_per_team_per_hour: 6 } };

function fakeApi(clocks: (Clock | Error)[], unlocked: string[][] = [["abuela"]]) {
  const posts: string[] = [];
  let ci = 0;
  let mi = 0;
  const api: SeriousApi = {
    clock: async () => {
      const c = clocks[Math.min(ci++, clocks.length - 1)]!;
      if (c instanceof Error) throw c;
      return c;
    },
    dealers: async () => DealersSchema.parse({ personas: [ABUELA, CHATO] }) as never,
    dealer: async (id) => DealerInfoSchema.parse(id === "chato" ? CHATO : ABUELA),
    me: async () => ({ id: "t02", cash: 390, level: 1, unlocked: unlocked[Math.min(mi++, unlocked.length - 1)], assets: [], album: { pages: [] }, score: { team: "t02", deals: 2, neg_points: -14.9, rank: 15 } }) as never,
    catalog: async () => ({ sets: [{ id: "AAA", released: true, cards: [{ id: "AAA-01", rarity: "common" }] }], packs: [] }) as never,
    value: async () => 1,
    myThreads: async () => ({ threads: [] }),
    myOffers: async () => ({ offers: [] }),
    thread: async () => {
      throw new Error("no threads");
    },
    openThread: async () => {
      posts.push("open");
      throw new Error("no POST expected");
    },
    say: async () => {
      posts.push("say");
      return {};
    },
    closeThread: async () => {
      posts.push("close");
      return {};
    },
    accept: async () => {
      posts.push("accept");
      return {};
    },
  };
  return { api, posts };
}

function opts(extra: Partial<SeriousOptions> = {}) {
  const lines: string[] = [];
  const sleeps: number[] = [];
  const records: TraceRecord[] = [];
  const o: SeriousOptions = {
    dryRun: true,
    once: true,
    maxSpendPerHour: 60,
    maxSpendTotal: 150,
    cashFloor: 280,
    safety: 1,
    negotiator: {},
    trace: { write: (r) => records.push(r) },
    log: (l) => lines.push(l),
    sleep: async (ms) => {
      sleeps.push(ms);
    },
    now: () => NOW,
    ...extra,
  };
  return { o, lines, sleeps, records };
}

const clock = (tick: number, extra: Record<string, unknown> = {}) => ({ tick, tick_seconds: 60, t_hours: tick / 60, next_tick_in: 30, doors: "open", limits: { max_open_threads_per_team: 6 }, ...extra }) as Clock;

describe("runSerious", () => {
  it("dry-run --once: un dealer desbloqueado, su plan, una línea de estado y ningún POST", async () => {
    const { api, posts } = fakeApi([clock(102)]);
    const { o, lines } = opts();
    const res = await runSerious(api, o);
    expect(res).toMatchObject({ ticks: 1, stoppedBy: "once", deals: 0, spent: 0 });
    expect(posts).toEqual([]);
    expect(lines.some((l) => l.startsWith("dealer abuela (Abuela Carmen): unlocked · quota 8 deals/hour"))).toBe(true);
    expect(lines.some((l) => l.startsWith("== PLAN (dry-run, no POST)"))).toBe(true);
    const status = lines.find((l) => l.startsWith("[tick 102 · 1.70h"))!;
    expect(status).toContain("cash 390 (floor 280) · spent 0/60 this hour, 0/150 run · abuela: idle no-target · chato: locked · deals 2 · neg -14.9 · rank 15");
  });

  it("añade a El Chato cuando se desbloquea, con su perfil (paciencia 3) y su cuota", async () => {
    const { api } = fakeApi([clock(100), clock(101), clock(112)], [["abuela"], ["abuela"], ["abuela"], ["abuela"], ["abuela", "chato"]]);
    let n = 0;
    const { o, lines } = opts({ once: false, shouldStop: () => n++ >= 3, refreshDealersEvery: 10 });
    await runSerious(api, o);
    expect(lines.some((l) => l.startsWith('dealer chato (El Chato): unlocked · quota 6 deals/hour · negotiator {"patienceBudget":3'))).toBe(true);
  });

  it("errores de red pasajeros: espera creciente y sigue; error desconocido: para", async () => {
    const net = new BazaarError("network", "GET /api/clock: TimeoutError", 0);
    const { api } = fakeApi([net, net, clock(5), new Error("boom")]);
    const { o, lines, sleeps } = opts({ once: false });
    const res = await runSerious(api, o);
    expect(sleeps.slice(0, 2)).toEqual([2000, 4000]);
    expect(lines.filter((l) => l.startsWith("transient error (network)"))).toHaveLength(2);
    expect(res.stoppedBy).toBe("unknown-error");
    expect(res.error).toContain("boom");
    expect(lines.at(-1)).toContain("serious mode stopped (unknown-error");
  });

  it("en vivo espera con las puertas cerradas sin dar pasos", async () => {
    const { api, posts } = fakeApi([clock(5, { doors: "closed", next_opens: new Date(NOW + 60_000).toISOString() })]);
    const { o, lines, sleeps } = opts({ dryRun: false, once: true });
    const res = await runSerious(api, o);
    expect(res.ticks).toBe(0);
    expect(posts).toEqual([]);
    expect(lines.some((l) => l.includes("waiting (doors-closed) 62 s"))).toBe(true);
    expect(sleeps).toEqual([]);
  });
});
