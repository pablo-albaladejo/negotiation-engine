import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BazaarAgent, type BazaarApi } from "../../src/bazaar/agent.js";
import { BazaarClient, BazaarError } from "../../src/bazaar/client.js";
import { DEFAULT_NEGOTIATOR_PARAMS, decide, type ThreadView } from "../../src/bazaar/negotiator.js";
import { ThreadSchema, type Thread } from "../../src/bazaar/schemas.js";
import type { TraceRecord } from "../../src/bazaar/trace.js";
import { threadPrices } from "../../src/bazaar/view.js";

/** Hilo real 56 (vendemos MAL-02, your_value 2.2, a la abuela): ella ofrece 13 en su oferta vigente, nosotros pedimos 21. */
const RAW = JSON.parse(readFileSync(new URL("../fixtures/bazaar/thread-56.json", import.meta.url), "utf8")) as Record<string, unknown>;
const DEALER = { id: "abuela", aliases: ["Abuela Carmen"] };
const RESERVATION = Math.ceil(2.2);

function sellView(thread: Thread, extra: Partial<ThreadView> = {}): ThreadView {
  const p = threadPrices(thread, "sell", DEALER, "t02");
  return {
    side: "sell",
    reservation: RESERVATION,
    herPrices: p.herPrices,
    ourPrices: p.ourPrices,
    ...(p.herOpening !== undefined ? { herOpening: p.herOpening } : {}),
    ...(p.herCurrent ? { herCurrent: p.herCurrent } : {}),
    canMessage: true,
    canAccept: true,
    ...extra,
  };
}

describe("hilo real 56", () => {
  it("valida la forma real (price null en mensajes, types, final, offer anidada)", () => {
    const r = ThreadSchema.safeParse(RAW);
    expect(r.success).toBe(true);
  });

  it("tolera nulls y campos ausentes por todas partes", () => {
    const nully = {
      id: 56,
      status: null,
      messages: [{ id: null, sender: "abuela", text: null, price: null, offer: { id: 1, maker: "abuela", give: { cash: null, assets: null, types: null }, want: null, final: null } }],
      standing_offers: [{ id: 2, maker: "abuela", status: null, give: { cash: 13, types: [] }, want: { cash: null }, final: null }],
    };
    const t = ThreadSchema.parse(nully);
    expect(t.status).toBe("open");
    expect(threadPrices(t, "sell", DEALER, "t02").herCurrent).toEqual({ offerId: 2, price: 13, final: false });
  });

  it("su precio sale de su oferta (give.cash al comprarnos), el nuestro de la nuestra (want.cash)", () => {
    const p = threadPrices(ThreadSchema.parse(RAW), "sell", DEALER, "t02");
    expect(p.herOpening).toBe(13);
    expect(p.herCurrent).toEqual({ offerId: 356, price: 13, final: false });
    expect(p.herPrices.every((x) => x === 13)).toBe(true);
    expect(p.ourPrices).toEqual([21]);
  });

  it("sin oferta en los mensajes, usa standing_offers para ambos lados", () => {
    const bare = { ...RAW, messages: (RAW.messages as Record<string, unknown>[]).map(({ offer: _o, ...m }) => ({ ...m, price: null })) };
    const p = threadPrices(ThreadSchema.parse(bare), "sell", DEALER, "t02");
    expect(p).toEqual({ herPrices: [13], herOpening: 13, herCurrent: { offerId: 356, price: 13, final: false }, ourPrices: [21] });
  });

  it("aprendido en vivo: ella no se mueve de 13; tras 2 concesiones nuestras lo trata como precio fijo y acepta 13", () => {
    const thread = ThreadSchema.parse(RAW);
    let v = sellView(thread, { privateValue: 2.2 });
    const sent: number[] = [...v.ourPrices];
    for (let i = 0; i < 2; i++) {
      const d = decide(v);
      expect(d.action.kind).toBe("counter");
      if (d.action.kind === "counter") sent.push(d.action.price);
      v = { ...v, ourPrices: [...sent] };
    }
    const d = decide(v);
    expect(d.rule).toBe("fixed-price");
    expect(d.action).toEqual({ kind: "accept", offerId: 356, price: 13 });
  });

  it("sin la regla de precio fijo: concede por debajo de 21, nunca repite precio ni baja a su apertura (13); atascado en 14, acepta su 13 (dentro del mínimo)", () => {
    const thread = ThreadSchema.parse(RAW);
    const params = { ...DEFAULT_NEGOTIATOR_PARAMS, fixedAfterConcessions: 0 };
    let v = sellView(thread);
    const first = decide(v, params);
    expect(first.effectiveReservation).toBe(14);
    expect(first.action.kind).toBe("counter");
    const sent: number[] = [...v.ourPrices];
    for (let i = 0; i < 30; i++) {
      const d = decide(v, params);
      if (d.action.kind !== "counter") {
        expect(d.action).toEqual({ kind: "accept", offerId: 356, price: 13 });
        expect(d.rule).toBe("stuck-accept-within-limit");
        break;
      }
      expect(d.action.price).toBeLessThan(sent[sent.length - 1]!);
      expect(d.action.price).toBeGreaterThan(13);
      sent.push(d.action.price);
      v = { ...v, ourPrices: [...sent] };
    }
    expect(sent[sent.length - 1]).toBe(14);
  });

  it("acepta en cuanto ella supera su apertura y alcanza nuestra siguiente contraoferta", () => {
    const thread = ThreadSchema.parse(RAW);
    const v = sellView(thread, { herPrices: [13, 13, 14], herCurrent: { offerId: 400, price: 14, final: false }, ourPrices: [21, 20, 19, 18, 17, 16, 15] });
    expect(decide(v).action).toEqual({ kind: "accept", offerId: 400, price: 14 });
  });

  it("agente: si el POST del mensaje falla, el siguiente tic no reenvía la misma cifra", async () => {
    const thread = ThreadSchema.parse(RAW);
    const says: (number | undefined)[] = [];
    const api: BazaarApi = {
      me: async () => ({ id: "t02", name: "Team 2", cash: 100, assets: [{ id: 23, kind: "card", ref: "MAL-02", your_value: 2.2 }], score: { team: "t02" } }) as never,
      catalog: async () => ({ sets: [], packs: [] }) as never,
      value: async () => 0,
      myThreads: async () => ({ threads: [{ id: 56, status: "open", with: "abuela" }] }),
      thread: async () => thread,
      openThread: async () => {
        throw new Error("no debe abrir");
      },
      say: async (_id, _text, price) => {
        says.push(price);
        throw new BazaarError("bad_response", "POST /api/threads/56/messages: message: invalid_type expected object", 200);
      },
      closeThread: async () => ({}),
      accept: async () => {
        throw new Error("no debe aceptar a 13");
      },
    };
    const records: TraceRecord[] = [];
    const lines: string[] = [];
    const a = new BazaarAgent(api, { dealer: DEALER, dryRun: false, maxSpendPerHour: 100, trace: { write: (r) => records.push(r) }, now: () => 1_700_000_000_000, log: (l) => lines.push(l) });
    for (let tick = 33; tick < 36; tick++) await a.step({ tick, tick_seconds: 60 });
    expect(says).toHaveLength(3);
    expect(says[0]).toBeLessThan(21);
    for (let i = 1; i < says.length; i++) expect(says[i]!).toBeLessThan(says[i - 1]!);
    expect(lines.some((l) => l.includes("bad_response: POST /api/threads/56/messages: message"))).toBe(true);
  });
});

describe("cliente: bad_response con la ruta del fallo", () => {
  it("nombra el campo que no valida y no vuelca la clave", async () => {
    const fetchFn = (async () => new Response(JSON.stringify({ id: "x", status: "open" }), { status: 200 })) as unknown as typeof fetch;
    const c = new BazaarClient({ url: "https://bz.test", key: "tk-secret", fetch: fetchFn });
    const err = await c.thread(56).catch((e: unknown) => e as BazaarError);
    expect(err).toBeInstanceOf(BazaarError);
    expect(err.code).toBe("bad_response");
    expect(err.message).toContain("GET /api/threads/56: id: invalid_type");
    expect(err.message).not.toContain("tk-secret");
  });
});
