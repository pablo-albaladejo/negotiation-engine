import { describe, expect, it } from "vitest";
import type { GameSetup, Participant } from "../../src/arena/participant.js";
import { createBotByName } from "../../src/bots/index.js";
import type { Issue } from "../../src/engine/config.js";
import { orientIssues, reservationUtility, utility, withinOfferMandate, type Offer } from "../../src/engine/issues.js";
import { openingUtility } from "../../src/engine/offer.js";
import type { TurnOutput } from "../../src/protocol/schemas.js";

const issues: Issue[] = [{ name: "pct", min: 0, max: 10, direction: "higher-better", weight: 1 }];
const seller = { role: "seller" as const, reservation: { pct: 7 } };
const setup = (seed = 1): GameSetup => ({ sessionId: "b", scenarioId: "x", issues, mandate: seller, seed, mode: "structured" });

/** Juega contra un comprador terco que siempre pide lo imposible: el bot nunca acepta. */
async function curve(bot: Participant, seed = 1, rounds = 10, rivalOffer: Offer = { pct: 10 }): Promise<TurnOutput[]> {
  const session = await bot.start(setup(seed));
  const outputs: TurnOutput[] = [];
  for (let round = 1; round <= rounds; round++) {
    outputs.push(await session.respond({ sessionId: "b", round, roundLimit: rounds, rivalAction: "offer", rivalOffer }));
  }
  return outputs;
}

const oriented = orientIssues(issues, "seller");
const uRes = reservationUtility(oriented, seller);
const uOpen = openingUtility(uRes, 0.9);
const conceded = (out: TurnOutput) => (uOpen - utility(oriented, (out as { offer: Offer }).offer)) / (uOpen - uRes);

describe("bots Boulware y Conceder", () => {
  it.each(["boulware", "conceder"])("%s: monótono, dentro de su mandato y llega a la reserva en t = 1", async (name) => {
    const outputs = await curve(createBotByName(name));
    expect(outputs.every((o) => o.action === "counter")).toBe(true);
    const fractions = outputs.map(conceded);
    for (let k = 1; k < fractions.length; k++) expect(fractions[k]!).toBeGreaterThanOrEqual(fractions[k - 1]! - 1e-9);
    for (const o of outputs) expect(withinOfferMandate(oriented, seller, (o as { offer: Offer }).offer)).toBe(true);
    expect(fractions.at(-1)!).toBeCloseTo(1, 2);
  });

  it("Boulware concede poco hasta el final", async () => {
    const fractions = (await curve(createBotByName("boulware"))).map(conceded);
    expect(fractions[4]!).toBeLessThan(0.1);
    expect(fractions[7]!).toBeLessThan(0.4);
  });

  it("Conceder concede mucho al principio", async () => {
    const fractions = (await curve(createBotByName("conceder"))).map(conceded);
    expect(fractions[2]!).toBeGreaterThan(0.5);
    expect(fractions[4]!).toBeGreaterThan(0.7);
  });

  it.each(["boulware", "conceder"])("%s: misma semilla ⇒ mismas ofertas; otra semilla puede cambiar el ruido", async (name) => {
    expect(await curve(createBotByName(name), 7)).toEqual(await curve(createBotByName(name), 7));
  });

  it("acepta una oferta al menos tan buena como su siguiente oferta y nunca fuera de su mandato", async () => {
    const session = await createBotByName("conceder").start(setup());
    const accepted = await session.respond({ sessionId: "b", round: 2, roundLimit: 10, rivalAction: "offer", rivalOffer: { pct: 1 } });
    expect(accepted).toMatchObject({ action: "accept", offer: { pct: 1 } });
    const other = await createBotByName("conceder").start(setup());
    const last = await other.respond({ sessionId: "b", round: 10, roundLimit: 10, rivalAction: "offer", rivalOffer: { pct: 7.01 } });
    expect(last.action).toBe("counter");
  });

  it("en su último movimiento acepta si la oferta cubre su reserva", async () => {
    const session = await createBotByName("boulware").start(setup());
    const out = await session.respond({ sessionId: "b", round: 10, roundLimit: 10, rivalAction: "offer", rivalOffer: { pct: 7 } });
    expect(out).toMatchObject({ action: "accept", offer: { pct: 7 } });
  });
});

describe("bot Tit-for-Tat", () => {
  it("devuelve en su utilidad la concesión del rival y no concede si el rival no concede", async () => {
    const session = await createBotByName("tit-for-tat").start(setup(4));
    const offers: TurnOutput[] = [];
    // El comprador concede 0,5, luego 0 y luego 1 punto de pct, siempre fuera del mandato del vendedor (> 7).
    for (const [round, pct] of [[1, 10], [2, 9.5], [3, 9.5], [4, 8.5]] as const) {
      offers.push(await session.respond({ sessionId: "b", round, roundLimit: 20, rivalAction: "offer", rivalOffer: { pct } }));
    }
    const u = offers.map((o) => utility(oriented, (o as { offer: Offer }).offer));
    const rivalStep = 0.5 / 10; // 0,5 puntos de pct en un rango de 10, en utilidad
    expect(u[0]! - u[1]!).toBeGreaterThan(rivalStep * 0.85);
    expect(u[0]! - u[1]!).toBeLessThan(rivalStep * 1.15);
    expect(u[2]).toBeCloseTo(u[1]!, 9);
    expect(u[2]! - u[3]!).toBeGreaterThan(2 * rivalStep * 0.85);
  });

  it("nunca cruza su reserva y es determinista por semilla", async () => {
    const run = () => curve(createBotByName("tit-for-tat"), 3, 10, { pct: 10 });
    const outputs = await run();
    for (const o of outputs) expect(withinOfferMandate(oriented, seller, (o as { offer: Offer }).offer)).toBe(true);
    expect(await run()).toEqual(outputs);
  });
});
