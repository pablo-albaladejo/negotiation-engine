import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { mirrorVerdict, stepResponses, type MirrorVerdict } from "../negotiation/negotiator.js";

/**
 * Fit of the dealer curve at PERSONA level (personas.md § 3.2–3.3). All personas use the same formula:
 *
 *   target(r) = open + (limit − open) · min(1, r / max_rounds)^(1/β)        r = dealer counteroffers so far
 *   says(r)   = sells ? max(ceil(target), ceil(limit)) : min(floor(target), floor(limit))
 *   after walk_after_rounds ± jitter: final = its limit for THAT conversation (± limit_jitter, 5 secret steps)
 *
 * `opening_markup`, β, `max_rounds`, `accept_margin`, `walk_after_rounds` and the mirror belong to the persona's strategy
 * (shared by all its conversations and bands); only the limit is per band and conversation. It starts from priors
 * (editor defaults and what was measured on Abuela and El Chato) and is updated with each observed price,
 * accounting for rounding (ceil when selling, floor when buying). Pure except `loadPosterior` / `savePosterior`.
 * Structure only (prices), never text. Private: never appears in a message.
 */

/** Book value per rarity (site-map § 8.2). */
export const RARITY_BOOK: Readonly<Record<string, number>> = { common: 10, uncommon: 25, rare: 70, epic: 180, legendary: 450 };

/** A conversation observed with a persona (structure only). */
export interface ConvObs {
  id: string;
  persona: string;
  /** Band: `sells:<rarity or item>` (the dealer sells) or `buys:<rarity>` (the dealer buys). */
  band: string;
  dealerSells: boolean;
  book: number;
  /** Its prices per round (0 = opening). */
  her: number[];
  ours: number[];
  /** Its last price is its final offer (= its limit in this conversation). */
  final: boolean;
  /** It walked away (walked / no_progress) after `ours.length` counteroffers of ours. */
  walked?: boolean;
  tick?: number;
  /**
   * The team's first conversation with that dealer (*welcome_first_deal*): its opening IS its limit and stays flat,
   * so it measures the welcome limit but does NOT enter the curve fit (β, max_rounds, markup, mirror or bands).
   */
  welcome?: boolean;
}

export interface Range {
  mean: number;
  lo: number;
  hi: number;
}

export interface BandEstimate {
  limit: Range;
  /** Conversations with at least one counteroffer from it or its final. */
  samples: number;
  /** Fewer than 3 samples: the limit may still sit on another jitter step (open more conversations, low priority). */
  fewSamples: boolean;
  /** The sample most favorable to us (the lowest floor when it sells; the highest ceiling when it buys). */
  best: number;
}

export interface PersonaEstimates {
  opening_markup: Range;
  beta: Range;
  max_rounds: Range;
  /** No data identifies it: prior (fraction of the book). */
  accept_margin: number;
  walk_after_rounds: Range;
  mirror: boolean | "unknown";
  /** Opening markup when SHE BUYS, if it differs from selling (Chato: ~0.14 vs 0.25); otherwise `opening_markup` applies. */
  opening_markup_buy?: Range;
  /** Spread of the limit across conversations (fraction of the book); prior, not refit. */
  limit_jitter?: number;
  /** Welcome limit measured in the first conversation (its opening, in P and as a fraction of the book); `n` = 0 is the prior. */
  welcome?: { limit: Range; frac_of_book: Range; n: number; side?: "buys" | "sells" };
  /** Prior for `patience_jitter` (rounds); not refit. */
  patience_jitter?: number;
  /** `welcome_first_deal`: offline prior (true/false) or measured (true) if there is a welcome conversation. */
  welcome_first_deal?: boolean;
  bands: Record<string, BandEstimate>;
  /** Conversations used in the fit. */
  fittedFrom: number;
  /** How each estimate converges: one point each time its mean changes. */
  history: { tick: number; param: string; value: number }[];
}

export interface Prediction {
  herNext?: number;
  herLimit: Range;
  /** Its expected path up to `max_rounds`. */
  curve: { round: number; price: number; lo: number; hi: number }[];
  walkRound: Range;
  mirror: boolean | "unknown";
  /** Its prices from this conversation that were used (opening included). */
  fittedFrom: number;
}

export interface PriorBand {
  /** Fractions of the book (the neighborhood, of its list). */
  mean: number;
  lo: number;
  hi: number;
  /** Conversations of the offline fit that back it. */
  n: number;
}

export interface PersonaPrior {
  openingMarkup: number;
  /** Markup when she buys, if it differs from selling. */
  openingMarkupBuy?: number;
  /** Mirror measured offline (`mirror_concessions`); overrides "unknown" and indecisive data. */
  mirror?: boolean;
  /** false: the mirror is not identifiable (Abuela: her curve already explains the steps); the data verdict doesn't count and yields "unknown". */
  mirrorIdentifiable?: boolean;
  /** Pseudo-observations from the offline fit (0 = the usual weak prior). How much it weighs against new data. */
  priorWeight: number;
  limitJitter?: number;
  /** `welcome_first_deal`: its welcome opening as a fraction of the book (Abuela buys a common at 13 = 1.3 × book; `welcome_price_frac` ≈ 0.7). */
  welcomeFracOfBook?: number;
  /** Welcome side: `buys` = she buys at her welcome ceiling (Abuela), `sells` = she sells at her floor. */
  welcomeSide?: "buys" | "sells";
  /** `welcome_first_deal` measured offline (Chato: probably not). If missing and `welcomeFracOfBook` is set, it is true. */
  welcomeFirstDeal?: boolean;
  /** `patience_jitter` measured offline (rounds); lower bound on Abuela. */
  patienceJitter?: number;
  /** Limit measured offline per band (`sells:<rarity>` / `buys:<rarity>`). */
  bands?: Record<string, PriorBand>;
  beta: number;
  maxRounds: number;
  walkAfterRounds: number;
  acceptMargin: number;
  floorFrac: number;
  ceilingFrac: number;
  listFrac: number;
}

/** Editor defaults (floor 0.85, ceiling 0.75, list 1) and measured markups (site-map § 8.4). */
export const DEFAULT_PRIOR: PersonaPrior = { openingMarkup: 0.15, priorWeight: 0, beta: 1, maxRounds: 8, walkAfterRounds: 8, acceptMargin: 0.02, floorFrac: 0.85, ceilingFrac: 0.75, listFrac: 1 };
/**
 * Priors measured offline (3 Oct, with our threads and the public feed: Abuela 29 conversations, Chato 13; see
 * docs/bazaar/dealer-fit-2026-10-03.md). The live fit starts here and is updated with each new data point.
 */
export const PERSONA_PRIORS: Readonly<Record<string, Partial<PersonaPrior>>> = {
  abuela: {
    openingMarkup: 0.135,
    mirrorIdentifiable: false,
    beta: 3,
    maxRounds: 6,
    walkAfterRounds: 5.5,
    acceptMargin: 0.02,
    limitJitter: 0.05,
    welcomeFracOfBook: 1.3,
    welcomeSide: "buys",
    patienceJitter: 2,
    priorWeight: 4,
    bands: {
      "sells:common": { mean: 0.86, lo: 0.7, hi: 1, n: 5 },
      "sells:uncommon": { mean: 0.86, lo: 0.74, hi: 0.99, n: 4 },
      // The neighborhood pack has no rarity (not in `bands`): 0.75 of its list [0.70, 0.81], n = 2.
      "buys:common": { mean: 0.58, lo: 0.5, hi: 0.69, n: 6 },
      "buys:uncommon": { mean: 0.58, lo: 0.52, hi: 0.64, n: 2 },
    },
  },
  chato: {
    openingMarkup: 0.25,
    openingMarkupBuy: 0.14,
    beta: 0.35,
    maxRounds: 6,
    walkAfterRounds: 7,
    mirror: true,
    limitJitter: 0.05,
    welcomeFirstDeal: false,
    patienceJitter: 1,
    priorWeight: 4,
    bands: {
      "buys:uncommon": { mean: 0.61, lo: 0.52, hi: 0.68, n: 3 },
      "sells:uncommon": { mean: 1.14, lo: 1.12, hi: 1.16, n: 1 },
      "sells:rare": { mean: 1.1, lo: 0.94, hi: 1.24, n: 3 },
      // Silver pack (no rarity, not in `bands`): 1.13 of its list [1.10, 1.16], n = 1. Never sells below the list.
    },
  },
};

const BETAS = [0.25, 0.35, 0.4, 0.6, 0.8, 1, 1.25, 1.6, 2, 3, 4];
const MAX_ROUNDS = Array.from({ length: 16 }, (_, k) => k + 1);

export function says(open: number, limit: number, r: number, beta: number, maxRounds: number, dealerSells: boolean): number {
  const t = open + (limit - open) * Math.min(1, r / Math.max(1, maxRounds)) ** (1 / Math.max(0.05, beta));
  return dealerSells ? Math.max(Math.ceil(t - 1e-9), Math.ceil(limit - 1e-9)) : Math.min(Math.floor(t + 1e-9), Math.floor(limit + 1e-9));
}

const mean = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const range = (xs: readonly number[], fallback: number): Range => (xs.length ? { mean: mean(xs), lo: Math.min(...xs), hi: Math.max(...xs) } : { mean: fallback, lo: fallback, hi: fallback });
const round2 = (x: number) => Math.round(x * 100) / 100;
const r2 = (r: Range): Range => ({ mean: round2(r.mean), lo: round2(r.lo), hi: round2(r.hi) });

/** Persona's mirror: majority of `mirrorVerdict` across its conversations with answered big steps. */
export function personaMirror(obs: readonly ConvObs[], priorMirror?: boolean): boolean | "unknown" {
  const v = obs.map((o): MirrorVerdict => mirrorVerdict(stepResponses({ side: o.dealerSells ? "buy" : "sell", ourPrices: o.ours, herPrices: o.her, herCurrent: { offerId: 0, price: o.her.at(-1) ?? 0, final: o.final } })));
  const yes = v.filter((x) => x === "mirror").length;
  const no = v.filter((x) => x === "not-mirror").length;
  // With an offline-measured prior, our own data only changes it if decisive (difference ≥ 3 conversations).
  if (priorMirror !== undefined && Math.abs(yes - no) < 3) return priorMirror;
  return yes === no ? "unknown" : yes > no;
}

/** Opening markup: when it sells, opening ÷ (book × list_frac) − 1; when it buys and its final was seen, 1 − opening ÷ final. */
export function markupSamples(obs: readonly ConvObs[], prior: PersonaPrior): { sell: number[]; buy: number[] } {
  const sell: number[] = [];
  const buy: number[] = [];
  for (const o of obs) {
    if (!o.her.length) continue;
    if (o.dealerSells) sell.push(o.her[0]! / (o.book * prior.listFrac) - 1);
    else if (o.final && o.her.at(-1)! > 0) buy.push(1 - o.her[0]! / o.her.at(-1)!);
  }
  const ok = (m: number) => Number.isFinite(m) && m > -0.5 && m < 2;
  return { sell: sell.filter(ok), buy: buy.filter(ok) };
}

/** Estimate that starts from the prior with `w` pseudo-observations and moves with new samples (w = 0: samples only). */
function blendRange(samples: readonly number[], priorMean: number, w: number): Range {
  if (!samples.length) return { mean: priorMean, lo: priorMean, hi: priorMean };
  const m = w > 0 ? (w * priorMean + samples.reduce((a, b) => a + b, 0)) / (w + samples.length) : mean(samples);
  return { mean: m, lo: Math.min(...samples, ...(w > 0 ? [priorMean] : [])), hi: Math.max(...samples, ...(w > 0 ? [priorMean] : [])) };
}

/** Points (r, price) of a conversation that inform the curve: without the steps the mirror trimmed. */
function fitPoints(o: ConvObs, mirror: boolean | "unknown"): { r: number; price: number }[] {
  const pts: { r: number; price: number }[] = [];
  for (let r = 1; r < o.her.length; r++) {
    if (o.final && r === o.her.length - 1) continue; // the final is the limit, not a point on the curve
    const step = Math.abs(o.her[r]! - o.her[r - 1]!);
    const ourStep = r - 1 < o.ours.length && r >= 2 ? Math.abs((o.ours[r - 1] ?? 0) - (o.ours[r - 2] ?? 0)) : Infinity;
    if (mirror === true && step > 0 && step <= Math.max(ourStep, 0.02 * o.book) + 1e-9) continue; // trimmed by the mirror
    pts.push({ r, price: o.her[r]! });
  }
  return pts;
}

/** Limit candidates for a conversation (its final fixes it; otherwise, the range its prices allow). */
function limitCandidates(o: ConvObs, markup: number, prior: PersonaPrior): number[] {
  if (o.final && o.her.length) return [o.her.at(-1)!];
  const open = o.her[0]!;
  const step = Math.max(0.25, o.book / 100);
  const out: number[] = [];
  if (o.dealerSells) {
    const hi = Math.min(...o.her);
    for (let l = hi; l >= Math.max(0.5, hi * 0.4); l -= step) out.push(l);
  } else {
    const lo = Math.max(...o.her);
    const center = Math.max(lo, open / Math.max(0.05, 1 - markup));
    for (let l = lo; l <= Math.max(center * 1.3, lo + 4 * step); l += step) out.push(l);
  }
  return out.length ? out : [o.dealerSells ? o.book * prior.floorFrac : o.book * prior.ceilingFrac];
}

interface Fit {
  beta: number;
  maxRounds: number;
  cost: number;
  limits: Map<string, number>;
}

function fitAll(obs: readonly ConvObs[], markupOf: (o: ConvObs) => number, mirror: boolean | "unknown", prior: PersonaPrior): Fit[] {
  const fits: Fit[] = [];
  for (const beta of BETAS) {
    for (const maxRounds of MAX_ROUNDS) {
      // Weak prior: β near the prior (in log) and max_rounds near the prior.
      let cost = (1 + prior.priorWeight) * (0.5 * Math.log(beta / prior.beta) ** 2 + 0.5 * ((maxRounds - prior.maxRounds) / prior.maxRounds) ** 2);
      const limits = new Map<string, number>();
      for (const o of obs) {
        if (!o.her.length) continue;
        const pts = fitPoints(o, mirror);
        let best = { l: NaN, c: Infinity };
        for (const l of limitCandidates(o, markupOf(o), prior)) {
          let c = 0;
          for (const p of pts) c += (says(o.her[0]!, l, p.r, beta, maxRounds, o.dealerSells) - p.price) ** 2;
          if (c < best.c - 1e-9) best = { l, c };
        }
        cost += best.c;
        limits.set(o.id, best.l);
      }
      fits.push({ beta, maxRounds, cost, limits });
    }
  }
  return fits.sort((a, b) => a.cost - b.cost);
}

/** Fits almost as good as the best: they give the ranges (lo/hi). */
const nearBest = (fits: readonly Fit[]) => fits.filter((f) => f.cost <= fits[0]!.cost + Math.max(1, 0.1 * fits[0]!.cost));

export interface PersonaFit {
  estimates: PersonaEstimates;
  predictions: Map<string, Prediction>;
}

/**
 * Fits a persona with all its observed conversations and predicts each one. `previous` supplies the history (how
 * each estimate converges) and a point is added for each parameter whose mean changed.
 */
export function fitPersona(persona: string, obs: readonly ConvObs[], tick: number, previous?: PersonaEstimates): PersonaFit {
  const prior: PersonaPrior = { ...DEFAULT_PRIOR, ...PERSONA_PRIORS[persona] };
  const all = obs.filter((o) => o.persona === persona && o.her.length > 0);
  // Welcome conversations measure the welcome limit, not the curve: left out of the fit.
  const mine = all.filter((o) => !o.welcome);
  const welcomes = all.filter((o) => o.welcome);
  const mirror = prior.mirrorIdentifiable === false ? "unknown" : personaMirror(mine, prior.mirror);
  const mk = markupSamples(mine, prior);
  const mkSell = blendRange(mk.sell, prior.openingMarkup, prior.priorWeight);
  const mkBuy = blendRange(mk.buy, prior.openingMarkupBuy ?? prior.openingMarkup, prior.priorWeight);
  const markupOf = (o: ConvObs) => (o.dealerSells ? mkSell.mean : mkBuy.mean);
  const fits = mine.length ? fitAll(mine, markupOf, mirror, prior) : [];
  const near = fits.length ? nearBest(fits) : [];
  const best = fits[0];
  const walks = mine.flatMap((o) => (o.final ? [o.her.length - 1] : o.walked ? [o.ours.length] : []));
  const walk = walks.length ? (prior.priorWeight > 0 ? blendRange(walks, prior.walkAfterRounds, prior.priorWeight) : range(walks, prior.walkAfterRounds)) : { mean: prior.walkAfterRounds, lo: prior.walkAfterRounds - 2, hi: prior.walkAfterRounds + 2 };

  // Limit per conversation (best fit and range among the near-best) and per band.
  const convLimit = new Map<string, Range>();
  for (const o of mine) {
    const ls = near.map((f) => f.limits.get(o.id)).filter((x): x is number => x !== undefined);
    if (best && ls.length) convLimit.set(o.id, { mean: best.limits.get(o.id)!, lo: Math.min(...ls), hi: Math.max(...ls) });
  }
  const bands: Record<string, BandEstimate> = {};
  for (const band of new Set([...mine.map((o) => o.band), ...Object.keys(prior.bands ?? {})])) {
    const inBand = mine.filter((o) => o.band === band && (o.final || o.her.length > 1));
    const ls = inBand.map((o) => convLimit.get(o.id)).filter((x): x is Range => !!x);
    const sells = band.startsWith("sells:");
    const pb = prior.bands?.[band];
    const book = RARITY_BOOK[band.split(":")[1] ?? ""];
    if (!ls.length && !(pb && book !== undefined)) continue;
    const means = ls.map((x) => x.mean);
    const w = pb && book !== undefined ? pb.n : 0;
    const pm = pb && book !== undefined ? pb.mean * book : 0;
    const lo = Math.min(...ls.map((x) => x.lo), ...(w ? [pb!.lo * book!] : []));
    const hi = Math.max(...ls.map((x) => x.hi), ...(w ? [pb!.hi * book!] : []));
    const lim = { mean: (w * pm + means.reduce((a, b) => a + b, 0)) / (w + means.length), lo, hi };
    const bestData = means.length ? (sells ? Math.min(...means) : Math.max(...means)) : sells ? pb!.lo * book! : pb!.hi * book!;
    bands[band] = { limit: r2(lim), samples: ls.length + w, fewSamples: ls.length + w < 3, best: round2(bestData) };
  }

  const betaR = near.length ? { mean: best!.beta, lo: Math.min(...near.map((f) => f.beta)), hi: Math.max(...near.map((f) => f.beta)) } : { mean: prior.beta, lo: BETAS[0]!, hi: BETAS.at(-1)! };
  const mrR = near.length ? { mean: best!.maxRounds, lo: Math.min(...near.map((f) => f.maxRounds)), hi: Math.max(...near.map((f) => f.maxRounds)) } : { mean: prior.maxRounds, lo: 1, hi: 16 };
  const est: Omit<PersonaEstimates, "history"> = {
    opening_markup: r2(mkSell),
    ...(prior.openingMarkupBuy !== undefined || mk.buy.length ? { opening_markup_buy: r2(mkBuy) } : {}),
    beta: betaR,
    max_rounds: mrR,
    accept_margin: prior.acceptMargin,
    ...(prior.limitJitter !== undefined ? { limit_jitter: prior.limitJitter } : {}),
    ...(prior.patienceJitter !== undefined ? { patience_jitter: prior.patienceJitter } : {}),
    ...(welcomes.length ? { welcome_first_deal: true } : prior.welcomeFirstDeal !== undefined ? { welcome_first_deal: prior.welcomeFirstDeal } : prior.welcomeFracOfBook !== undefined ? { welcome_first_deal: true } : {}),
    ...welcomeEstimate(welcomes, prior),
    walk_after_rounds: r2(walk),
    mirror,
    bands,
    fittedFrom: all.length,
  };
  const history = [...(previous?.history ?? [])];
  const last = (param: string) => [...history].reverse().find((h) => h.param === param)?.value;
  const point = (param: string, value: number) => {
    if (last(param) !== value) history.push({ tick, param, value });
  };
  point("opening_markup", est.opening_markup.mean);
  point("beta", est.beta.mean);
  point("max_rounds", est.max_rounds.mean);
  point("walk_after_rounds", est.walk_after_rounds.mean);
  for (const [b, e] of Object.entries(bands)) point(`limit:${b}`, e.limit.mean);

  const predictions = new Map<string, Prediction>();
  for (const o of mine) predictions.set(o.id, predict(o, est, convLimit.get(o.id), near, prior, markupOf(o)));
  return { estimates: { ...est, history: history.slice(-500) }, predictions };
}

/** Welcome limit: its opening in welcome conversations; with none, the prior (n = 0). */
function welcomeEstimate(welcomes: readonly ConvObs[], prior: PersonaPrior): { welcome?: NonNullable<PersonaEstimates["welcome"]> } {
  if (welcomes.length) {
    const lim = welcomes.map((o) => o.her[0]!);
    const frac = welcomes.map((o) => o.her[0]! / o.book);
    return { welcome: { limit: r2(range(lim, 0)), frac_of_book: r2(range(frac, 0)), n: welcomes.length, side: welcomes[0]!.dealerSells ? "sells" : "buys" } };
  }
  return prior.welcomeFracOfBook !== undefined ? { welcome: { limit: { mean: 0, lo: 0, hi: 0 }, frac_of_book: r2({ mean: prior.welcomeFracOfBook, lo: prior.welcomeFracOfBook, hi: prior.welcomeFracOfBook }), n: 0, ...(prior.welcomeSide ? { side: prior.welcomeSide } : {}) } } : {};
}

/** Prediction for a conversation: its next price, its limit and its path up to `max_rounds`. */
function predict(o: ConvObs, est: Omit<PersonaEstimates, "history">, own: Range | undefined, near: readonly Fit[], prior: PersonaPrior, markup: number): Prediction {
  const open = o.her[0]!;
  const band = est.bands[o.band];
  const hasOwn = !!own && (o.final || o.her.length > 1);
  // Without own data: its band's limit (mean and range); if none, the opening (buying: ceiling = opening ÷ (1 − markup)) or the prior.
  const fallback = o.dealerSells ? Math.min(open, o.book * prior.floorFrac) : Math.max(open, open / Math.max(0.05, 1 - markup));
  const raw: Range = hasOwn ? own! : band ? band.limit : { mean: fallback, lo: fallback, hi: fallback };
  // Its limit is never worse for her than its current price: when buying, ≥ what it already gives; when selling, ≤ what it already asks.
  const cur = o.dealerSells ? Math.min(...o.her) : Math.max(...o.her);
  const clamp = (x: number) => (o.dealerSells ? Math.min(x, cur) : Math.max(x, cur));
  const herLimit: Range = { mean: clamp(raw.mean), lo: clamp(raw.lo), hi: clamp(raw.hi) };
  const fitsHere = near.length ? near : [{ beta: est.beta.mean, maxRounds: est.max_rounds.mean, cost: 0, limits: new Map<string, number>() }];
  const L = (f: Fit) => clamp(hasOwn ? f.limits.get(o.id) ?? herLimit.mean : herLimit.mean);
  const mr = Math.round(est.max_rounds.mean);
  const curve = Array.from({ length: mr + 1 }, (_, r) => {
    const ps = fitsHere.map((f) => says(open, L(f), r, f.beta, f.maxRounds, o.dealerSells));
    return { round: r, price: says(open, herLimit.mean, r, est.beta.mean, mr, o.dealerSells), lo: Math.min(...ps), hi: Math.max(...ps) };
  });
  let herNext: number | undefined = o.final ? undefined : says(open, herLimit.mean, o.her.length, est.beta.mean, mr, o.dealerSells);
  if (herNext !== undefined && est.mirror === true && o.ours.length >= 2) {
    const cap = Math.max(Math.abs(o.ours.at(-1)! - o.ours.at(-2)!), 0.02 * o.book);
    const cur = o.her.at(-1)!;
    herNext = o.dealerSells ? Math.max(herNext, Math.ceil(cur - cap)) : Math.min(herNext, Math.floor(cur + cap));
  }
  return { ...(herNext !== undefined ? { herNext } : {}), herLimit: r2(herLimit), curve, walkRound: est.walk_after_rounds, mirror: est.mirror, fittedFrom: o.her.length };
}

/**
 * Cap on our offers: never beyond its expected limit plus a margin (2 % of the book, min 1 P). When buying
 * (she sells), don't offer above lim.hi + margin; when selling (she buys), don't ask below lim.lo − margin.
 */
export function offerCap(p: Prediction, dealerSells: boolean, book: number): number {
  const margin = Math.max(1, Math.round(0.02 * book));
  return dealerSells ? Math.ceil(p.herLimit.hi) + margin : Math.max(1, Math.floor(p.herLimit.lo) - margin);
}

// ---------------------------------------------------------------- from the GameState

/** What the fit reads from a GameState conversation (structure only). */
export interface ConversationLike {
  id: string;
  kind: string;
  counterparty: string;
  side: "buy" | "sell";
  asset: { rarity?: string };
  history: { herPrices: readonly number[]; ourPrices: readonly number[]; herCurrent?: { final: boolean } };
  result?: { outcome?: string };
}

/** Observation of a conversation with a dealer; `undefined` without a known rarity (no book) or without its prices. */
export function observationOf(c: ConversationLike, tick: number): ConvObs | undefined {
  const book = RARITY_BOOK[c.asset.rarity ?? ""];
  if (c.kind !== "dealer" || book === undefined || !c.history.herPrices.length) return undefined;
  const dealerSells = c.side === "buy";
  return {
    id: c.id,
    persona: c.counterparty,
    band: `${dealerSells ? "sells" : "buys"}:${c.asset.rarity}`,
    dealerSells,
    book,
    her: [...c.history.herPrices],
    ours: [...c.history.ourPrices],
    final: !!c.history.herCurrent?.final,
    ...(c.result?.outcome === "walked" ? { walked: true } : {}),
    tick,
  };
}

const threadNo = (id: string) => Number(id.split(":")[1]) || Infinity;

/**
 * Adds the tick's conversations to the posterior (a final seen earlier is kept even if the offer is no longer open)
 * and refits each persona with observations. Returns the new posterior and the prediction per conversation.
 */
export function updatePosterior(prev: Posterior, conversations: readonly ConversationLike[], tick: number): { posterior: Posterior; predictions: Map<string, Prediction> } {
  const observations = { ...prev.observations };
  for (const c of conversations) {
    const o = observationOf(c, tick);
    if (!o) continue;
    const old = observations[o.id];
    const keepFinal = !!old?.final && old.her.at(-1) === o.her.at(-1);
    const { welcome: _w, ...rest } = o;
    observations[o.id] = { ...rest, final: o.final || keepFinal, tick: old?.tick ?? tick };
  }
  // Welcome: the team's first conversation with the persona (lowest id), only if its prior has a welcome or its price
  // stayed flat from the opening to the end (≥ 3 rounds without moving). Recomputed every tick.
  const firstOf = new Map<string, ConvObs>();
  for (const o of Object.values(observations)) {
    const cur = firstOf.get(o.persona);
    if (!cur || threadNo(o.id) < threadNo(cur.id)) firstOf.set(o.persona, o);
  }
  for (const o of Object.values(observations)) delete o.welcome;
  for (const [persona, first] of firstOf) {
    const flat = first.her.length >= 4 && first.her.every((x) => x === first.her[0]);
    if (PERSONA_PRIORS[persona]?.welcomeFracOfBook !== undefined || flat) observations[first.id] = { ...first, welcome: true };
  }
  const estimates = { ...prev.estimates };
  const predictions = new Map<string, Prediction>();
  const all = Object.values(observations);
  for (const persona of new Set(all.map((o) => o.persona))) {
    const fit = fitPersona(persona, all, tick, prev.estimates[persona]);
    estimates[persona] = fit.estimates;
    for (const [id, p] of fit.predictions) predictions.set(id, p);
  }
  return { posterior: { observations, estimates }, predictions };
}

// ---------------------------------------------------------------- persisted posterior

const SCHEMA = "bazaar-persona-posterior/v1";

export interface Posterior {
  /** Observed conversations by id (so a new conversation starts from what was already learned, also across days). */
  observations: Record<string, ConvObs>;
  estimates: Record<string, PersonaEstimates>;
}

export function defaultPosteriorFile(root: string): string {
  return join(root, "results", "bazaar-live", "persona-posterior.json");
}

/** Saved posterior; empty if it doesn't exist or is invalid (never throws). */
export function loadPosterior(file: string): Posterior {
  try {
    if (!existsSync(file)) return { observations: {}, estimates: {} };
    const d = JSON.parse(readFileSync(file, "utf8")) as { schema?: string } & Partial<Posterior>;
    if (d.schema !== SCHEMA) return { observations: {}, estimates: {} };
    return { observations: d.observations ?? {}, estimates: d.estimates ?? {} };
  } catch {
    return { observations: {}, estimates: {} };
  }
}

export function savePosterior(file: string, p: Posterior): void {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify({ schema: SCHEMA, updated: new Date().toISOString(), ...p }, null, 2)}\n`);
  renameSync(tmp, file);
}
