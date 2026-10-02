import { describe, expect, it } from "vitest";
import { BrokerAgent, type BrokerApi, type BrokerRecord } from "../../src/bazaar/broker/agent.js";
import { runBrokerCli } from "../../src/bazaar/broker/main.js";
import { BazaarError } from "../../src/bazaar/shared/client.js";

const ask = (id: string, cash: number) => ({ id, give: { assets: [{ kind: "card", ref: "X" }] }, want: { cash } });
const bid = (id: string, cash: number) => ({ id, give: { cash }, want: { types: ["card:X"] } });

function fakeBroker(mechanism = "board") {
  const state = { tick: 10, bench: [] as unknown[], offers: [] as unknown[] };
  const calls = { match: [] as [string | number, string | number, number][], announce: [] as string[], book: 0 };
  const refuse = new Set<string>();
  const api: BrokerApi = {
    clock: async () => ({ tick: state.tick, t_hours: 3.5 }),
    book: async () => {
      calls.book += 1;
      return { venue: "v04", status: "open", fee_bps: 0, fee_per_card: 0, offers: state.offers, bench_offers: state.bench, recent: [] };
    },
    venues: async () => ({ venues: [{ venue: "v04", name: "Team 2 · El Rastro Express", fee_bps: 0, fee_per_card: 0, rules: { mechanism } }] }),
    match: async (sell, buy, price) => {
      if (refuse.has(String(sell))) throw new BazaarError("offer_gone", "", 409);
      calls.match.push([sell, buy, price]);
      return { ok: true };
    },
    announce: async (text) => {
      calls.announce.push(text);
      return {};
    },
  };
  return { api, state, calls, refuse };
}

function sinkOf() {
  const records: BrokerRecord[] = [];
  return { records, sink: { write: (r: BrokerRecord) => void records.push(r) } };
}

describe("BrokerAgent", () => {
  it("matches the bench live, logs each match and announces once", async () => {
    const f = fakeBroker();
    f.state.bench = [ask("b1-0", 10), ask("b1-1", 30), bid("b1-2", 40), bid("b1-3", 20)];
    const { records, sink } = sinkOf();
    const lines: string[] = [];
    const agent = new BrokerAgent(f.api, { dryRun: false, sink, log: (l) => lines.push(l) });
    const r = await agent.step();
    expect(r).toMatchObject({ status: "planned", sent: 1, refused: 0 });
    expect(f.calls.match).toEqual([["b1-0", "b1-2", 25]]);
    expect(f.calls.announce).toHaveLength(1);
    expect(records.filter((x) => x.kind === "match").map((x) => [x.tick, x.sell, x.buy, x.price, x.surplus, x.status])).toEqual([[10, "b1-0", "b1-2", 25, 30, "sent"]]);
    expect(records.some((x) => x.kind === "bench")).toBe(true);
    expect(lines.some((l) => l.startsWith("tick 10 · h 3.50 · v04 open · bench 4 (1 runs)"))).toBe(true);
  });

  it("does not resubmit the same state and does not reuse a matched offer still in the book", async () => {
    const f = fakeBroker();
    f.state.bench = [ask("b1-0", 10), bid("b1-1", 20)];
    const agent = new BrokerAgent(f.api, { dryRun: false, log: () => {}, announce: false });
    await agent.step();
    expect((await agent.step()).status).toBe("unchanged");
    f.state.tick = 11;
    const r = await agent.step();
    expect(r.matches).toEqual([]);
    expect(f.calls.match).toHaveLength(1);
    expect(f.calls.announce).toHaveLength(0);
  });

  it("logs refused matches and keeps going; logs shape errors once", async () => {
    const f = fakeBroker();
    f.state.bench = [ask("b1-0", 10), bid("b1-1", 20), { id: "garbage" }];
    f.refuse.add("b1-0");
    const lines: string[] = [];
    const { records, sink } = sinkOf();
    const agent = new BrokerAgent(f.api, { dryRun: false, log: (l) => lines.push(l), sink, announce: false });
    expect(await agent.step()).toMatchObject({ sent: 0, refused: 1 });
    f.state.tick = 11;
    await agent.step();
    expect(lines.filter((l) => l.includes("skipped bench[2]") || l.includes("garbage")).length).toBe(1);
    expect(lines.some((l) => l.includes("refused (offer_gone)"))).toBe(true);
    expect(records.find((x) => x.kind === "match")).toMatchObject({ status: "refused", error: "offer_gone" });
  });

  it("survives a failing book read", async () => {
    const f = fakeBroker();
    f.api.book = async () => {
      throw new BazaarError("network", "", 0);
    };
    const lines: string[] = [];
    const agent = new BrokerAgent(f.api, { dryRun: false, log: (l) => lines.push(l) });
    expect((await agent.step()).status).toBe("error");
    expect(lines[0]).toContain("cannot read clock/book (network)");
  });

  it("warns when the venue is auto", async () => {
    const f = fakeBroker("auto");
    const lines: string[] = [];
    await new BrokerAgent(f.api, { dryRun: true, log: (l) => lines.push(l) }).step();
    expect(lines.some((l) => l.includes("mechanism auto") && l.includes("WARNING"))).toBe(true);
  });
});

describe("runBrokerCli", () => {
  it("dry-run --once sends nothing and prints the plan", async () => {
    const f = fakeBroker();
    f.state.bench = [ask("b1-0", 10), bid("b1-1", 20)];
    const lines: string[] = [];
    const { records, sink } = sinkOf();
    expect(await runBrokerCli(["--dry-run", "--once"], (l) => lines.push(l), f.api, async () => {}, sink)).toBe(0);
    expect(f.calls.match).toEqual([]);
    expect(f.calls.announce).toEqual([]);
    expect(lines.some((l) => l.includes("bench b1-0 x b1-1 at 15"))).toBe(true);
    expect(lines.at(-1)).toBe("DRY-RUN: nothing sent.");
    expect(records.find((x) => x.kind === "match")).toMatchObject({ status: "dry-run", dryRun: true });
  });
  it("refuses live without --confirm", async () => {
    const f = fakeBroker();
    const lines: string[] = [];
    expect(await runBrokerCli([], (l) => lines.push(l), f.api)).toBe(2);
    expect(lines[0]).toContain("REFUSED");
    expect(f.calls.book).toBe(0);
  });
  it("runs --steps with polling", async () => {
    const f = fakeBroker();
    let slept = 0;
    expect(await runBrokerCli(["--dry-run", "--steps", "3", "--poll-ms", "500"], () => {}, f.api, async () => void (slept += 1), sinkOf().sink)).toBe(0);
    expect(f.calls.book).toBe(3);
    expect(slept).toBe(2);
  });
});
