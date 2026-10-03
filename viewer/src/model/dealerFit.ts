import { niceScale, type OfferCurve } from "./cockpit.js";
import { arr, rec, type FitRange, type GameModel, type ModelConversation, type ModelPersonaEstimates, type ModelPrediction } from "./gameModel.js";

/**
 * Per-persona curve fit as served by `/api/bazaar/model`: the prediction for each dealer conversation
 * (`prediction`) and each persona's estimates (`estimates`). Dealer side only: nothing here carries a
 * private value of ours or a reserve. Pure functions only; nothing here computes a figure.
 */

const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);

function rangeOf(x: unknown): FitRange | null {
  const o = rec(x);
  const mean = num(o.mean);
  if (mean === undefined) return null;
  return { mean, lo: num(o.lo) ?? mean, hi: num(o.hi) ?? mean };
}

const mirrorOf = (x: unknown): boolean | "unknown" => (x === true || x === false ? x : "unknown");

/** Prediction for a conversation (tolerant: `null` if missing or malformed). */
export function predictionOf(conv: ModelConversation | null): ModelPrediction | null {
  const o = rec(conv?.prediction);
  const herLimit = rangeOf(o.herLimit);
  const walkRound = rangeOf(o.walkRound);
  if (!herLimit || !walkRound) return null;
  const curve = arr(o.curve).flatMap((x) => {
    const p = rec(x);
    const round = num(p.round);
    const price = num(p.price);
    return round === undefined || price === undefined ? [] : [{ round, price, lo: num(p.lo) ?? price, hi: num(p.hi) ?? price }];
  });
  const herNext = num(o.herNext);
  return { ...(herNext !== undefined ? { herNext } : {}), herLimit, curve, walkRound, mirror: mirrorOf(o.mirror), fittedFrom: num(o.fittedFrom) ?? 0 };
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const fmtP = (x: number) => String(round1(x));
const mirrorText = (m: boolean | "unknown") => (m === true ? "yes" : m === false ? "no" : "unknown");

/** "fitted from n observations · mirror yes/no/unknown · next ≈ X P". */
export function predictionCaption(p: ModelPrediction): string {
  return `fitted from ${p.fittedFrom} observation${p.fittedFrom === 1 ? "" : "s"} · mirror ${mirrorText(p.mirror)} · next ${p.herNext !== undefined ? `≈ ${fmtP(p.herNext)} P` : "—"}`;
}

export interface PredictionOverlay {
  predicted: { round: number; value: number; lo: number; hi: number }[];
  theirLimit: { value: number; lo: number; hi: number };
  walkMarker: { round: number; label: string } | null;
}

/**
 * Places the prediction on the curve. Its round r (0 = opening) lands on the x of its r-th observed price
 * (`herXs`); future rounds, one per step after the last painted one. Extends the X and Y axes to fit the path,
 * its band and its limit. `extra`: other already-painted values (e.g. our own predicted path).
 */
export function withPrediction(
  curve: OfferCurve,
  pred: ModelPrediction,
  herXs: readonly number[],
  extra: readonly number[] = [],
  /** How position x is named on the X axis (e.g. «step 6» or «tick 105»); the walk-away label names it. */
  xText: (x: number) => string = (x) => `x ${x}`,
): { curve: OfferCurve; overlay: PredictionOverlay } {
  // A single rule for the curve and the marker: its round r (0 = opening) lands on the x of its r-th price (in steps,
  // x = r + 1); future rounds, one x per round after the last painted one.
  const lastX = Math.max(0, curve.rounds - 1, ...curve.ours.map((p) => p.round), ...curve.theirs.map((p) => p.round));
  const xFor = (r: number) => (r < herXs.length ? herXs[r]! : lastX + (r - herXs.length + 1));
  const predicted = pred.curve.map((p) => ({ round: xFor(p.round), value: p.price, lo: Math.min(p.lo, p.hi), hi: Math.max(p.lo, p.hi) }));
  const walkR = Math.round(pred.walkRound.mean);
  const walkX = xFor(walkR);
  const walkMarker = walkR > 0 ? { round: walkX, label: `walk ≈ round ${walkR}${pred.walkRound.lo !== pred.walkRound.hi ? ` (${fmtP(pred.walkRound.lo)}–${fmtP(pred.walkRound.hi)})` : ""} = ${xText(walkX)}` } : null;
  const theirLimit = { value: pred.herLimit.mean, lo: pred.herLimit.lo, hi: pred.herLimit.hi };
  const maxX = Math.max(lastX, ...predicted.map((p) => p.round), walkMarker?.round ?? 0);
  const values = [...curve.ours, ...curve.theirs, ...curve.limit]
    .map((p) => p.value)
    .concat(curve.reference ? [curve.reference.value] : [], extra, predicted.flatMap((p) => [p.lo, p.hi]), [theirLimit.lo, theirLimit.hi]);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const scale = niceScale(lo - Math.max(1, (hi - lo) * 0.1), hi + Math.max(1, (hi - lo) * 0.1));
  return { curve: { ...curve, rounds: maxX + 1, yDomain: scale.domain, yTicks: scale.ticks }, overlay: { predicted, theirLimit, walkMarker } };
}

/** Lines of the cursor box with what is predicted at that x (its price, its limit, the walk-away). */
export function predictionLines(o: PredictionOverlay, x: number): string[] {
  const p = o.predicted.find((q) => q.round === x);
  const out: string[] = [];
  if (p) out.push(`her predicted ${fmtP(p.value)}${p.lo !== p.hi ? ` (${fmtP(p.lo)}–${fmtP(p.hi)})` : ""}`);
  if (p || o.walkMarker?.round === x) out.push(`her limit ≈ ${fmtP(o.theirLimit.value)} (${fmtP(o.theirLimit.lo)}–${fmtP(o.theirLimit.hi)})`);
  if (o.walkMarker?.round === x) out.push(o.walkMarker.label);
  return out;
}

// ---------------------------------------------------------------- per-persona estimates

export interface EstimateRow {
  key: string;
  label: string;
  value: string;
  interval: string;
  n: number;
  /** How it converges: one point each time the mean changed. */
  series: { tick: number; value: number }[];
}

export interface BandRow extends EstimateRow {
  fewSamples: boolean;
  best: string;
}

export interface DealerEstimatesView {
  id: string;
  name: string;
  fittedFrom: number;
  mirror: string;
  params: EstimateRow[];
  bands: BandRow[];
}

const PARAMS: { key: "opening_markup" | "beta" | "max_rounds" | "walk_after_rounds"; label: string }[] = [
  { key: "opening_markup", label: "opening markup" },
  { key: "beta", label: "β (concession shape)" },
  { key: "max_rounds", label: "max rounds" },
  { key: "walk_after_rounds", label: "walks after (rounds)" },
];

const interval = (r: FitRange) => (r.lo === r.hi ? "—" : `${fmtV(r.lo)}–${fmtV(r.hi)}`);
const fmtV = (x: number) => String(Math.round(x * 100) / 100);

function viewOf(id: string, name: string, e: ModelPersonaEstimates): DealerEstimatesView {
  const history = arr(e.history).map(rec);
  const series = (param: string) =>
    history.flatMap((h) => {
      const tick = num(h.tick);
      const value = num(h.value);
      return h.param === param && tick !== undefined && value !== undefined ? [{ tick, value }] : [];
    });
  const fitted = num(e.fittedFrom) ?? 0;
  const params: EstimateRow[] = PARAMS.flatMap(({ key, label }) => {
    const r = rangeOf(e[key]);
    return r ? [{ key, label, value: fmtV(r.mean), interval: interval(r), n: fitted, series: series(key) }] : [];
  });
  const margin = num(e.accept_margin);
  if (margin !== undefined) params.push({ key: "accept_margin", label: "accept margin (prior)", value: fmtV(margin), interval: "—", n: 0, series: [] });
  const bands: BandRow[] = Object.entries(rec(e.bands)).flatMap(([band, x]) => {
    const b = rec(x);
    const r = rangeOf(b.limit);
    if (!r) return [];
    const samples = num(b.samples) ?? 0;
    return [{ key: band, label: band.replace(":", " "), value: fmtV(r.mean), interval: interval(r), n: samples, series: series(`limit:${band}`), fewSamples: b.fewSamples === true || samples < 3, best: num(b.best) !== undefined ? fmtV(num(b.best)!) : "—" }];
  });
  bands.sort((a, b) => a.key.localeCompare(b.key));
  return { id, name, fittedFrom: fitted, mirror: mirrorText(mirrorOf(e.mirror)), params, bands };
}

/** Per-persona estimates: `state.personas[].estimates` and, for those missing, the server's `fit.estimates`. */
export function dealerEstimates(model: GameModel): DealerEstimatesView[] {
  const out = new Map<string, DealerEstimatesView>();
  for (const x of arr(model.state?.personas)) {
    const p = rec(x);
    const id = typeof p.id === "string" ? p.id : undefined;
    if (!id || !p.estimates || typeof p.estimates !== "object") continue;
    out.set(id, viewOf(id, typeof p.name === "string" && p.name ? p.name : id, p.estimates as ModelPersonaEstimates));
  }
  for (const [id, e] of Object.entries(model.fit?.estimates ?? {})) if (!out.has(id) && e && typeof e === "object") out.set(id, viewOf(id, id, e));
  return [...out.values()].sort((a, b) => b.fittedFrom - a.fittedFrom || a.id.localeCompare(b.id));
}

// ---------------------------------------------------------------- «Dealer fit» strip of the drawer

export interface DealerFitStrip {
  persona: string;
  band: string;
  /** β, max_rounds, markup, mirror and walk-away round, each with its interval and n. */
  items: { label: string; value: string; interval: string; n: string }[];
  /** Measured limit of that band (its side), or `null` if there is none yet. */
  limit: { value: string; interval: string; samples: number; fewSamples: boolean } | null;
  /** The team's first conversation with that dealer: it only measures the limit, not the curve. */
  welcome: boolean;
  /** Limit measured in that persona's `welcome` conversations (`estimates.welcome`), if the fit carries it. */
  welcomeLimit: { value: string; interval: string; n: number } | null;
}

/** Estimates for the persona and band of a dealer conversation (`null` if not a dealer or no fit). */
export function dealerFitStrip(model: GameModel | null, conv: ModelConversation | null): DealerFitStrip | null {
  if (!model || !conv || conv.kind !== "dealer") return null;
  const persona = conv.counterparty;
  const fromState = arr(model.state?.personas).map(rec).find((p) => p.id === persona);
  const e = rec(fromState?.estimates ?? model.fit?.estimates?.[persona]);
  if (num(e.fittedFrom) === undefined) return null;
  const band = conv.asset.rarity ? `${conv.side === "buy" ? "sells" : "buys"}:${conv.asset.rarity}` : (model.fit?.bands?.[conv.id] ?? `${conv.side === "buy" ? "sells" : "buys"}:?`);
  const n = String(num(e.fittedFrom));
  const item = (label: string, key: string) => {
    const r = rangeOf(e[key]);
    return r ? [{ label, value: fmtV(r.mean), interval: interval(r), n }] : [];
  };
  const b = rec(rec(e.bands)[band]);
  const lim = rangeOf(b.limit);
  const samples = num(b.samples) ?? 0;
  const welcome = (model.fit?.welcome ?? []).includes(conv.id) || rec(conv.prediction).welcome === true || rec(conv).welcome === true;
  return {
    persona: typeof fromState?.name === "string" && fromState.name ? fromState.name : persona,
    band: `she ${band.replace(":", " · ")}`,
    items: [
      ...item("β", "beta"),
      ...item("max_rounds", "max_rounds"),
      ...item("markup", "opening_markup"),
      { label: "mirror", value: mirrorText(mirrorOf(e.mirror)), interval: "—", n },
      ...item("walk round", "walk_after_rounds"),
    ],
    limit: lim ? { value: fmtV(lim.mean), interval: interval(lim), samples, fewSamples: b.fewSamples === true || samples < 3 } : null,
    welcome,
    welcomeLimit: (() => {
      const w = rec(e.welcome);
      const r = rangeOf(w.limit);
      return r ? { value: fmtV(r.mean), interval: interval(r), n: num(w.n) ?? 0 } : null;
    })(),
  };
}
