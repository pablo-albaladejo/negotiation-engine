import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { createRng, deriveSeed } from "../../src/engine/rng.js";

const seed = fc.integer({ min: -(2 ** 31), max: 2 ** 31 - 1 });
const take = (rng: { float(): number }, n: number) => Array.from({ length: n }, () => rng.float());

describe("rng sembrado", () => {
  it("misma semilla ⇒ misma secuencia", () => {
    fc.assert(
      fc.property(seed, (s) => {
        expect(take(createRng(s), 20)).toEqual(take(createRng(s), 20));
      }),
    );
  });

  it("valores en [0, 1) y between dentro del intervalo", () => {
    fc.assert(
      fc.property(seed, (s) => {
        const rng = createRng(s);
        for (const x of take(rng, 50)) expect(x >= 0 && x < 1).toBe(true);
        const y = rng.between(-0.3, 0.3);
        expect(y >= -0.3 && y <= 0.3).toBe(true);
      }),
    );
  });

  it("semillas derivadas por caja son estables y distintas entre cajas", () => {
    fc.assert(
      fc.property(seed, fc.string(), fc.string(), (s, a, b) => {
        expect(deriveSeed(s, a)).toBe(deriveSeed(s, a));
        fc.pre(a !== b);
        expect(take(createRng(s).derive(a), 5)).not.toEqual(take(createRng(s).derive(b), 5));
      }),
    );
  });

  it("derivar no consume la secuencia del padre", () => {
    fc.assert(
      fc.property(seed, (s) => {
        const parent = createRng(s);
        parent.derive("engine").float();
        expect(take(parent, 5)).toEqual(take(createRng(s), 5));
      }),
    );
  });
});
