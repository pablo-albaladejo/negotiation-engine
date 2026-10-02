import { describe, expect, it } from "vitest";
import { BazaarAgent, type BazaarApi } from "../../src/bazaar/dealers/agent.js";
import { BazaarError, type Topic } from "../../src/bazaar/shared/client.js";
import { missingPageCards, raritySetTargets } from "../../src/bazaar/dealers/planner.js";
import { CatalogSchema, MeSchema, ThreadSchema } from "../../src/bazaar/shared/schemas.js";
import type { TraceRecord } from "../../src/bazaar/shared/trace.js";

const catalog = CatalogSchema.parse({
  sets: [
    {
      id: "SAL",
      cards: [
        { id: "SAL-01", rarity: "common", book: 10 },
        { id: "SAL-02", rarity: "common", book: 10 },
        { id: "SAL-03", rarity: "common", book: 10 },
        { id: "SAL-06", rarity: "uncommon", book: 25 },
      ],
    },
  ],
});
const me = MeSchema.parse({ cash: 400, assets: [{ id: 1, kind: "card", ref: "SAL-01", your_value: 13 }] });
const values: Record<string, number> = { "SAL-01": 3.25, "SAL-02": 13, "SAL-03": 13, "SAL-06": 32.5 };

describe("raritySetTargets", () => {
  it("reserva = media del valor de todas las cartas de esa rareza y set × seguridad", async () => {
    const t = await raritySetTargets(missingPageCards(me, catalog), catalog, async (c) => values[c]!, {
      budget: 120,
      cash: 400,
      safety: 0.85,
      maxLookups: 40,
      rarities: ["common", "uncommon"],
    });
    expect(t.map((x) => [x.key, x.reservation])).toEqual([
      ["buy:SAL:uncommon", 27],
      ["buy:SAL:common", 8],
    ]);
    expect(t[0]!.topic).toEqual({ buy: { rarity: "uncommon", set: "SAL" } });
  });
});

describe("BazaarAgent: fallback de topic", () => {
  it("si el dealer rechaza {buy: {card}}, pasa a {buy: {rarity, set}}", async () => {
    const opened: Topic[] = [];
    const api: BazaarApi = {
      me: async () => me,
      catalog: async () => catalog,
      value: async (c) => values[c]!,
      myThreads: async () => ({ threads: [] }),
      myOffers: async () => ({ offers: [] }),
      thread: async (id) => ThreadSchema.parse({ id, status: "open", messages: [], standing_offers: [] }),
      openThread: async (_w, topic) => {
        opened.push(topic);
        if ("buy" in topic && "card" in topic.buy) throw new BazaarError("invalid", "unknown topic", 422);
        return ThreadSchema.parse({ id: 9, status: "open", topic, messages: [], standing_offers: [] });
      },
      say: async () => ({}),
      closeThread: async () => ({}),
      accept: async () => ({}),
    };
    const records: TraceRecord[] = [];
    const a = new BazaarAgent(api, { dealer: { id: "abuela", aliases: [] }, dryRun: false, maxSpendPerHour: 120, trace: { write: (r) => records.push(r) } });
    await a.step({ tick: 1 });
    await a.step({ tick: 2 });
    expect(records[0]).toMatchObject({ action: "error", rule: "card-topic-unsupported" });
    expect(opened[0]).toHaveProperty("buy.card");
    expect(opened[1]).toEqual({ buy: { rarity: "uncommon", set: "SAL" } });
    expect(records[1]).toMatchObject({ action: "open", thread: 9, target: "buy:SAL:uncommon", reservation: 27 });
  });
});
