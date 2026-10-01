import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { DecisionSchema, decide, engineBox, type EngineInput } from "../../src/engine/engine.js";
import { createContext, runBox } from "../../src/pipeline/box.js";
import { issuesArb, mandateArb, offerArb } from "./arbitraries.js";
import { createAgentParticipant } from "../../src/arena/agent-participant.js";
import { playGame } from "../../src/arena/runner.js";
import { loadCatalog, mandateFor } from "../../src/arena/scenario.js";
import { createBotByName } from "../../src/bots/index.js";
import { compareGolden, GOLDEN_GAMES, goldenId, loadGoldens, playGolden } from "../../src/dev/golden.js";
import { loadConfig } from "../../src/engine/config.js";

/** Decisiones decididas por el rival (se retira o acepta la nuestra): el motor no evalúa nada que explicar. */
const RIVAL_DRIVEN = new Set(["rival-walked", "rival-accepted"]);

/** Decisión sin `explain`: lo que devolvía el motor antes de esta extensión aditiva. */
function withoutExplain(decision: ReturnType<typeof decide>): unknown {
  const { explain: _explain, ...rest } = decision as Record<string, unknown>;
  return rest;
}

interface EngineFixture {
  description: string;
  input: EngineInput;
  expected: { action: string; offer?: Record<string, number>; rule: string };
}

const dir = "test/fixtures/engine";
const fixtures: [string, EngineFixture][] = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => [f, JSON.parse(readFileSync(join(dir, f), "utf8")) as EngineFixture]);

describe("caja engine sobre test/fixtures/engine", () => {
  it.each(fixtures)("%s", async (_file, fixture) => {
    const decision = await runBox(engineBox, fixture.input, createContext());
    expect(decision.action).toBe(fixture.expected.action);
    expect(decision.rule).toBe(fixture.expected.rule);
    if (fixture.expected.offer) {
      expect("offer" in decision).toBe(true);
      const offer = (decision as { offer: Record<string, number> }).offer;
      for (const [name, value] of Object.entries(fixture.expected.offer)) expect(offer[name]).toBeCloseTo(value, 9);
    } else {
      expect("offer" in decision).toBe(false);
    }
  });
});

describe("motor determinista", () => {
  const base = fixtures.find(([f]) => f === "counter-boulware.json")![1].input;

  it("misma entrada y semilla ⇒ misma decisión, también con ruido", () => {
    fc.assert(
      fc.property(fc.integer(), fc.double({ min: 0, max: 0.99, noNaN: true }), (seed, noise) => {
        const input = { ...base, seed, params: { ...base.params, noise } };
        expect(decide(input)).toEqual(decide(structuredClone(input)));
      }),
    );
  });

  it("solo produce ofertas de los issues declarados", () => {
    const decision = decide(base);
    expect(decision.action).toBe("counter");
    expect(Object.keys((decision as { offer: object }).offer)).toEqual(["pct"]);
  });

  it("el motor no recibe texto: una afirmación del rival no puede forzar accept", () => {
    expect(Object.keys(base.state)).not.toContain("text");
    expect(decide(base).action).not.toBe("accept");
  });
});

describe("explain: extensión aditiva, no cambia la decisión", () => {
  it("las doradas y fixtures dan la misma acción/oferta/regla ignorando explain", () => {
    for (const [, fixture] of fixtures) {
      const decision = decide(fixture.input);
      expect(withoutExplain(decision)).toEqual({ action: fixture.expected.action, rule: fixture.expected.rule, ...("offer" in decision ? { offer: decision.offer } : {}) });
      if (!RIVAL_DRIVEN.has(decision.rule)) expect(decision.explain).toBeDefined();
    }
  });

  it.each(GOLDEN_GAMES.map((spec) => [goldenId(spec), spec] as const))(
    "dorada %s: misma partida que antes de explain y cada decisión del motor trae explain sin mandato",
    async (id, spec) => {
      const champion = loadConfig("config/champion.json");
      const golden = loadGoldens().find((g) => g.id === id)!;
      expect(compareGolden(golden, await playGolden(spec, champion))).toEqual([]);

      const scenario = loadCatalog().find((s) => s.id === spec.scenarioId)!;
      const game = await playGame({ scenario, agent: createAgentParticipant({ config: champion }), rival: createBotByName(spec.rival), seed: spec.seed });
      const engine = game.records.filter((r) => r.box === "engine" && r.result === "ok");
      expect(engine.length).toBeGreaterThan(0);
      for (const record of engine) {
        const decision = DecisionSchema.parse(record.output);
        // La traza no guarda el mandato: se repone el del escenario para volver a decidir.
        const replayed = decide({ ...(record.input as EngineInput), mandate: mandateFor(scenario, scenario.role) });
        expect(withoutExplain(replayed)).toEqual(withoutExplain(decision));
        expect(DecisionSchema.safeParse(withoutExplain(decision)).success).toBe(true);
        if (!RIVAL_DRIVEN.has(decision.rule)) expect(decision.explain).toBeDefined();
        expect(JSON.stringify(decision.explain ?? {})).not.toMatch(/"reservation"|"mandate"/);
      }
    },
  );

  const paramsArb = fc.record({
    beta: fc.double({ min: 0, max: 5, noNaN: true }),
    openingMargin: fc.double({ min: 0, max: 1, noNaN: true }),
    acceptMargin: fc.double({ min: 0, max: 1, noNaN: true }),
    acTimeThreshold: fc.double({ min: 0, max: 1, noNaN: true }),
    noise: fc.double({ min: 0, max: 0.99, noNaN: true }),
    defaultHorizon: fc.integer({ min: 1, max: 20 }),
  });

  it("propiedad: decisión sin explain es compatible con el esquema previo, explain no filtra reserva/mandato y es determinista", () => {
    fc.assert(
      fc.property(
        issuesArb.chain((issues) =>
          fc.record({
            issues: fc.constant(issues),
            mandate: mandateArb(issues),
            params: paramsArb,
            round: fc.integer({ min: 1, max: 12 }),
            ourOffers: fc.array(offerArb(issues), { maxLength: 3 }),
            rivalOffers: fc.array(offerArb(issues, 0.2), { maxLength: 5 }),
            rivalAcceptedOurLast: fc.boolean(),
            seed: fc.integer(),
          }),
        ),
        (g) => {
          const state: EngineInput["state"] = {
            round: g.round,
            ourOffers: g.ourOffers,
            rivalOffers: g.rivalOffers,
            rivalAcceptedOurLast: g.rivalAcceptedOurLast,
            rivalWalked: false,
          };
          const input: EngineInput = { issues: g.issues, mandate: g.mandate, params: g.params, state, seed: g.seed };
          const decision = decide(input);
          // Byte-idéntica con y sin explain: misma entrada/semilla ⇒ misma acción, oferta y regla.
          const again = decide(structuredClone(input));
          expect(withoutExplain(again)).toEqual(withoutExplain(decision));
          expect(DecisionSchema.safeParse(withoutExplain(decision)).success).toBe(true);
          if ("explain" in decision && decision.explain) {
            expect(JSON.stringify(decision.explain)).not.toMatch(/"reservation"|"mandate"/);
            // targetOffer should not be the reservation offer itself
            if (decision.explain.targetOffer) {
              const targetOfferJson = JSON.stringify(decision.explain.targetOffer);
              const reservationJson = JSON.stringify(g.mandate.reservation);
              expect(targetOfferJson).not.toBe(reservationJson);
            }
          }
        },
      ),
      { numRuns: 300 },
    );
  });
});
