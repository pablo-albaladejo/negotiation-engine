import fc from "fast-check";
import { writeFileSync } from "node:fs";
import { decide, type EngineInput } from "../../../../../../Users/pablo/development/hackathon/negotiation-ring.worktrees/causa-prima-arena/src/engine/engine.js";
import { issuesArb, offerArb } from "../../../../../../Users/pablo/development/hackathon/negotiation-ring.worktrees/causa-prima-arena/test/engine/arbitraries.js";
const r2 = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v * 100) / 100]));
const inputArb: fc.Arbitrary<EngineInput> = issuesArb.chain((issues) =>
  fc.record({
    issues: fc.constant(issues),
    mandate: fc.record({ role: fc.constantFrom("buyer" as const, "seller" as const), reservation: offerArb(issues).map(r2) }),
    params: fc.record({
      beta: fc.constantFrom(0, 0.2, 0.5, 1, 3),
      openingMargin: fc.constantFrom(0.5, 0.9, 1),
      acceptMargin: fc.constantFrom(0, 0.02, 0.05),
      acTimeThreshold: fc.constantFrom(0.8, 0.95),
      noise: fc.constantFrom(0, 0.1),
      defaultHorizon: fc.constantFrom(6, 10),
      reciprocity: fc.constantFrom(0, 0.5),
      acCombiThreshold: fc.constantFrom(0.9, 0.98),
    }),
    state: fc.record({
      round: fc.integer({ min: 1, max: 12 }),
      roundLimit: fc.constantFrom(6, 10, 12),
      ourOffers: fc.array(offerArb(issues).map(r2), { maxLength: 4 }),
      rivalOffers: fc.array(offerArb(issues, 0.1).map(r2), { maxLength: 4 }),
      rivalAcceptedOurLast: fc.boolean(),
      rivalWalked: fc.boolean({ freq: 10 } as never),
      rivalCanRespond: fc.boolean(),
    }),
    seed: fc.integer({ min: 0, max: 1_000_000 }),
  }),
);
const inputs = fc.sample(inputArb, { numRuns: 400, seed: 42 });
const cases = inputs.map((input) => ({ input, decision: decide(input) }));
writeFileSync(process.argv[2]!, JSON.stringify(cases) + "\n");
console.log(cases.length, cases.filter((c) => c.decision.action === "accept").length, cases.filter((c) => c.decision.action === "walk").length);
