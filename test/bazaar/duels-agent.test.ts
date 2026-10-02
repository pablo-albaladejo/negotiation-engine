import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { BazaarError } from "../../src/shared/client.js";
import { textMatchesOffer } from "../../src/duels/duels.js";
import { DuelsAgent, formatDuelEntry, formatNextDuels, loadDuelsMemory, ticksLeft } from "../../src/duels/agent.js";
import { DuelSchema, DuelsSchema, rivalOfferFrom, ScheduleSchema, type Duel, type DuelsApi, type StructuredOffer } from "../../src/duels/schemas.js";

interface FakeDuel {
  id: number | string;
  role: "seller" | "buyer";
  limit: number;
  /** Límite privado del rival (bot): comprador paga hasta aquí, vendedor no baja de aquí. */
  rivalLimit: number;
  rivalOffer?: StructuredOffer;
  issues: string[];
  deadline: number;
  done?: "deal" | "expired";
  dealPrice?: number;
}

/** Servidor de mentira con rivales que parten la diferencia y aceptan si nuestra oferta cubre su límite a medias. */
function fakeServer(duels: FakeDuel[], opts: { failSay?: string } = {}) {
  let tick = 100;
  const posts: { tick: number; kind: "say" | "accept"; id: number | string; text?: string; offer?: StructuredOffer }[] = [];
  const api: DuelsApi = {
    clock: async () => ({ tick, tick_seconds: 30, next_tick_in: 10 }),
    duels: async () =>
      DuelsSchema.parse({
        duels: duels
          .filter((d) => !d.done)
          .map((d) => ({ id: d.id, role: d.role, your_limit: d.limit, rival_offer: d.rivalOffer ?? null, deadline: d.deadline, issues: d.issues })),
      }),
    schedule: async () => ScheduleSchema.parse({ now_hours: 1.7, upcoming: [] }),
    say: async (id, text, offer) => {
      if (opts.failSay) throw new BazaarError(opts.failSay, "", 429);
      posts.push({ tick, kind: "say", id, text, offer });
      const d = duels.find((x) => x.id === id)!;
      const ourSeller = d.role === "seller";
      const current = d.rivalOffer?.price ?? (ourSeller ? Math.round(d.rivalLimit * 0.5) : Math.round(d.rivalLimit * 1.6));
      const fine = ourSeller ? offer.price <= d.rivalLimit * 0.85 : offer.price >= d.rivalLimit * 1.15;
      if (fine) {
        d.done = "deal";
        d.dealPrice = offer.price;
        return {};
      }
      const next = Math.round(current + (offer.price - current) / 3);
      d.rivalOffer = offer.days === undefined ? { price: next } : { price: next, days: 7 };
      return {};
    },
    accept: async (id) => {
      posts.push({ tick, kind: "accept", id });
      const d = duels.find((x) => x.id === id)!;
      d.done = "deal";
      d.dealPrice = d.rivalOffer!.price;
      return {};
    },
  };
  return { api, posts, advance: () => (tick += 1), tick: () => tick };
}

describe("DuelsAgent (bucle con API de mentira)", () => {
  const cleanupDirs: string[] = [];
  afterEach(() => {
    for (const dir of cleanupDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it("dry-run: ningún POST y abre con el ancla", async () => {
    const s = fakeServer([{ id: 1, role: "seller", limit: 40, rivalLimit: 100, issues: ["price"], deadline: 116 }]);
    const agent = new DuelsAgent(s.api, { dryRun: true });
    const r = await agent.step();
    expect(s.posts).toHaveLength(0);
    expect(r.entries[0]).toMatchObject({ outcome: "dry-run", decision: { action: "counter", offer: { price: 60 } } });
    expect(formatDuelEntry(r.entries[0]!)).toContain("COUNTER 60 P");
  });

  it("cierra varios duelos en pocos tics, sin cruzar límites, un mensaje por duelo y tick y una aceptación por tick", async () => {
    const duels: FakeDuel[] = [
      { id: 1, role: "seller", limit: 40, rivalLimit: 100, issues: ["price"], deadline: 116 },
      { id: 2, role: "buyer", limit: 90, rivalLimit: 30, issues: ["price"], deadline: 116 },
      { id: 3, role: "seller", limit: 20, rivalLimit: 60, issues: ["price", "days"], deadline: 116 },
    ];
    const s = fakeServer(duels);
    const agent = new DuelsAgent(s.api, { dryRun: false });
    for (let k = 0; k < 16 && duels.some((d) => !d.done); k++) {
      await agent.step();
      s.advance();
    }
    expect(duels.every((d) => d.done === "deal")).toBe(true);
    for (const d of duels) {
      if (d.role === "seller") expect(d.dealPrice!).toBeGreaterThanOrEqual(d.limit);
      else expect(d.dealPrice!).toBeLessThanOrEqual(d.limit);
      expect(s.posts.filter((p) => p.id === d.id && p.kind === "say").length).toBeLessThanOrEqual(5);
    }
    const perTick = new Map<string, number>();
    for (const p of s.posts) {
      const key = p.kind === "accept" ? `${p.tick}:accept` : `${p.tick}:${p.id}`;
      perTick.set(key, (perTick.get(key) ?? 0) + 1);
      if (p.kind === "say") expect(textMatchesOffer(p.text!, p.offer!)).toBe(true);
      if (p.kind === "say" && duels.find((d) => d.id === p.id)!.issues.includes("days")) {
        expect(p.offer!.days).toBeGreaterThanOrEqual(0);
        expect(p.offer!.days).toBeLessThanOrEqual(10);
      }
    }
    expect([...perTick.values()].every((n) => n === 1)).toBe(true);
  });

  it("dos aceptaciones posibles en el mismo tick: acepta la de más excedente y aplaza la otra", async () => {
    const duels: FakeDuel[] = [
      { id: 1, role: "seller", limit: 40, rivalLimit: 200, rivalOffer: { price: 100 }, issues: ["price"], deadline: 116 },
      { id: 2, role: "seller", limit: 40, rivalLimit: 200, rivalOffer: { price: 150 }, issues: ["price"], deadline: 116 },
    ];
    const s = fakeServer(duels);
    const r = await new DuelsAgent(s.api, { dryRun: false }).step();
    expect(r.entries.find((e) => e.duelId === 2)!.outcome).toBe("sent");
    expect(r.entries.find((e) => e.duelId === 1)!.outcome).toBe("deferred");
    expect(s.posts).toEqual([{ tick: 100, kind: "accept", id: 2 }]);
  });

  it("si la aceptación de más excedente falla (no_offer), acepta la siguiente en el mismo tick", async () => {
    const duels: FakeDuel[] = [
      { id: 1, role: "seller", limit: 40, rivalLimit: 200, rivalOffer: { price: 100 }, issues: ["price"], deadline: 116 },
      { id: 2, role: "seller", limit: 40, rivalLimit: 200, rivalOffer: { price: 150 }, issues: ["price"], deadline: 116 },
    ];
    const s = fakeServer(duels);
    const realAccept = s.api.accept;
    s.api.accept = async (id) => {
      if (id === 2) throw new BazaarError("no_offer", "", 409);
      return realAccept(id);
    };
    const r = await new DuelsAgent(s.api, { dryRun: false }).step();
    const d2 = r.entries.find((e) => e.duelId === 2)!;
    expect(d2.outcome).toBe("error:no_offer");
    // La oferta obsoleta del rival se iguala con una contraoferta a su mismo precio.
    expect(d2.fallback).toBe("match 150 P: sent");
    expect(r.entries.find((e) => e.duelId === 1)!.outcome).toBe("sent");
    expect(s.posts.map((x) => ({ kind: x.kind, id: x.id, price: x.offer?.price }))).toEqual([
      { kind: "say", id: 2, price: 150 },
      { kind: "accept", id: 1, price: undefined },
    ]);
  });

  it("nunca toma nuestro propio mensaje (from=\"you\") como oferta del rival", async () => {
    const parsed = DuelsSchema.parse({
      duels: [{ id: 36, role: "buyer", your_limit: 102, rival_offer: null, deadline: 500, issues: ["price"],
        messages: [{ tick: 144, from: "you", text: "I would propose 68 P", price: 68 }] }],
    });
    expect(rivalOfferFrom(parsed.duels[0]!)).toBeUndefined();
    const withRival = DuelsSchema.parse({
      duels: [{ id: 37, role: "buyer", your_limit: 102, rival_offer: null, deadline: 500, issues: ["price"],
        messages: [{ tick: 144, from: "you", price: 68 }, { tick: 145, from: "Rival Noche", price: 99 }] }],
    });
    expect(rivalOfferFrom(withRival.duels[0]!)?.price).toBe(99);
  });

  it("un error del servidor (wait_for_tick) no rompe el bucle ni cuenta como oferta enviada", async () => {
    const s = fakeServer([{ id: 1, role: "seller", limit: 40, rivalLimit: 100, issues: ["price"], deadline: 116 }], { failSay: "wait_for_tick" });
    const agent = new DuelsAgent(s.api, { dryRun: false });
    const r = await agent.step();
    expect(r.entries[0]!.outcome).toBe("error:wait_for_tick");
    s.advance();
    const again = await agent.step();
    expect(again.entries[0]!.decision.round).toBe(0);
  });

  it("rival silencioso: abre una vez y luego espera sin ceder, por muchos tics que pasen (sin rival_offer nunca)", async () => {
    let tick = 100;
    const posts: { tick: number; kind: "say" | "accept" }[] = [];
    const api: DuelsApi = {
      clock: async () => ({ tick, tick_seconds: 30, next_tick_in: 10 }),
      duels: async () => DuelsSchema.parse({ duels: [{ id: 1, role: "seller", your_limit: 40, rival_offer: null, deadline: 500, issues: ["price"] }] }),
      schedule: async () => ScheduleSchema.parse({ now_hours: 1, upcoming: [] }),
      say: async (id, text, offer) => {
        posts.push({ tick, kind: "say" });
        return {};
      },
      accept: async (id) => {
        posts.push({ tick, kind: "accept" });
        return {};
      },
    };
    const agent = new DuelsAgent(api, { dryRun: false });
    const rounds: number[] = [];
    for (let k = 0; k < 10; k++) {
      const r = await agent.step();
      rounds.push(r.entries[0]!.decision.round);
      tick += 1;
    }
    expect(posts).toHaveLength(1); // solo la apertura: sin contraoferta del rival, nunca se concede más
    expect(rounds.slice(1).every((round) => round === 1)).toBe(true); // ronda 1 (apertura ya enviada) estancada
  });

  it("rival que sí contesta: concede en la siguiente ronda en vez de quedarse atascado", async () => {
    const duels: FakeDuel[] = [{ id: 1, role: "seller", limit: 40, rivalLimit: 60, issues: ["price"], deadline: 116 }];
    const s = fakeServer(duels);
    const agent = new DuelsAgent(s.api, { dryRun: false });
    const first = await agent.step();
    s.advance();
    const second = await agent.step();
    expect(second.entries[0]!.decision.action).toBe("counter");
    expect(second.entries[0]!.decision.offer!.price).toBeLessThan(first.entries[0]!.decision.offer!.price);
    expect(s.posts.filter((p) => p.kind === "say")).toHaveLength(2);
  });

  it("reinicio con fichero de estado: no reabre ni repite la oferta tras recrear el agente", async () => {
    const dir = mkdtempSync(join(tmpdir(), "duels-state-"));
    const stateFile = join(dir, "duels-state.json");
    cleanupDirs.push(dir);
    const duels: FakeDuel[] = [{ id: 1, role: "seller", limit: 40, rivalLimit: 60, issues: ["price"], deadline: 116 }];
    const s = fakeServer(duels);
    const agent1 = new DuelsAgent(s.api, { dryRun: false, stateFile });
    const r1 = await agent1.step();
    expect(r1.entries[0]!.decision.round).toBe(0);
    expect(s.posts).toHaveLength(1);
    s.advance();

    // "Reinicio": un agente nuevo, memoria en proceso vacía, pero recupera el fichero persistido.
    const loaded = loadDuelsMemory(stateFile);
    expect(loaded.get("1")?.ourOffers).toHaveLength(1);
    const agent2 = new DuelsAgent(s.api, { dryRun: false, stateFile });
    const r2 = await agent2.step();
    expect(r2.entries[0]!.decision.round).toBe(1); // sigue donde lo dejó: no reabre (ronda 0 otra vez)
    expect(s.posts.filter((p) => p.kind === "say")).toHaveLength(2); // y no repite el mismo mensaje
  });

  it("reinicio sin fichero de estado: stateOf lee nuestra última oferta de your_offer y la del rival del último mensaje suyo", () => {
    const duel = DuelSchema.parse({
      id: 7,
      role: "seller",
      your_limit: 40,
      rival_offer: null,
      your_offer: { id: 1, price: 60, tick: 95 },
      messages: [
        { sender: "you", price: 60, text: "60 P" },
        { sender: "Rival Luna", price: 50, text: "50 P" },
      ],
      deadline: 200,
      issues: ["price"],
    });
    const api: DuelsApi = {
      clock: async () => ({ tick: 100, tick_seconds: 30 }),
      duels: async () => DuelsSchema.parse({ duels: [] }),
      schedule: async () => ScheduleSchema.parse({ upcoming: [] }),
      say: async () => ({}),
      accept: async () => ({}),
    };
    const agent = new DuelsAgent(api, { dryRun: true });
    const { state, rival } = agent.stateOf(duel, { tick: 100, tick_seconds: 30, next_tick_in: 10 });
    expect(rival).toEqual({ price: 50 }); // leído del último mensaje suyo, no de rival_offer (null)
    expect(state.ourOffers).toEqual([{ price: 60 }]); // nuestra oferta ya enviada, sin reabrir desde cero
    expect(state.rivalMovedSinceOurLast).toBe(true);
    expect(state.ticksSinceOurLast).toBe(5);
  });
});

describe("utilidades del bucle", () => {
  it("ticksLeft: número de tick, ISO y epoch", () => {
    const clock = { tick: 100, tick_seconds: 30 };
    expect(ticksLeft(112, clock, 0)).toBe(12);
    expect(ticksLeft(90, clock, 0)).toBe(0);
    expect(ticksLeft(new Date(60_000).toISOString(), clock, 0)).toBe(2);
    expect(ticksLeft(2_000_000_000, clock, 2_000_000_000_000 - 60_000)).toBe(2);
    expect(ticksLeft(undefined as Duel["deadline"], clock, 0)).toBeUndefined();
  });

  it("formatNextDuels: próxima sesión de duelos desde /api/schedule", () => {
    const schedule = ScheduleSchema.parse({
      now_hours: 1.7,
      upcoming: [
        { at_hours: 3, action: "bench" },
        { at_hours: 2, action: "duels", params: { name: "Practice duels", duel_ticks: 12, decay: 0.06, max_concurrent: 6, practice: true } },
      ],
    });
    expect(formatNextDuels(schedule, { tick_seconds: 60 })).toBe(
      'no duels scheduled now · next: "Practice duels" at 2.00 h (now 1.70 h; in ~18 ticks ≈ 18 min at 60 s/tick) · price · 12 ticks per duel · decay 6%/round · max 6 at once · practice (not scored)',
    );
    expect(formatNextDuels(ScheduleSchema.parse({ upcoming: [] }), {})).toMatch(/no upcoming duels/);
  });
});
