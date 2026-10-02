import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BazaarAgent, type BazaarApi } from "../../src/bazaar/agent.js";
import { BazaarError } from "../../src/bazaar/client.js";
import { dealsPerHourOf, gameHours, negotiatorForDealer, patienceBudgetFor, traitsOf, unlockedDealerIds } from "../../src/bazaar/dealer-profile.js";
import { appendLesson, deriveLessons, lessonFromSummary, PendingLessons, type LessonEntry } from "../../src/bazaar/lessons.js";
import { decide, DEFAULT_NEGOTIATOR_PARAMS } from "../../src/bazaar/negotiator.js";
import { DealerInfoSchema, ThreadSchema, type Clock, type Me, type Thread } from "../../src/bazaar/schemas.js";
import { Backoff, classifyError, classifyThrown, clockGate, statusLine, worstError } from "../../src/bazaar/serious.js";
import { TeamBudget } from "../../src/bazaar/team.js";
import { formatThreadSummary, outcomeOf, revealedCards, type ThreadSummary } from "../../src/bazaar/thread-log.js";
import type { TraceRecord } from "../../src/bazaar/trace.js";

const NOW = 1_700_000_000_000;
const clock = (tick: number, extra: Partial<Clock> & Record<string, unknown> = {}): Clock => ({ tick, tick_seconds: 60, t_hours: tick / 60, ...extra }) as Clock;

describe("TeamBudget: topes compartidos y suelo de caja", () => {
  it("lo que queda es el mínimo de hora, ejecución y caja por encima del suelo; una aceptación por tick para el equipo", () => {
    const t = new TeamBudget({ maxSpendPerHour: 60, maxSpendTotal: 150, cashFloor: 280, now: () => NOW });
    expect(t.left(390)).toBe(60);
    expect(t.left(300)).toBe(20);
    t.record(50);
    expect(t.left(390)).toBe(10);
    expect(t.spentTotal()).toBe(50);
    expect(t.canAccept(5)).toBe(true);
    t.markAccept(5);
    expect(t.canAccept(5)).toBe(false);
    expect(t.canAccept(6)).toBe(true);
  });
});

describe("perfil por dealer", () => {
  const chato = { traits: { patience: 0.35, generosity: 0.25, shrewdness: 0.85, memory: 0.9, strictness: 0.85 } };
  it("El Chato: paciencia 3, ancla moderada y un solo aguante; Abuela: 6 como en vivo", () => {
    expect(patienceBudgetFor(traitsOf(chato))).toBe(3);
    expect(negotiatorForDealer(traitsOf(chato))).toEqual({ patienceBudget: 3, buyAnchorFrac: 0.85, sellAnchorMult: 1.5, sellFloorAnchorMult: 1.15, maxHolds: 1 });
    expect(negotiatorForDealer(traitsOf({ traits: { patience: 0.85, strictness: 0.1 } }))).toEqual({ patienceBudget: 6 });
    expect(negotiatorForDealer(traitsOf({}))).toEqual({});
  });
  it("El Chato con su id aplica el ajuste medido del feed (paciencia 8, paso 1, sin aguantes); Abuela no cambia", () => {
    expect(negotiatorForDealer(traitsOf(chato), "chato")).toEqual({
      patienceBudget: 8,
      buyAnchorFrac: 0.85,
      sellAnchorMult: 1.7,
      sellFloorAnchorMult: 1.15,
      maxHolds: 0,
      maxStep: 1,
    });
    const abuelaTraits = traitsOf({ traits: { patience: 0.85, strictness: 0.1 } });
    expect(negotiatorForDealer(abuelaTraits, "abuela")).toEqual({ patienceBudget: 6 });
    expect(negotiatorForDealer(abuelaTraits, "abuela")).toEqual(negotiatorForDealer(abuelaTraits));
  });
  it("cuota por hora del menú, dealers desbloqueados y horas de juego", () => {
    expect(dealsPerHourOf(DealerInfoSchema.parse({ id: "chato", menu: { sells: [], buys: [], deals_per_team_per_hour: 6 } }))).toBe(6);
    const dealers = [{ id: "abuela", open_to_all: true }, { id: "chato", open_to_all: false }];
    expect(unlockedDealerIds({ cash: 1, assets: [], unlocked: ["abuela"] } as Me, dealers)).toEqual(["abuela"]);
    expect(unlockedDealerIds({ cash: 1, assets: [], unlocked: ["abuela", "chato"] } as Me, dealers)).toEqual(["abuela", "chato"]);
    expect(unlockedDealerIds({ cash: 1, assets: [] } as Me, dealers)).toEqual(["abuela"]);
    expect(gameHours(clock(102, { t_hours: 1.7 }))).toBe(1.7);
    expect(gameHours({ tick: 120, tick_seconds: 30 })).toBe(1);
  });
});

describe("modo serio: reloj, errores, espera y estado", () => {
  it("espera con el reloj en pausa o las puertas cerradas (hasta next_opens, en tramos de 5 min)", () => {
    expect(clockGate(clock(1, { paused: true, next_tick_in: 20 }))).toEqual({ run: false, reason: "paused", waitMs: 20_000 });
    const closed = clockGate(clock(1, { doors: "closed", next_opens: new Date(NOW + 3_600_000).toISOString() }), NOW);
    expect(closed).toEqual({ run: false, reason: "doors-closed", waitMs: 300_000 });
    expect(clockGate(clock(1, { doors: "closed", next_opens: new Date(NOW + 30_000).toISOString() }), NOW).waitMs).toBe(32_000);
    expect(clockGate(clock(1, { doors: "open" }))).toEqual({ run: true, waitMs: 0 });
  });
  it("clasifica errores: pasajeros (red, rate limit), gestionados por el agente, desconocidos (paran)", () => {
    expect(classifyError("network")).toBe("transient");
    expect(classifyError("http_503")).toBe("transient");
    expect(classifyError("persona_quota")).toBe("handled");
    expect(classifyError("invalid", "card-topic-unsupported")).toBe("handled");
    expect(classifyError("exception")).toBe("unknown");
    expect(classifyError("bad_response")).toBe("unknown");
    expect(classifyThrown(new BazaarError("network", "GET /api/clock: TimeoutError", 0))).toEqual({ cls: "transient", code: "network" });
    expect(classifyThrown(new TypeError("fetch failed"))).toEqual({ cls: "transient", code: "network" });
    expect(classifyThrown(new Error("boom")).cls).toBe("unknown");
    const rec = (error: string, rule?: string) => ({ ts: "", tick: 1, dealer: "abuela", dryRun: true, action: "error", error, ...(rule ? { rule } : {}) }) as TraceRecord;
    expect(worstError([rec("persona_quota"), rec("network")])).toEqual({ cls: "transient", code: "network" });
    expect(worstError([rec("network"), rec("exception")])).toEqual({ cls: "unknown", code: "exception" });
    expect(worstError([])).toBeUndefined();
  });
  it("espera creciente 2 s, 4 s, 8 s… hasta 60 s y se reinicia", () => {
    const b = new Backoff();
    expect([b.next(), b.next(), b.next(), b.next(), b.next(), b.next(), b.next()]).toEqual([2000, 4000, 8000, 16000, 32000, 60000, 60000]);
    b.reset();
    expect(b.next()).toBe(2000);
  });
  it("una línea de estado por tick", () => {
    const line = statusLine({ clock: clock(102, { t_hours: 1.7, doors: "open" }), cash: 390, cashFloor: 280, spentHour: 0, maxSpendHour: 60, spentTotal: 0, maxSpendTotal: 150, dealers: [{ id: "abuela", state: "idle no-target" }, { id: "chato", state: "locked" }], deals: 2, negPoints: -14.9, rank: 15 });
    expect(line).toBe("[tick 102 · 1.70h · open] cash 390 (floor 280) · spent 0/60 this hour, 0/150 run · abuela: idle no-target · chato: locked · deals 2 · neg -14.9 · rank 15");
  });
});

describe("negociador: precio lejano al comprar tras revelar la carta", () => {
  it("compra: su precio > nuestro máximo ÷ 0,7 tras una contraoferta ⇒ cierre educado (lowball-bid)", () => {
    const v = { side: "buy" as const, reservation: 8, privateValue: 8.1, herOpening: 29, herPrices: [29, 28], herCurrent: { offerId: 2, price: 28, final: false }, ourPrices: [7], canMessage: true, canAccept: true };
    expect(decide(v).rule).toBe("lowball-bid");
    expect(decide({ ...v, reservation: 24, ourPrices: [22] }, DEFAULT_NEGOTIATOR_PARAMS).rule).not.toBe("lowball-bid");
  });
});

/** Abuela que nos vende rareza+set (rechaza `{buy:{card}}`) y revela la carta en su oferta: SAL-07, que ya tenemos. */
function revealingAbuela() {
  const posts: string[] = [];
  const assets = [{ id: 27, kind: "card", ref: "SAL-07", rarity: "uncommon", set: "SAL", your_value: 8.1 }];
  const values: Record<string, number> = { "SAL-07": 8.1, "SAL-08": 40, "SAL-09": 40 };
  const threads = new Map<number, Thread>();
  let offer = 900;
  const her = (price: number) => ({ id: offer++, maker: "abuela", to: "t02", status: "open", give: { cash: 0, types: ["card:SAL-07"] }, want: { cash: price }, final: false });
  const api: BazaarApi = {
    me: async () => ({ id: "t02", cash: 390, level: 1, assets: [...assets], album: { pages: [{ set: "SAL", have: 4, of: 10 }] }, score: { team: "t02", deals: 2, neg_points: -14.9, ladder_points: 0.02 } }) as never,
    catalog: async () => ({ sets: [{ id: "SAL", released: true, cards: ["SAL-07", "SAL-08", "SAL-09"].map((id) => ({ id, rarity: "uncommon" })) }], packs: [] }) as never,
    value: async (c) => values[c]!,
    myThreads: async () => ({ threads: [] }),
    myOffers: async () => ({ offers: [] }),
    thread: async (id) => structuredClone(threads.get(id)!),
    openThread: async (_w, topic) => {
      posts.push(`open ${JSON.stringify(topic)}`);
      if ("buy" in topic && "card" in topic.buy) throw new BazaarError("invalid", "topic not on menu", 422);
      const t = ThreadSchema.parse({ id: 200, status: "open", team: "t02", with: "abuela", topic, messages: [], standing_offers: [her(29)] });
      threads.set(t.id, t);
      return structuredClone(t);
    },
    say: async (id, _text, price) => {
      posts.push(price === undefined ? "say" : `say ${price}`);
      const t = threads.get(id)!;
      for (const o of t.standing_offers) o.status = "cancelled";
      t.standing_offers.push(her(28));
      return {};
    },
    closeThread: async (id) => {
      posts.push("close");
      threads.get(id)!.status = "closed";
      return {};
    },
    accept: async () => ({}),
  };
  return { api, posts };
}

const SAL_MENU = DealerInfoSchema.parse({ id: "abuela", menu: { sells: [{ rarity: "uncommon", sets: "released", list_price: 25 }], buys: [], deals_per_team_per_hour: 8 } });

describe("agente: carta revelada, resumen por conversación y cuota del dealer", () => {
  it("rechazado {buy:{card}}, compra por rareza+set; ella revela SAL-07 (repetida): límite 8, una contraoferta y cierre, con resumen", async () => {
    const { api, posts } = revealingAbuela();
    const records: TraceRecord[] = [];
    const summaries: ThreadSummary[] = [];
    const lines: string[] = [];
    const team = new TeamBudget({ maxSpendPerHour: 60, maxSpendTotal: 150, cashFloor: 280, now: () => NOW });
    const a = new BazaarAgent(api, { dealer: { id: "abuela", aliases: [] }, dryRun: false, maxSpendPerHour: 60, team, safety: 1, menu: SAL_MENU, dealsPerHour: 8, trace: { write: (r) => records.push(r) }, now: () => NOW, onThreadSummary: (s) => summaries.push(s), log: (l) => lines.push(l) });
    await a.step(clock(10));
    expect(records.at(-1)!.rule).toBe("card-topic-unsupported");
    await a.step(clock(11));
    expect(posts.at(-1)).toBe('open {"buy":{"rarity":"uncommon","set":"SAL"}}');
    await a.step(clock(12));
    expect(lines.some((l) => l.includes("she offers SAL-07 (DUPLICATE, we hold 1): our value 8.1 → limit 8"))).toBe(true);
    expect(posts.at(-1)).toBe("say 7");
    await a.step(clock(13));
    const close = records.find((r) => r.action === "close")!;
    expect(close.rule).toBe("lowball-bid");
    expect(posts.slice(-2)).toEqual(["say", "close"]);
    expect(summaries).toHaveLength(1);
    const s = summaries[0]!;
    expect(s).toMatchObject({ thread: 200, dealer: "abuela", kind: "buy", cards: ["SAL-07"], copiesBefore: { "SAL-07": 1 }, copiesAfter: { "SAL-07": 1 }, dealsWithDealerLastHour: 0, openTick: 11, tick: 13, herList: 25, herOpening: 29, finalFlag: false, herPrices: [29, 28], ourPrices: [7], outcome: "closed_no_deal", rule: "lowball-bid", ourLimit: 8, negPointsBefore: -14.9 });
    expect(s.patience.msgs).toBe(1);
    expect(close.summary).toEqual(s);
    expect(formatThreadSummary(s)).toContain("SUMMARY thread 200 · abuela · buy SAL-07 · closed_no_deal rule lowball-bid · her 29→28 · ours 7");
  });

  it("cuota del dealer: con deals_per_team_per_hour alcanzado no abre más hasta que pase la hora de juego", async () => {
    const { api } = revealingAbuela();
    const records: TraceRecord[] = [];
    const a = new BazaarAgent(api, { dealer: { id: "abuela", aliases: [] }, dryRun: false, maxSpendPerHour: 60, safety: 1, menu: SAL_MENU, dealsPerHour: 0, trace: { write: (r) => records.push(r) }, now: () => NOW });
    await a.step(clock(10));
    expect(records.at(-1)).toMatchObject({ action: "blocked", rule: "dealer-quota" });
  });

  it("suelo de caja: con 290 P y suelo 280 la reserva de compra queda en 10 y no hay margen sobre su lista", async () => {
    const { api } = revealingAbuela();
    const poor: BazaarApi = { ...api, me: async () => ({ ...(await api.me()), cash: 290 }) as never };
    const records: TraceRecord[] = [];
    const team = new TeamBudget({ maxSpendPerHour: 60, cashFloor: 280, now: () => NOW });
    const a = new BazaarAgent(poor, { dealer: { id: "abuela", aliases: [] }, dryRun: true, maxSpendPerHour: 60, team, safety: 1, menu: SAL_MENU, trace: { write: (r) => records.push(r) }, now: () => NOW });
    await a.step(clock(10));
    expect(records.at(-1)).toMatchObject({ action: "idle", rule: "no-target" });
  });
});

describe("thread-log", () => {
  it("carta revelada en su oferta y motivo de cierre", () => {
    const t = ThreadSchema.parse({ id: 184, status: "open", messages: [{ sender: "abuela", offer: { id: 1479, maker: "abuela", give: { cash: 0, types: ["card:SAL-05"] }, want: { cash: 12 } } }], standing_offers: [] });
    expect(revealedCards(t, { id: "abuela", aliases: [] })).toEqual(["SAL-05"]);
    expect(outcomeOf("closed", "no_progress")).toBe("walked");
    expect(outcomeOf("walked", "walked")).toBe("walked");
    expect(outcomeOf("closed", "cooloff")).toBe("cooloff");
    expect(outcomeOf("deal", null)).toBe("deal");
    expect(outcomeOf("closed", null)).toBe("closed_no_deal");
  });
});

const SUMMARY: ThreadSummary = {
  thread: 999,
  dealer: "abuela",
  kind: "buy",
  target: "buy:SAL:uncommon",
  cards: ["SAL-07"],
  received: ["SAL-07"],
  copiesBefore: { "SAL-07": 1 },
  copiesAfter: { "SAL-07": 2 },
  dealsWithDealerLastHour: 1,
  openTick: 170,
  tick: 172,
  ts: "2026-10-02T20:00:00.000Z",
  herList: 25,
  herOpening: 29,
  finalFlag: false,
  herPrices: [29, 25],
  ourPrices: [22, 23],
  patience: { msgs: 2, herReplies: 1, ticks: 2, untilFinal: false },
  outcome: "deal",
  price: 23,
  ourValue: 8.1,
  ourLimit: 24,
  valueCreated: -14.9,
  negPointsBefore: 0,
};

describe("lessons.json", () => {
  it("lecciones derivadas de lo medido", () => {
    const L = deriveLessons(SUMMARY);
    expect(L).toContain("She conceded 4 P from her opening (29 → 25).");
    expect(L).toContain("Accepted below her list (23 < list 25).");
    expect(L).toContain("Duplicate received: SAL-07 (we already had 1).");
    expect(L.some((l) => l.startsWith("Negative value at our private values (-14.9 P)"))).toBe(true);
    expect(deriveLessons({ ...SUMMARY, outcome: "closed_no_deal", received: [], herPrices: [13, 13, 13], finalFlag: true })).toEqual(["She did not move: 3 prices at 13.", "Her final came after 2 of our messages (2 ticks)."]);
  });

  it("añade al final de conversations sin tocar el texto existente, JSON válido, sin duplicar el hilo", () => {
    const dir = mkdtempSync(join(tmpdir(), "lessons-"));
    const file = join(dir, "lessons.json");
    const original = readFileSync(join(process.cwd(), "docs/bazaar/lessons.json"), "utf8");
    writeFileSync(file, original);
    const entry = lessonFromSummary(SUMMARY, { negDelta: -14.9, ladderAfter: 0.022 });
    expect(appendLesson(file, entry, "2026-10-02")).toBe(true);
    const text = readFileSync(file, "utf8");
    const before = JSON.parse(original) as { conversations: unknown[] };
    const after = JSON.parse(text) as { schema: string; conversations: LessonEntry[] };
    expect(after.schema).toBe("bazaar-lessons/v1");
    expect(after.conversations.slice(0, -1)).toEqual(before.conversations);
    expect(after.conversations.at(-1)).toMatchObject({ thread: 999, kind: "buy", outcome: "deal", price: 23, value_created: -14.9, neg_points_delta: -14.9, ladder_points_after: 0.022, received: ["SAL-07"], copies_before: { "SAL-07": 1 }, ticks_until_close: 2, her_final: null });
    const firstEntryText = original.slice(original.indexOf('"conversations"'), original.indexOf("},", original.indexOf('"conversations"')));
    expect(text).toContain(firstEntryText);
    expect(appendLesson(file, entry)).toBe(false);
    expect(JSON.stringify(after)).not.toMatch(/key|X-Team/i);
  });

  it("crea el fichero si no existe; las de un trato esperan a que neg_points se mueva (o a 5 ticks)", () => {
    const dir = mkdtempSync(join(tmpdir(), "lessons-"));
    const file = join(dir, "lessons.json");
    const written: LessonEntry[] = [];
    const pending = new PendingLessons((e) => {
      written.push(e);
      appendLesson(file, e);
    });
    pending.add({ ...SUMMARY, thread: 1, outcome: "closed_no_deal" });
    expect(written.map((e) => e.thread)).toEqual([1]);
    pending.add(SUMMARY);
    pending.observe({ neg_points: 0, ladder_points: 0.02 }, 173);
    expect(pending.size).toBe(1);
    pending.observe({ neg_points: -14.9, ladder_points: 0.022 }, 174);
    expect(written.at(-1)).toMatchObject({ thread: 999, neg_points_delta: -14.9, ladder_points_after: 0.022 });
    pending.add({ ...SUMMARY, thread: 1000 });
    pending.observe({ neg_points: 0 }, 177);
    expect(pending.size).toBe(0);
    expect(written.at(-1)!.notes).toContain("neg_points had not moved");
    expect((JSON.parse(readFileSync(file, "utf8")) as { conversations: unknown[] }).conversations).toHaveLength(3);
  });
});
