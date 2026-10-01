import { parseConfig, type AgentConfig } from "../engine/config.js";
import type { Rng } from "../engine/rng.js";

/** Parámetros del motor que el ajuste puede mover (los pesos de issue no: con un solo issue no cambian nada). */
export const TUNABLE = ["beta", "openingMargin", "acceptMargin", "acTimeThreshold", "noise", "reciprocity"] as const;
export type TunableParam = (typeof TUNABLE)[number];
export type Params = Partial<Record<TunableParam, number>>;

export interface ParamRange {
  name: TunableParam;
  min: number;
  max: number;
  /** Paso de redondeo (y de la rejilla). */
  step: number;
}

/** Rangos declarados del barrido. */
export const PARAM_SPACE: readonly ParamRange[] = [
  { name: "beta", min: 0.05, max: 1, step: 0.05 },
  { name: "openingMargin", min: 0.6, max: 1, step: 0.05 },
  { name: "acceptMargin", min: 0, max: 0.05, step: 0.01 },
  { name: "acTimeThreshold", min: 0.8, max: 0.98, step: 0.02 },
  { name: "noise", min: 0, max: 0.3, step: 0.05 },
  { name: "reciprocity", min: 0, max: 1, step: 0.25 },
];

export function snap(range: ParamRange, value: number): number {
  const clamped = Math.min(range.max, Math.max(range.min, value));
  const k = Math.round((clamped - range.min) / range.step);
  return Number(Math.min(range.max, range.min + k * range.step).toFixed(6));
}

export function sampleParams(space: readonly ParamRange[], rng: Rng): Params {
  const params: Params = {};
  for (const range of space) params[range.name] = snap(range, rng.between(range.min, range.max));
  return params;
}

/** Valores de la rejilla de un rango con `levels` niveles equiespaciados (extremos incluidos). */
export function gridValues(range: ParamRange, levels: number): number[] {
  if (levels < 2) return [snap(range, (range.min + range.max) / 2)];
  const values = Array.from({ length: levels }, (_, k) => snap(range, range.min + ((range.max - range.min) * k) / (levels - 1)));
  return [...new Set(values)];
}

/** La configuración base con los parámetros propuestos, validada con el esquema. */
export function applyParams(base: AgentConfig, params: Params): AgentConfig {
  return parseConfig({ ...base, ...params }, "candidata");
}

export const paramsKey = (params: Params) => TUNABLE.filter((n) => params[n] !== undefined).map((n) => `${n}=${params[n]}`).join(",");

/** Los parámetros ajustables presentes en una configuración. */
export function paramsOf(config: AgentConfig): Params {
  const params: Params = {};
  for (const name of TUNABLE) if (config[name] !== undefined) params[name] = config[name];
  return params;
}
