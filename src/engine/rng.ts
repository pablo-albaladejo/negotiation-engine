import { uniformFloat64 } from "pure-rand/distribution/uniformFloat64";
import { xoroshiro128plus } from "pure-rand/generator/xoroshiro128plus";

/** Generador sembrado. Nunca se usa Math.random: todo tiene que ser reproducible por semilla. */
export interface Rng {
  readonly seed: number;
  /** Flotante uniforme en [0, 1). */
  float(): number;
  /** Flotante uniforme en [min, max]. */
  between(min: number, max: number): number;
  /** Generador independiente para una caja o subtarea, derivado de esta semilla y una etiqueta. */
  derive(label: string): Rng;
}

/** FNV-1a de 32 bits sobre la semilla y la etiqueta: semillas distintas por caja, estables. */
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
