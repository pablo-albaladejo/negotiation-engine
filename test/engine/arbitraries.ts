import fc from "fast-check";
import type { Issue } from "../../src/engine/config.js";
import type { Offer, OfferMandate } from "../../src/engine/issues.js";

/** Random issues already normalized (weights sum to 1), unique names. */
export const issuesArb: fc.Arbitrary<Issue[]> = fc
  .array(
    fc.record({
      min: fc.integer({ min: 0, max: 1000 }),
      span: fc.integer({ min: 1, max: 1000 }),
      direction: fc.constantFrom("higher-better" as const, "lower-better" as const),
      weight: fc.double({ min: 0.01, max: 1, noNaN: true }),
    }),
    { minLength: 1, maxLength: 3 },
  )
  .map((raw) => {
    const total = raw.reduce((s, r) => s + r.weight, 0);
    return raw.map((r, i) => ({
      name: `i${i}`,
      min: r.min,
      max: r.min + r.span,
      direction: r.direction,
      weight: r.weight / total,
    }));
  });

export function offerArb(issues: Issue[], overshoot = 0): fc.Arbitrary<Offer> {
  return fc.tuple(
    ...issues.map((i) => {
      const pad = (i.max - i.min) * overshoot;
      return fc.double({ min: i.min - pad, max: i.max + pad, noNaN: true, noDefaultInfinity: true });
    }),
  ).map((values) => Object.fromEntries(issues.map((i, k) => [i.name, values[k]!])));
}

/** Mandate within the issues' limits (already oriented to our role). */
export function mandateArb(issues: Issue[]): fc.Arbitrary<OfferMandate> {
  return fc.record({
    role: fc.constantFrom("buyer" as const, "seller" as const),
    reservation: offerArb(issues),
  });
}

export const pctIssue: Issue = { name: "pct", min: 0, max: 10, direction: "higher-better", weight: 1 };
