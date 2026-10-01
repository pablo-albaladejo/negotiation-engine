import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { GameSetup } from "../../src/arena/participant.js";
import { loadCatalog, mandateFor, rivalRole } from "../../src/arena/scenario.js";
import { createCausaPrimaEngineBot } from "../../src/bots/causa-prima-engine.js";
import { BOTS, createBotByName, OPT_IN_BOTS } from "../../src/bots/index.js";
import { offerApr, withinAprBand } from "../../src/engine/apr.js";
import type { TurnInput } from "../../src/protocol/schemas.js";

const scenario = loadCatalog(undefined, { includeOptIn: true }).find((s) => s.id === "apr-buyer-wide")!;
// Nuestro agente es comprador: el bot es vendedor con banda [8, 30] y día de referencia 10.
const mandate = mandateFor(scenario, rivalRole(scenario.role));
const band = mandate.apr!;
const setup: GameSetup = { sessionId: "s1", scenarioId: scenario.id, issues: scenario.issues, mandate, seed: 1, mode: "structured" };
const turn = (round: number, pct: number, day = 10, extra: Partial<TurnInput> = {}): TurnInput => ({
  sessionId: "s1",
  round,
  roundLimit: 8,
  rivalAction: "offer",
  rivalOffer: { pct, day },
  text: "x",
  ...extra,
});

describe("causa-prima-engine", () => {
  it("es opt-in y distinto del bot causa-prima de texto", () => {
    expect(Object.keys(BOTS)).not.toContain("causa-prima-engine");
    expect(Object.keys(BOTS)).toContain("causa-prima");
    expect(createBotByName("causa-prima-engine").name).toBe("causa-prima-engine");
    expect(Object.keys(OPT_IN_BOTS)).toEqual(["causa-prima-engine"]);
  });

  it("abre en su ancla y concede según el calendario configurado, con el texto de Causa Prima", async () => {
    const session = await createCausaPrimaEngineBot({ schedule: [0, 0.5, 1] }).start(setup);
    const outs = [];
    for (let round = 1; round <= 4; round++) outs.push(await session.respond(turn(round, 3 - round * 0.1)));
    expect(outs.map((o) => o.action)).toEqual(["counter", "counter", "counter", "counter"]);
    const aprs = outs.map((o) => (o.action === "counter" ? offerApr(band, o.offer) : NaN));
    expect(aprs[0]).toBeCloseTo(8, 0);
    expect(aprs[1]).toBeCloseTo(19, 0);
    expect(aprs[2]).toBeCloseTo(30, 0);
    expect(aprs[3]).toBe(aprs[2]);
    for (const o of outs) if (o.action === "counter") expect(withinAprBand(band, o.offer)).toBe(true);
    expect(outs[0]!.text).toMatch(/^Opening offer: [\d.]+% for payment by day 10$/);
    expect(outs[1]!.text).toMatch(/^Counter: [\d.]+% for payment by day 10$/);
  });

  it("acepta la oferta explícita dentro de su banda", async () => {
    const session = await createCausaPrimaEngineBot().start(setup);
    const out = await session.respond(turn(1, 1, 10));
    expect(out).toMatchObject({ action: "accept", offer: { pct: 1, day: 10 }, text: "Accepted" });
  });

  it("se retira con protocol_violation ante un turno inválido", async () => {
    for (const bad of [
      turn(1, 1, 10, { rivalOffer: { pct: 1, day: 10, extra: 3 } }),
      turn(1, 1, 10, { sessionId: "otra" }),
      turn(1, 99, 10),
      { ...turn(1, 1), rivalOffer: undefined },
    ]) {
      const session = await createCausaPrimaEngineBot().start(setup);
      expect(await session.respond(bad as TurnInput)).toMatchObject({ action: "walk", text: "Negotiation stopped: protocol_violation" });
    }
    const session = await createCausaPrimaEngineBot().start(setup);
    await session.respond(turn(2, 3));
    expect(await session.respond(turn(2, 3))).toMatchObject({ action: "walk", text: "Negotiation stopped: protocol_violation" });
  });

  it("se retira con no_convergence si la distancia no baja y con round_limit al pasar su límite", async () => {
    const stuck = await createCausaPrimaEngineBot({ schedule: [0, 1], stallRounds: 2 }).start(setup);
    const actions = [];
    for (let round = 1; round <= 6; round++) actions.push(await stuck.respond(turn(round, 4)));
    expect(actions.at(-1)).toMatchObject({ action: "walk", text: "Negotiation stopped: no_convergence" });
    const limited = await createCausaPrimaEngineBot({ maxRounds: 2, stallRounds: 99 }).start(setup);
    await limited.respond(turn(1, 4));
    await limited.respond(turn(2, 3.9));
    expect(await limited.respond(turn(3, 3.8))).toMatchObject({ action: "walk", text: "Negotiation stopped: round_limit" });
  });

  it("nunca cruza su mandato (propiedad)", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.record({ pct: fc.integer({ min: 0, max: 500 }), day: fc.integer({ min: 0, max: 25 }) }), { minLength: 1, maxLength: 10 }), async (offers) => {
        const session = await createCausaPrimaEngineBot().start(setup);
        for (const [k, o] of offers.entries()) {
          const out = await session.respond(turn(k + 1, o.pct / 100, o.day));
          if (out.action === "walk") break;
          expect(withinAprBand(band, out.offer)).toBe(true);
          if (out.action === "accept") break;
        }
      }),
    );
  });
});
