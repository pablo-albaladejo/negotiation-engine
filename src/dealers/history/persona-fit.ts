import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { mirrorVerdict, stepResponses, type MirrorVerdict } from "../negotiation/negotiator.js";

/**
 * Ajuste de la curva del dealer a nivel de PERSONA (personas.md § 3.2–3.3). Todas las personas usan la misma fórmula:
 *
 *   target(r) = open + (limit − open) · min(1, r / max_rounds)^(1/β)        r = contraofertas del dealer hasta ahora
 *   dice(r)   = vende ? max(ceil(target), ceil(limit)) : min(floor(target), floor(limit))
 *   tras walk_after_rounds ± jitter: final = su límite de ESA conversación (± limit_jitter, 5 escalones secretos)
 *
 * `opening_markup`, β, `max_rounds`, `accept_margin`, `walk_after_rounds` y el espejo son de la estrategia de la persona
 * (compartidos por todas sus conversaciones y bandas); solo el límite es por banda y conversación. Se parte de priors
 * (valores por defecto del editor y lo medido en Abuela y El Chato) y se actualiza con cada precio observado,
 * teniendo en cuenta el redondeo (ceil al vender, floor al comprar). Puro salvo `loadPosterior` / `savePosterior`.
 * Solo estructura (precios), nunca texto. Privado: nunca sale en un mensaje.
 */

/** Book por rareza (site-map § 8.2). */
export const RARITY_BOOK: Readonly<Record<string, number>> = { common: 10, uncommon: 25, rare: 70, epic: 180, legendary: 450 };

/** Una conversación observada con una persona (solo estructura). */
export interface ConvObs {
  id: string;
  persona: string;
  /** Banda: `sells:<rareza o item>` (el dealer vende) o `buys:<rareza>` (el dealer compra). */
  band: string;
  dealerSells: boolean;
  book: number;
  /** Sus precios por ronda (0 = apertura). */
  her: number[];
  ours: number[];
  /** Su último precio es su oferta final (= su límite de esta conversación). */
  final: boolean;
  /** Se retiró (walked / no_progress) tras `ours.length` contraofertas nuestras. */
  walked?: boolean;
  tick?: number;
  /**
   * Primera conversación del equipo con ese dealer (*welcome_first_deal*): su apertura ES su límite y se mantiene plana,
   * así que mide el límite de bienvenida pero NO entra en el ajuste de la curva (β, max_rounds, markup, espejo ni bandas).
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
  /** Conversaciones con al menos una contraoferta suya o su final. */
  samples: number;
  /** Menos de 3 muestras: el límite aún puede estar en otro escalón del jitter (abrir más conversaciones, baja prioridad). */
  fewSamples: boolean;
  /** La muestra más favorable para nosotros (el suelo más bajo cuando vende; el techo más alto cuando compra). */
  best: number;
}

export interface PersonaEstimates {
  opening_markup: Range;
  beta: Range;
  max_rounds: Range;
  /** Sin dato que lo identifique: prior (fracción del book). */
  accept_margin: number;
  walk_after_rounds: Range;
  mirror: boolean | "unknown";
  /** Markup de apertura cuando ELLA COMPRA, si difiere del de vender (Chato: ~0,14 frente a 0,25); si no, vale `opening_markup`. */
  opening_markup_buy?: Range;
  /** Dispersión del límite entre conversaciones (fracción del book); prior, no se reajusta. */
  limit_jitter?: number;
  /** Límite de bienvenida medido en la primera conversación (su apertura, en P y como fracción del book); `n` = 0 es el prior. */
  welcome?: { limit: Range; frac_of_book: Range; n: number; side?: "buys" | "sells" };
  /** Prior de `patience_jitter` (rondas); no se reajusta. */
  patience_jitter?: number;
  /** `welcome_first_deal`: prior offline (true/false) o medido (true) si hay una conversación de bienvenida. */
  welcome_first_deal?: boolean;
  bands: Record<string, BandEstimate>;
  /** Conversaciones usadas en el ajuste. */
  fittedFrom: number;
  /** Cómo converge cada estimación: un punto cada vez que cambia su media. */
  history: { tick: number; param: string; value: number }[];
}

export interface Prediction {
  herNext?: number;
  herLimit: Range;
  /** Su camino previsto hasta `max_rounds`. */
  curve: { round: number; price: number; lo: number; hi: number }[];
  walkRound: Range;
  mirror: boolean | "unknown";
  /** Precios suyos de esta conversación usados (apertura incluida). */
  fittedFrom: number;
}

export interface PriorBand {
  /** Fracciones del book (el barrio, de su lista). */
  mean: number;
  lo: number;
  hi: number;
  /** Conversaciones del ajuste offline que lo respaldan. */
  n: number;
}

export interface PersonaPrior {
  openingMarkup: number;
  /** Markup cuando ella compra, si difiere del de vender. */
  openingMarkupBuy?: number;
  /** Espejo medido offline (`mirror_concessions`); manda sobre "unknown" y sobre datos poco decisivos. */
  mirror?: boolean;
  /** false: el espejo no es identificable (Abuela: su curva ya explica los pasos); el veredicto de los datos no cuenta y sale "unknown". */
  mirrorIdentifiable?: boolean;
  /** Seudo-observaciones del ajuste offline (0 = prior débil de siempre). Cuánto pesa frente a los datos nuevos. */
  priorWeight: number;
  limitJitter?: number;
  /** `welcome_first_deal`: su apertura de bienvenida como fracción del book (Abuela compra una común a 13 = 1,3 × book; `welcome_price_frac` ≈ 0,7). */
  welcomeFracOfBook?: number;
  /** Lado de la bienvenida: `buys` = ella compra a su techo de bienvenida (Abuela), `sells` = ella vende a su suelo. */
  welcomeSide?: "buys" | "sells";
  /** `welcome_first_deal` medido offline (Chato: probablemente no). Si falta y hay `welcomeFracOfBook`, vale true. */
  welcomeFirstDeal?: boolean;
  /** `patience_jitter` medido offline (rondas); cota baja en Abuela. */
  patienceJitter?: number;
  /** Límite medido offline por banda (`sells:<rareza>` / `buys:<rareza>`). */
  bands?: Record<string, PriorBand>;
  beta: number;
  maxRounds: number;
  walkAfterRounds: number;
  acceptMargin: number;
  floorFrac: number;
  ceilingFrac: number;
  listFrac: number;
}

/** Valores por defecto del editor (floor 0,85, ceiling 0,75, list 1) y markups medidos (site-map § 8.4). */
export const DEFAULT_PRIOR: PersonaPrior = { openingMarkup: 0.15, priorWeight: 0, beta: 1, maxRounds: 8, walkAfterRounds: 8, acceptMargin: 0.02, floorFrac: 0.85, ceilingFrac: 0.75, listFrac: 1 };
/**
 * Priors medidos offline (3 oct, con nuestros hilos y el feed público: Abuela 29 conversaciones, Chato 13; ver
 * docs/bazaar/dealer-fit-2026-10-03.md). El ajuste en vivo parte de aquí y se actualiza con cada dato nuevo.
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
      // El sobre de barrio no tiene rareza (no entra en `bands`): 0,75 de su lista [0,70, 0,81], n = 2.
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
      // Sobre de plata (sin rareza, no entra en `bands`): 1,13 de su lista [1,10, 1,16], n = 1. Nunca vende por debajo de la lista.
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

/** Espejo de la persona: mayoría de `mirrorVerdict` entre sus conversaciones con pasos grandes contestados. */
export function personaMirror(obs: readonly ConvObs[], priorMirror?: boolean): boolean | "unknown" {
  const v = obs.map((o): MirrorVerdict => mirrorVerdict(stepResponses({ side: o.dealerSells ? "buy" : "sell", ourPrices: o.ours, herPrices: o.her, herCurrent: { offerId: 0, price: o.her.at(-1) ?? 0, final: o.final } })));
  const yes = v.filter((x) => x === "mirror").length;
  const no = v.filter((x) => x === "not-mirror").length;
  // Con un prior medido offline, los datos propios solo lo cambian si son decisivos (diferencia ≥ 3 conversaciones).
  if (priorMirror !== undefined && Math.abs(yes - no) < 3) return priorMirror;
  return yes === no ? "unknown" : yes > no;
}

/** Markup de apertura: cuando vende, apertura ÷ (book × list_frac) − 1; cuando compra y se vio su final, 1 − apertura ÷ final. */
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

/** Estimación que parte del prior con `w` seudo-observaciones y se mueve con las muestras nuevas (w = 0: solo las muestras). */
function blendRange(samples: readonly number[], priorMean: number, w: number): Range {
  if (!samples.length) return { mean: priorMean, lo: priorMean, hi: priorMean };
  const m = w > 0 ? (w * priorMean + samples.reduce((a, b) => a + b, 0)) / (w + samples.length) : mean(samples);
  return { mean: m, lo: Math.min(...samples, ...(w > 0 ? [priorMean] : [])), hi: Math.max(...samples, ...(w > 0 ? [priorMean] : [])) };
}

/** Puntos (r, precio) de una conversación que informan de la curva: sin los pasos que el espejo recortó. */
function fitPoints(o: ConvObs, mirror: boolean | "unknown"): { r: number; price: number }[] {
  const pts: { r: number; price: number }[] = [];
  for (let r = 1; r < o.her.length; r++) {
    if (o.final && r === o.her.length - 1) continue; // la final es el límite, no un punto de la curva
    const step = Math.abs(o.her[r]! - o.her[r - 1]!);
    const ourStep = r - 1 < o.ours.length && r >= 2 ? Math.abs((o.ours[r - 1] ?? 0) - (o.ours[r - 2] ?? 0)) : Infinity;
    if (mirror === true && step > 0 && step <= Math.max(ourStep, 0.02 * o.book) + 1e-9) continue; // recortado por el espejo
    pts.push({ r, price: o.her[r]! });
  }
  return pts;
}

/** Candidatos de límite de una conversación (su final lo fija; si no, el rango que permiten sus precios). */
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
      // Prior débil: β cerca del prior (en log) y max_rounds cerca del prior.
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

/** Ajustes casi tan buenos como el mejor: dan los rangos (lo/hi). */
const nearBest = (fits: readonly Fit[]) => fits.filter((f) => f.cost <= fits[0]!.cost + Math.max(1, 0.1 * fits[0]!.cost));

export interface PersonaFit {
  estimates: PersonaEstimates;
  predictions: Map<string, Prediction>;
}

/**
 * Ajusta una persona con todas sus conversaciones observadas y predice cada una. `previous` aporta la historia (cómo
 * converge cada estimación) y se le añade un punto por parámetro cuya media cambió.
 */
export function fitPersona(persona: string, obs: readonly ConvObs[], tick: number, previous?: PersonaEstimates): PersonaFit {
  const prior: PersonaPrior = { ...DEFAULT_PRIOR, ...PERSONA_PRIORS[persona] };
  const all = obs.filter((o) => o.persona === persona && o.her.length > 0);
  // Las conversaciones de bienvenida miden el límite de bienvenida, no la curva: fuera del ajuste.
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

  // Límite por conversación (mejor ajuste y rango entre los casi mejores) y por banda.
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

/** Límite de bienvenida: su apertura en las conversaciones de bienvenida; sin ninguna, el prior (n = 0). */
function welcomeEstimate(welcomes: readonly ConvObs[], prior: PersonaPrior): { welcome?: NonNullable<PersonaEstimates["welcome"]> } {
  if (welcomes.length) {
    const lim = welcomes.map((o) => o.her[0]!);
    const frac = welcomes.map((o) => o.her[0]! / o.book);
    return { welcome: { limit: r2(range(lim, 0)), frac_of_book: r2(range(frac, 0)), n: welcomes.length, side: welcomes[0]!.dealerSells ? "sells" : "buys" } };
  }
  return prior.welcomeFracOfBook !== undefined ? { welcome: { limit: { mean: 0, lo: 0, hi: 0 }, frac_of_book: r2({ mean: prior.welcomeFracOfBook, lo: prior.welcomeFracOfBook, hi: prior.welcomeFracOfBook }), n: 0, ...(prior.welcomeSide ? { side: prior.welcomeSide } : {}) } } : {};
}

/** Predicción de una conversación: su próximo precio, su límite y su camino hasta `max_rounds`. */
function predict(o: ConvObs, est: Omit<PersonaEstimates, "history">, own: Range | undefined, near: readonly Fit[], prior: PersonaPrior, markup: number): Prediction {
  const open = o.her[0]!;
  const band = est.bands[o.band];
  const hasOwn = !!own && (o.final || o.her.length > 1);
  // Sin datos propios: el límite de su banda (media y rango); si no hay, la apertura (comprando: techo = apertura ÷ (1 − markup)) o el prior.
  const fallback = o.dealerSells ? Math.min(open, o.book * prior.floorFrac) : Math.max(open, open / Math.max(0.05, 1 - markup));
  const raw: Range = hasOwn ? own! : band ? band.limit : { mean: fallback, lo: fallback, hi: fallback };
  // Su límite nunca está peor para ella que su precio actual: comprando, ≥ lo que ya da; vendiendo, ≤ lo que ya pide.
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
 * Tope de nuestras ofertas: nunca más allá de su límite previsto más un margen (2 % del book, mínimo 1 P). Comprando
 * (vende ella), no ofrecer por encima de lim.hi + margen; vendiendo (compra ella), no pedir por debajo de lim.lo − margen.
 */
export function offerCap(p: Prediction, dealerSells: boolean, book: number): number {
  const margin = Math.max(1, Math.round(0.02 * book));
  return dealerSells ? Math.ceil(p.herLimit.hi) + margin : Math.max(1, Math.floor(p.herLimit.lo) - margin);
}

// ---------------------------------------------------------------- desde el GameState

/** Lo que el ajuste lee de una conversación del GameState (solo estructura). */
export interface ConversationLike {
  id: string;
  kind: string;
  counterparty: string;
  side: "buy" | "sell";
  asset: { rarity?: string };
  history: { herPrices: readonly number[]; ourPrices: readonly number[]; herCurrent?: { final: boolean } };
  result?: { outcome?: string };
}

/** Observación de una conversación con un dealer; `undefined` sin rareza conocida (sin book) o sin precios suyos. */
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
 * Suma las conversaciones del tick al posterior (una final vista antes se conserva aunque la oferta ya no esté abierta)
 * y reajusta cada persona con observaciones. Devuelve el posterior nuevo y la predicción por conversación.
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
  // Bienvenida: la primera conversación del equipo con la persona (menor id), solo si su prior tiene bienvenida o su precio
  // se mantuvo plano desde la apertura hasta el final (≥ 3 rondas sin moverse). Se recalcula en cada tick.
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

// ---------------------------------------------------------------- posterior persistido

const SCHEMA = "bazaar-persona-posterior/v1";

export interface Posterior {
  /** Conversaciones observadas por id (para que una conversación nueva parta de lo ya aprendido, también entre días). */
  observations: Record<string, ConvObs>;
  estimates: Record<string, PersonaEstimates>;
}

export function defaultPosteriorFile(root: string): string {
  return join(root, "results", "bazaar-live", "persona-posterior.json");
}

/** Posterior guardado; vacío si no existe o no es válido (nunca lanza). */
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
