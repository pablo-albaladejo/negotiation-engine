import { createRng } from "../engine/rng.js";
import { gridValues, paramsKey, sampleParams, snap, type ParamRange, type Params } from "./space.js";

/** Una candidata propuesta y cuántas semillas de ajuste merece (`undefined` = las del barrido). */
export interface Proposal {
  params: Params;
  budget?: number;
}

export interface Observation {
  proposal: Proposal;
  /** Diferencia media pareada en pp; null sin pares. */
  diffPp: number | null;
  /** Lo que el generador maximiza: la diferencia, o −∞ con violaciones, fugas o sin pares. */
  score: number;
}

/**
 * Generador de candidatas: `propose` devuelve el siguiente lote (vacío = terminado) y `observe`
 * recibe las evaluaciones de ese lote. La evaluación (arena pareada) y la puerta no dependen de él.
 */
export interface Generator {
  readonly name: string;
  propose(): Proposal[];
  observe(observations: readonly Observation[]): void;
}

/** Muestreo aleatorio sembrado sobre los rangos declarados. */
export function randomSearch(options: { space: readonly ParamRange[]; n: number; seed: number }): Generator {
  let done = false;
  return {
    name: "random",
    propose() {
      if (done) return [];
      done = true;
      const rng = createRng(options.seed);
      return Array.from({ length: options.n }, () => ({ params: sampleParams(options.space, rng) }));
    },
    observe() {},
  };
}

/** Rejilla de `levels` niveles por parámetro (producto cartesiano, orden estable), hasta `n` puntos. */
export function gridSearch(options: { space: readonly ParamRange[]; levels: number; n?: number }): Generator {
  let done = false;
  return {
    name: "grid",
    propose() {
      if (done) return [];
      done = true;
      let points: Params[] = [{}];
      for (const range of options.space) points = points.flatMap((p) => gridValues(range, options.levels).map((v) => ({ ...p, [range.name]: v })));
      return points.slice(0, options.n ?? points.length).map((params) => ({ params }));
    },
    observe() {},
  };
}

/** Lista fija de candidatas (repetir un barrido o probar unas concretas). */
export function fixedList(params: readonly Params[]): Generator {
  let done = false;
  return {
    name: "fixed",
    propose() {
      if (done) return [];
      done = true;
      return params.map((p) => ({ params: { ...p } }));
    },
    observe() {},
  };
}

/**
 * Successive halving: evalúa `n` candidatas aleatorias con `minBudget` semillas, se queda con
 * la mejor 1/`eta` y las reevalúa con `eta` veces más semillas, hasta una o `maxBudget`.
 */
export function successiveHalving(options: { space: readonly ParamRange[]; n: number; seed: number; eta?: number; minBudget: number; maxBudget: number }): Generator {
  const eta = options.eta ?? 3;
  let pending: Proposal[] | null = null;
  let budget = options.minBudget;
  let finished = false;
  return {
    name: "halving",
    propose() {
      if (finished) return [];
      if (pending === null) {
        const rng = createRng(options.seed);
        pending = Array.from({ length: options.n }, () => ({ params: sampleParams(options.space, rng), budget }));
      }
      return pending;
    },
    observe(observations) {
      const next = Math.min(options.maxBudget, budget * eta);
      const keep = Math.ceil(observations.length / eta);
      if (observations.length <= 1 || next === budget || keep < 1) {
        finished = true;
        return;
      }
      budget = next;
      pending = [...observations]
        .sort((a, b) => b.score - a.score)
        .slice(0, keep)
        .map((o) => ({ params: o.proposal.params, budget }));
    },
  };
}

/**
 * Optimizador de caja negra (método de entropía cruzada): muestrea una población de una normal
 * por parámetro, se queda con la élite y reajusta media y desviación. Sembrado y acotado.
 */
export function crossEntropy(options: { space: readonly ParamRange[]; seed: number; population?: number; iterations?: number; eliteFraction?: number; start?: Params }): Generator {
  const rng = createRng(options.seed);
  const population = options.population ?? 8;
  const iterations = options.iterations ?? 3;
  const eliteCount = Math.max(1, Math.round(population * (options.eliteFraction ?? 0.25)));
  const mean = new Map(options.space.map((r) => [r.name, options.start?.[r.name] ?? (r.min + r.max) / 2]));
  const std = new Map(options.space.map((r) => [r.name, (r.max - r.min) / 4]));
  const normal = () => Math.sqrt(-2 * Math.log(1 - rng.float())) * Math.cos(2 * Math.PI * rng.float());
  let iteration = 0;
  return {
    name: "cem",
    propose() {
      if (iteration >= iterations) return [];
      const seen = new Set<string>();
      const batch: Proposal[] = [];
      for (let k = 0; k < population * 4 && batch.length < population; k++) {
        const params: Params = {};
        for (const range of options.space) params[range.name] = snap(range, mean.get(range.name)! + std.get(range.name)! * normal());
        const key = paramsKey(params);
        if (seen.has(key)) continue;
        seen.add(key);
        batch.push({ params });
      }
      return batch;
    },
    observe(observations) {
      iteration++;
      const elite = [...observations].filter((o) => Number.isFinite(o.score)).sort((a, b) => b.score - a.score).slice(0, eliteCount);
      if (!elite.length) return;
      for (const range of options.space) {
        const values = elite.map((o) => o.proposal.params[range.name]!);
        const m = values.reduce((s, v) => s + v, 0) / values.length;
        const sd = Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length);
        mean.set(range.name, m);
        std.set(range.name, Math.max(range.step, sd));
      }
    },
  };
}
