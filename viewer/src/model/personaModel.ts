import { arr, rec, type FitRange, type GameModel, type ModelConversation, type ModelPrediction } from "./gameModel.js";
import { predictionOf } from "./dealerFit.js";

/**
 * What TODAY's model knows about the persona of a conversation, even if the conversation is old or closed:
 * `personas[].model` (fields `{ value, lo, hi, n, source, lastTick }`) if the server provides it; otherwise the fit's
 * estimates (`personas[].estimates` or `fit.estimates`). Dealer side only; never a value of ours.
 * Pure functions only; nothing here decides a figure.
 */

/** Book by rarity (the same one the per-persona fit uses). */
export const RARITY_BOOK: Readonly<Record<string, number>> = { common: 10, uncommon: 25, rare: 70, epic: 180, legendary: 450 };

const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const fmt = (x: number) => String(Math.round(x * 100) / 100);

function rangeOf(x: unknown): FitRange | null {
  const o = rec(x);
  const mean = num(o.mean);
  return mean === undefined ? null : { mean, lo: num(o.lo) ?? mean, hi: num(o.hi) ?? mean };
}

/** HER side: when we buy, she sells. */
export const herSide = (c: ModelConversation): "sells" | "buys" => (c.side === "buy" ? "sells" : "buys");

/** «we buy · she sells» / «we sell · she buys» (dealers); «we buy» / «we sell» otherwise. */
export function sideLabel(c: ModelConversation): string {
  return c.kind === "dealer" ? `we ${c.side} · she ${herSide(c) === "sells" ? "sells" : "buys"}` : `we ${c.side}`;
}

function personaRec(model: GameModel | null, id: string): Record<string, unknown> | undefined {
  return arr(model?.state?.personas).map(rec).find((p) => p.id === id);
}

function estimatesOf(model: GameModel | null, id: string): Record<string, unknown> {
  return rec(personaRec(model, id)?.estimates ?? model?.fit?.estimates?.[id]);
}

/** Band of the conversation (`sells|buys:<rarity>`): the state's rarity or, if missing, the one the fit stored. */
export function convBand(model: GameModel | null, c: ModelConversation): string | null {
  if (c.asset.rarity) return `${herSide(c)}:${c.asset.rarity}`;
  return model?.fit?.bands?.[c.id] ?? null;
}

export const isWelcome = (model: GameModel | null, c: ModelConversation): boolean => (model?.fit?.welcome ?? []).includes(c.id);

export interface ParamLine {
  key: string;
  label: string;
  /** «value [lo–hi] · n · source» or «unknown». */
  text: string;
  /** The same pieces separately, to render them in a table; `value` is `null` if unknown. */
  value: string | null;
  range: string;
  n: number | null;
  source: string;
}

interface Val {
  value: number | boolean | null;
  lo: number | null;
  hi: number | null;
  n: number;
  source: string;
}

function fieldVal(x: unknown): Val | null {
  const o = rec(x);
  if (!("value" in o)) return null;
  const v = o.value;
  return { value: typeof v === "number" || typeof v === "boolean" ? v : null, lo: num(o.lo) ?? null, hi: num(o.hi) ?? null, n: num(o.n) ?? 0, source: typeof o.source === "string" ? o.source : "?" };
}

function textOf(v: Val | null): string {
  if (!v || v.value === null || v.source === "unknown") return "unknown";
  const value = typeof v.value === "boolean" ? (v.value ? "yes" : "no") : fmt(v.value);
  const range = v.lo !== null && v.hi !== null && v.lo !== v.hi ? ` [${fmt(v.lo)}–${fmt(v.hi)}]` : "";
  return `${value}${range} · n${v.n} · ${v.source}`;
}

function cellsOf(v: Val | null): Pick<ParamLine, "value" | "range" | "n" | "source"> {
  if (!v || v.value === null || v.source === "unknown") return { value: null, range: "", n: null, source: "" };
  const value = typeof v.value === "boolean" ? (v.value ? "yes" : "no") : fmt(v.value);
  const range = v.lo !== null && v.hi !== null && v.lo !== v.hi ? `${fmt(v.lo)}–${fmt(v.hi)}` : "";
  return { value, range, n: v.n, source: v.source };
}

const fromRange = (r: FitRange | null, n: number, source: string): Val | null => (r ? { value: r.mean, lo: r.lo, hi: r.hi, n, source } : null);
const fromScalar = (x: unknown, n: number, source: string): Val | null => (typeof x === "number" || typeof x === "boolean" ? { value: x, lo: null, hi: null, n, source } : null);

/** One value of the persona model: `personas[].model.strategy[key]` or, if missing, the estimates fallback. */
function strategyVal(model: GameModel | null, persona: string, key: string, fallback: () => Val | null): Val | null {
  const pm = rec(rec(personaRec(model, persona)?.model).strategy);
  const f = fieldVal(pm[key]);
  return f ?? fallback();
}

/** The persona's strategy parameters, from today's model (those of the relevant side), «unknown» if not known. */
export function strategyLines(model: GameModel | null, c: ModelConversation): ParamLine[] {
  const id = c.counterparty;
  const e = estimatesOf(model, id);
  const n = num(e.fittedFrom) ?? 0;
  const side = herSide(c);
  const welcome = rec(e.welcome);
  const welcomeSideOk = welcome.side === undefined || welcome.side === side;
  const markupKey = side === "sells" ? "opening_markup_sell" : "opening_markup_buy";
  const walk = strategyVal(model, id, "walk_after_rounds", () => fromRange(rangeOf(e.walk_after_rounds), n, "fit"));
  const jitter = strategyVal(model, id, "patience_jitter", () => fromScalar(e.patience_jitter, 0, "prior"));
  const lines: [string, string, Val | null][] = [
    [markupKey, `opening_markup (she ${side})`, strategyVal(model, id, markupKey, () => fromRange(rangeOf(side === "buys" ? (e.opening_markup_buy ?? e.opening_markup) : e.opening_markup), n, "fit"))],
    ["beta", "beta", strategyVal(model, id, "beta", () => fromRange(rangeOf(e.beta), n, "fit"))],
    ["max_rounds", "max_rounds", strategyVal(model, id, "max_rounds", () => fromRange(rangeOf(e.max_rounds), n, "fit"))],
    ["accept_margin", "accept_margin", strategyVal(model, id, "accept_margin", () => fromScalar(e.accept_margin, 0, "prior"))],
    ["mirror_concessions", "mirror_concessions", strategyVal(model, id, "mirror_concessions", () => (e.mirror === true || e.mirror === false ? fromScalar(e.mirror, n, "fit") : null))],
    ["welcome_first_deal", "welcome_first_deal", strategyVal(model, id, "welcome_first_deal", () => fromScalar(e.welcome_first_deal, num(welcome.n) ?? 0, (num(welcome.n) ?? 0) > 0 ? "measured" : "prior"))],
    [
      `welcome_price_frac_${side === "sells" ? "sell" : "buy"}`,
      `welcome_price_frac (she ${side})`,
      strategyVal(model, id, `welcome_price_frac_${side === "sells" ? "sell" : "buy"}`, () => (welcomeSideOk ? fromRange(rangeOf(welcome.frac_of_book), num(welcome.n) ?? 0, (num(welcome.n) ?? 0) > 0 ? "measured" : "prior") : null)),
    ],
    ["limit_jitter", "limit_jitter", strategyVal(model, id, "limit_jitter", () => fromScalar(e.limit_jitter, 0, "prior"))],
    ["demand_markup", "demand_markup", strategyVal(model, id, "demand_markup", () => null)],
    ["politeness_discount", "politeness_discount", strategyVal(model, id, "politeness_discount", () => null)],
  ];
  const out: ParamLine[] = lines.map(([key, label, v]) => ({ key, label, text: textOf(v), ...cellsOf(v) }));
  const walkText = textOf(walk);
  const j = jitter && typeof jitter.value === "number" && jitter.source !== "unknown" ? jitter.value : null;
  const walkCells = cellsOf(walk);
  out.splice(3, 0, {
    key: "walk_after_rounds",
    label: "walk_after_rounds ± patience_jitter",
    text: walkText === "unknown" ? "unknown" : `${walkText}${j !== null ? ` · ± ${fmt(j)} (${jitter!.source})` : " · ± unknown"}`,
    ...walkCells,
    value: walkCells.value === null ? null : `${walkCells.value} ± ${j !== null ? fmt(j) : "?"}`,
    source: walkCells.value === null ? "" : `${walkCells.source}${j !== null ? ` · ± ${jitter!.source}` : ""}`,
  });
  return out;
}

/** Its estimated walk-away round, to compare with our patience budget: «4.8 ± 1» or `null`. */
export function herWalkText(model: GameModel | null, c: ModelConversation): string | null {
  if (c.kind !== "dealer") return null;
  const e = estimatesOf(model, c.counterparty);
  const walk = strategyVal(model, c.counterparty, "walk_after_rounds", () => fromRange(rangeOf(e.walk_after_rounds), 0, "fit"));
  if (!walk || typeof walk.value !== "number") return "unknown";
  const jitter = strategyVal(model, c.counterparty, "patience_jitter", () => fromScalar(e.patience_jitter, 0, "prior"));
  return `${fmt(walk.value)}${jitter && typeof jitter.value === "number" ? ` ± ${fmt(jitter.value)}` : ""}`;
}

export interface BandView {
  band: string;
  /** floor (she sells) or ceiling (she buys). */
  kind: "floor" | "ceiling";
  limit: string;
  /** The limit's pieces separately (table); `value` `null` if there is no measurement. */
  cells: Pick<ParamLine, "value" | "range" | "n" | "source">;
  samples: number;
  fewSamples: boolean;
  book: number | null;
}

/** Measured limit of the conversation's band (today's model), or `null` if there is no band or measurement. */
export function bandView(model: GameModel | null, c: ModelConversation): BandView | null {
  const band = convBand(model, c);
  if (!band) return null;
  const book = RARITY_BOOK[band.split(":")[1] ?? ""] ?? null;
  const kind = band.startsWith("sells:") ? "floor" : "ceiling";
  const mb = rec(rec(rec(personaRec(model, c.counterparty)?.model).bands)[band]);
  const mLimit = fieldVal(mb.limit);
  if (mLimit && mLimit.value !== null) return { band, kind, limit: textOf(mLimit), cells: cellsOf(mLimit), samples: mLimit.n, fewSamples: mLimit.n < 3, book };
  const b = rec(rec(estimatesOf(model, c.counterparty).bands)[band]);
  const r = rangeOf(b.limit);
  if (!r) return { band, kind, limit: "unknown", cells: cellsOf(null), samples: 0, fewSamples: true, book };
  const samples = num(b.samples) ?? 0;
  const v = fromRange(r, samples, "fit");
  return { band, kind, limit: textOf(v), cells: cellsOf(v), samples, fewSamples: b.fewSamples === true || samples < 3, book };
}

/** The same formula as the fit (persona-fit's `says`): its price at round r from `open` toward `limit`. */
function says(open: number, limit: number, r: number, beta: number, maxRounds: number, dealerSells: boolean): number {
  const t = open + (limit - open) * Math.min(1, r / Math.max(1, maxRounds)) ** (1 / Math.max(0.05, beta));
  return dealerSells ? Math.max(Math.ceil(t - 1e-9), Math.ceil(limit - 1e-9)) : Math.min(Math.floor(t + 1e-9), Math.floor(limit + 1e-9));
}

/**
 * Its curve per TODAY's model. If the server already provides `prediction` (this tick's fit) it is used; otherwise (old
 * or closed conversation, or no rarity in the state), it is computed here: from its opening to its band limit (the welcome one
 * if `welcome`), with current β and `max_rounds`; the lo–hi band spans the limit and β extremes.
 */
export function currentPrediction(model: GameModel | null, c: ModelConversation | null): ModelPrediction | null {
  if (!c || c.kind !== "dealer") return null;
  const served = predictionOf(c);
  if (served) return served;
  const open = c.history.herPrices[0];
  if (open === undefined) return null;
  const e = estimatesOf(model, c.counterparty);
  const pick = (key: string, fb: unknown): FitRange | null => {
    const f = fieldVal(rec(rec(personaRec(model, c.counterparty)?.model).strategy)[key]);
    if (f && typeof f.value === "number") return { mean: f.value, lo: f.lo ?? f.value, hi: f.hi ?? f.value };
    return rangeOf(fb);
  };
  const beta = pick("beta", e.beta);
  const maxR = pick("max_rounds", e.max_rounds);
  const walk = pick("walk_after_rounds", e.walk_after_rounds);
  const band = convBand(model, c);
  const welcome = isWelcome(model, c) ? rangeOf(rec(e.welcome).limit) : null;
  const limit = welcome ?? (band ? rangeOf(rec(rec(rec(e.bands)[band]).limit)) : null);
  if (!beta || !maxR || !limit) return null;
  const sells = herSide(c) === "sells";
  const mr = Math.max(1, Math.round(maxR.mean));
  const curve = Array.from({ length: mr + 1 }, (_, r) => {
    const ps = [limit.lo, limit.hi].flatMap((L) => [beta.lo, beta.hi].map((b) => says(open, L, r, b, mr, sells)));
    return { round: r, price: says(open, limit.mean, r, beta.mean, mr, sells), lo: Math.min(...ps), hi: Math.max(...ps) };
  });
  return { herLimit: limit, curve, walkRound: walk ?? { mean: mr, lo: mr, hi: mr }, mirror: e.mirror === true || e.mirror === false ? e.mirror : "unknown", fittedFrom: num(e.fittedFrom) ?? 0 };
}
