import { uniformFloat64 } from "pure-rand/distribution/uniformFloat64";
import { xoroshiro128plus } from "pure-rand/generator/xoroshiro128plus";

/** Seeded generator. Math.random is never used: everything must be reproducible by seed. */
export interface Rng {
  readonly seed: number;
  /** Uniform float in [0, 1). */
  float(): number;
  /** Uniform float in [min, max]. */
  between(min: number, max: number): number;
  /** Independent generator for a box or subtask, derived from this seed and a label. */
  derive(label: string): Rng;
}

/** 32-bit FNV-1a over the seed and the label: distinct, stable seeds per box. */
export function deriveSeed(seed: number, label: string): number {
  let hash = 0x811c9dc5 ^ (seed | 0);
  hash = Math.imul(hash, 0x01000193);
  for (const char of `${seed}:${label}`) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash | 0;
}

export function createRng(seed: number): Rng {
  const generator = xoroshiro128plus(seed | 0);
  return {
    seed: seed | 0,
    float: () => uniformFloat64(generator),
    between(min, max) {
      return min + uniformFloat64(generator) * (max - min);
    },
    derive: (label) => createRng(deriveSeed(seed, label)),
  };
}
