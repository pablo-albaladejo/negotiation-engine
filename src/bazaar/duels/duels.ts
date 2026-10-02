import type { Issue } from "../../engine/config.js";
import { decideAcceptance, type AcceptanceRule, type TimeInfo } from "../../engine/acceptance.js";
import { enforceGuardrails, type Role } from "../../engine/guardrails.js";
import { utility } from "../../engine/issues.js";
import { concession } from "../../engine/offer.js";
import type { Duel, StructuredOffer } from "./schemas.js";
import { numbersIn } from "../dealers/messages.js";

/**
 * Decisión pura y determinista de un duelo del Bazaar (1 contra 1, un mensaje por lado y tick).
 * El pastel se encoge con cada ronda de charla, así que se concede deprisa (β > 1, curva conceder del
 * motor) hacia un suelo que conserva parte del excedente de apertura y se cierra en ~`maxRounds`.
 * Todo se mide en excedente propio en P: vendedor precio − límite, comprador límite − precio, más el
 * valor de los días de entrega (`daysValue`) cuando el duelo negocia `days`. La aceptación es la del
 * motor (`decideAcceptance`, AC_next y último movimiento) sobre un issue sintético `surplus`; el
 * precio nunca cruza `your_limit` (`enforceGuardrails`). Solo se lee la oferta estructurada del rival.
 */

export const DAYS_MIN = 0;
export const DAYS_MAX = 10;

export interface DuelParams {
  /** Apertura: el vendedor pide límite × (1 + a); el comprador ofrece límite ÷ (1 + a). */
  anchorMargin: number;
  /** β de la curva `concession` del motor (> 1 concede pronto). */
  beta: number;
  /** Rondas (mensajes nuestros) hasta llegar al suelo. */
  maxRounds: number;
  /** Suelo: fracción del excedente de apertura que no se concede antes del final. */
  floorShare: number;
  /** Excedente mínimo de cualquier trato (P); por debajo, mejor no cerrar. */
  minSurplus: number;
  /** Tics restantes en los que ya es el último movimiento: aceptar todo lo aceptable. */
  lastMoveTicks: number;
  /** Tics restantes desde los que, si el rival ha ofertado alguna vez, se mueve hacia un trato (parte la diferencia; nunca bajo el suelo). */
  endgameTicks: number;
  /** P por día de entrega si el duelo no trae `your_days_weight` (supuesto; 0 = indiferente). */
  assumedDaysWeight: number;
  /** Multiplicador de `your_days_weight` (por si llega en otra escala que P por día). */
  daysWeightScale: number;
}

export const DEFAULT_DUEL_PARAMS: DuelParams = {
  anchorMargin: 0.5,
  beta: 2,
  maxRounds: 4,
  floorShare: 0.3,
  minSurplus: 1,
  lastMoveTicks: 1,
  endgameTicks: 3,
  assumedDaysWeight: 0,
  daysWeightScale: 1,
};

/** Valor para nosotros (P) de cada día de entrega 0..10. */
export type DaysValue = readonly number[];

/** Tabla de valor por día desde `your_days_weight` (número = P por día; array u objeto = por día). */
export function daysValueFrom(raw: Duel["your_days_weight"], params: DuelParams): { table: DaysValue; assumption?: string } {
  const days = Array.from({ length: DAYS_MAX - DAYS_MIN + 1 }, (_, k) => DAYS_MIN + k);
  const scale = params.daysWeightScale;
  if (typeof raw === "number" && Number.isFinite(raw)) return { table: days.map((d) => raw * scale * d) };
  if (Array.isArray(raw) && raw.length === days.length && raw.every(Number.isFinite)) return { table: raw.map((v) => v * scale) };
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const rec = raw as Record<string, number>;
    if (days.every((d) => Number.isFinite(rec[String(d)]))) return { table: days.map((d) => rec[String(d)]! * scale) };
  }
  return {
    table: days.map((d) => params.assumedDaysWeight * d),
    assumption: `your_days_weight missing or unreadable: assuming ${params.assumedDaysWeight} P per day`,
  };
}

export interface DuelState {
  role: Role;
  /** `your_limit`: coste del vendedor o valor del comprador. Privado: nunca sale en el texto. */
  limit: number;
  withDays: boolean;
  daysValue: DaysValue;
  /** Nuestras ofertas enviadas, en orden. */
  ourOffers: readonly StructuredOffer[];
  /** Ofertas estructuradas distintas del rival, en orden; la última es la vigente. */
  rivalOffers: readonly StructuredOffer[];
  /** El rival ha hecho una oferta nueva desde nuestro último mensaje. */
  rivalMovedSinceOurLast: boolean;
  ticksSinceOurLast?: number;
  ticksLeft?: number;
}

export type DuelAction = "accept" | "counter" | "wait";

export interface DuelDecision {
  action: DuelAction;
  offer?: StructuredOffer;
  text?: string;
  rule: AcceptanceRule | "opening" | "concede" | "endgame" | "waiting-for-rival" | "match-stale";
  /** Excedente objetivo de la oferta (o el de la oferta del rival que se acepta). */
  surplus: number;
  round: number;
}

const sign = (role: Role) => (role === "seller" ? 1 : -1);

function daysAt(table: DaysValue, days: number | undefined): number {
  if (days === undefined) return 0;
  return table[Math.round(days) - DAYS_MIN] ?? Number.NEGATIVE_INFINITY;
}

/** Nuestro excedente (P) de una oferta: lado del precio respecto al límite más el valor de sus días. */
export function surplusOf(state: Pick<DuelState, "role" | "limit" | "withDays" | "daysValue">, offer: StructuredOffer): number {
  const price = sign(state.role) * (offer.price - state.limit);
  return state.withDays ? price + daysAt(state.daysValue, offer.days) : price;
}

/** El precio no cruza el límite (vendedor ≥, comprador ≤) y, con días, son enteros en 0..10. */
export function withinLimit(state: Pick<DuelState, "role" | "limit" | "withDays">, offer: StructuredOffer): boolean {
  if (!Number.isFinite(offer.price) || offer.price < 1) return false;
  if (state.role === "seller" ? offer.price < state.limit : offer.price > state.limit) return false;
  if (!state.withDays) return true;
  return offer.days !== undefined && Number.isInteger(offer.days) && offer.days >= DAYS_MIN && offer.days <= DAYS_MAX;
}

export function openingSurplus(state: Pick<DuelState, "role" | "limit" | "withDays" | "daysValue">, params: DuelParams): number {
  const a = params.anchorMargin;
  const price = state.role === "seller" ? state.limit * a : state.limit - state.limit / (1 + a);
  const days = state.withDays ? Math.max(...state.daysValue) : 0;
  return Math.max(params.minSurplus, price + days);
}

export function floorSurplus(state: Pick<DuelState, "role" | "limit" | "withDays" | "daysValue">, params: DuelParams): number {
  return Math.max(params.minSurplus, params.floorShare * openingSurplus(state, params));
}

/** Excedente objetivo de nuestra oferta número `round` (0 = apertura) por la curva del motor. */
export function targetSurplus(state: Pick<DuelState, "role" | "limit" | "withDays" | "daysValue">, params: DuelParams, round: number): number {
  const open = openingSurplus(state, params);
  const floor = floorSurplus(state, params);
  return open - (open - floor) * concession(round / params.maxRounds, params.beta);
}

/**
 * Lo que estimamos que el rival valora los días: su último día pedido y cuánto (P) le cuesta cada día
 * de distancia a él. Intensidad = nuestra pendiente media × 2 si ha movido el precio sin mover los
 * días (le importan más), × 0,5 si ha movido los días hacia nuestro día preferido; × 1 sin más datos.
 */
export function estimateRivalDaysWeight(state: Pick<DuelState, "daysValue" | "rivalOffers">): { days: number; weight: number } | undefined {
  const withDays = state.rivalOffers.filter((o) => o.days !== undefined);
  const last = withDays.at(-1);
  if (!last) return undefined;
  const ourSlope = Math.abs(state.daysValue.at(-1)! - state.daysValue[0]!) / (DAYS_MAX - DAYS_MIN);
  const base = ourSlope > 0 ? ourSlope : 1;
  const ourBest = DAYS_MIN + state.daysValue.indexOf(Math.max(...state.daysValue));
  let factor = 1;
  if (withDays.length >= 2) {
    const first = withDays[0]!;
    if (last.days === first.days && last.price !== first.price) factor = 2;
    else if (Math.abs(last.days! - ourBest) < Math.abs(first.days! - ourBest)) factor = 0.5;
  }
  return { days: last.days!, weight: base * factor };
}

/**
 * Oferta con nuestro excedente ≈ `target`: con días, el día que maximiza el valor conjunto estimado
 * (el nuestro menos lo que estimamos que pierde el rival al alejarnos de su día; logrolling) y el precio que nos deja en `target`. Empates: el día más
 * cercano al último del rival. El precio se redondea a nuestro favor y nunca cruza el límite.
 */
export function offerForSurplus(state: DuelState, target: number): StructuredOffer {
  const s = sign(state.role);
  const clampPrice = (p: number) => Math.max(1, enforceGuardrails({ role: state.role, reservation: state.limit }, p));
  const roundInFavor = (p: number) => (s > 0 ? Math.ceil(p - 1e-9) : Math.floor(p + 1e-9));
  if (!state.withDays) return { price: clampPrice(roundInFavor(state.limit + s * target)) };

  const rivalEst = estimateRivalDaysWeight(state);
  const rivalDays = rivalEst?.days;
  type Candidate = { offer: StructuredOffer; joint: number; exact: boolean; surplus: number; dist: number };
  const candidates: Candidate[] = state.daysValue.map((value, k) => {
    const days = DAYS_MIN + k;
    const raw = roundInFavor(state.limit + s * (target - value));
    const price = clampPrice(raw);
    const offer = { price, days };
    return {
      offer,
      joint: value - (rivalEst ? rivalEst.weight * Math.abs(days - rivalEst.days) : 0),
      exact: price === raw,
      surplus: surplusOf(state, offer),
      dist: rivalDays === undefined ? 0 : Math.abs(days - rivalDays),
    };
  });
  const exact = candidates.filter((c) => c.exact);
  const pool = exact.length > 0 ? exact : candidates;
  const byJoint = (a: Candidate, b: Candidate) => (Math.abs(b.joint - a.joint) > 1e-9 ? b.joint - a.joint : 0);
  pool.sort((a, b) => (exact.length > 0 ? byJoint(a, b) : a.surplus - b.surplus) || a.dist - b.dist || b.surplus - a.surplus);
  return pool[0]!.offer;
}

const OPEN_PRICE = [
  "Hello, and thank you for meeting me. I would propose {p} P for this one.",
  "Good to meet you! To get us started, I can offer {p} P.",
];
const COUNTER_PRICE = [
  "Thank you for your offer. I can move to {p} P.",
  "I appreciate it. Let us try to close quickly: {p} P.",
  "Fair enough, I will meet you partway at {p} P.",
  "We are getting close. {p} P works for me.",
];
const HOLD_PRICE = ["Thank you. My offer stays at {p} P, and I am happy to close there.", "I think {p} P is fair for both of us. Shall we settle?"];
const OPEN_DAYS = [
  "Hello, and thank you for meeting me. I would propose {p} P with delivery on day {d}.",
  "Good to meet you! To get us started: {p} P, delivery on day {d}.",
];
const COUNTER_DAYS = [
  "Thank you for your offer. I can do {p} P with delivery on day {d}.",
  "I appreciate it. Let us close quickly: {p} P, delivery on day {d}.",
  "Fair enough, I will meet you partway: {p} P with delivery on day {d}.",
  "We are getting close. {p} P and delivery on day {d} works for me.",
];
const HOLD_DAYS = [
  "Thank you. My offer stays at {p} P with delivery on day {d}, and I am happy to close there.",
  "I think {p} P with delivery on day {d} is fair for both of us. Shall we settle?",
];

/** El texto lleva exactamente las cifras de la oferta estructurada: el precio y, con días, los días. */
export function textMatchesOffer(text: string, offer: StructuredOffer): boolean {
  const expected = offer.days === undefined ? [Math.round(offer.price)] : [Math.round(offer.price), Math.round(offer.days)];
  const nums = numbersIn(text);
  return nums.length === expected.length && nums.every((n, k) => n === expected[k]);
}

/** Plantilla amable en inglés con las mismas cifras que la oferta; lanza si no coinciden. */
export function duelText(kind: "open" | "counter" | "hold", round: number, offer: StructuredOffer): string {
  const withDays = offer.days !== undefined;
  const list = {
    open: withDays ? OPEN_DAYS : OPEN_PRICE,
    counter: withDays ? COUNTER_DAYS : COUNTER_PRICE,
    hold: withDays ? HOLD_DAYS : HOLD_PRICE,
  }[kind];
  const tpl = list[Math.max(0, round) % list.length]!;
  const text = tpl.replace("{p}", String(Math.round(offer.price))).replace("{d}", String(Math.round(offer.days ?? 0)));
  if (!textMatchesOffer(text, offer)) throw new Error("duel template states a number different from the offer");
  return text;
}

/** Issue sintético del motor: nuestro excedente en P, cuanto más mejor. */
function surplusIssue(state: DuelState): Issue {
  const span = Math.max(1000, 20 * Math.abs(state.limit) + 20 * Math.max(...state.daysValue.map(Math.abs)));
  return { name: "surplus", min: -span, max: span, direction: "higher-better", weight: 1 };
}

export function decideDuel(state: DuelState, params: DuelParams = DEFAULT_DUEL_PARAMS): DuelDecision {
  const round = state.ourOffers.length;
  const rival = state.rivalOffers.at(-1);
  const rivalHasOffered = state.rivalOffers.length > 0;
  const lastMove = state.ticksLeft !== undefined && state.ticksLeft <= params.lastMoveTicks;
  const endgame = state.ticksLeft !== undefined && state.ticksLeft <= params.endgameTicks;
  const previous = state.ourOffers.at(-1);
  const prevSurplus = previous ? surplusOf(state, previous) : undefined;
  // En el final, solo se mueve hacia un trato si el rival ha ofertado alguna vez; si nunca ha
  // hablado no hay nada que partir y conviene mantener la oferta vigente en vez de ceder solo.
  const endgameWithRival = endgame && rivalHasOffered;

  // Siguiente excedente objetivo: curva del motor, en el final partir la diferencia con el rival.
  let target = targetSurplus(state, params, round);
  let rule: DuelDecision["rule"] = round === 0 ? "opening" : "concede";
  const rivalSurplus = rival && withinLimit(state, rival) ? surplusOf(state, rival) : undefined;
  if (endgameWithRival && round > 0 && rivalSurplus !== undefined && rivalSurplus < target) {
    target = Math.max(floorSurplus(state, params), (target + Math.max(rivalSurplus, params.minSurplus)) / 2);
    rule = "endgame";
  }
  // Guardarraíl del motor sobre el excedente: nunca sube respecto a la oferta anterior ni baja del mínimo.
  target = enforceGuardrails({ role: "seller", reservation: params.minSurplus }, target, prevSurplus);

  // Aceptación del motor (AC_next; en el último movimiento, todo lo que respete la reserva).
  if (rival && rivalSurplus !== undefined) {
    const issue = surplusIssue(state);
    const time: TimeInfo = {
      t: Math.min(1, round / params.maxRounds),
      source: "ring-rounds",
      isLastMove: lastMove,
      defaultHorizonReached: false,
    };
    const verdict = decideAcceptance({
      issues: [issue],
      mandate: { role: "seller", reservation: { surplus: params.minSurplus } },
      rivalCurrent: { surplus: rivalSurplus },
      ourNextUtility: utility([issue], { surplus: target }),
      time,
      acceptMargin: 0,
      acTimeThreshold: 2,
      rivalCanRespond: !lastMove,
    });
    if (verdict.verdict === "accept") return { action: "accept", rule: verdict.rule, surplus: rivalSurplus, round };
  }

  // Nunca se concede sin una oferta nueva del rival desde la nuestra: sin ella, se espera (sin mensaje),
  // salvo en el final si el rival ha ofertado alguna vez (entonces se mueve hacia un trato, arriba).
  if (previous && !state.rivalMovedSinceOurLast && !endgameWithRival) {
    return { action: "wait", rule: "waiting-for-rival", surplus: prevSurplus!, round };
  }

  let offer = offerForSurplus(state, target);
  // Con días, el redondeo de otro día podría pedir más que la oferta anterior: entonces se repite.
  if (previous && prevSurplus !== undefined && surplusOf(state, offer) > prevSurplus) offer = previous;
  const same = previous !== undefined && previous.price === offer.price && previous.days === offer.days;
  const kind = round === 0 ? "open" : same ? "hold" : "counter";
  return { action: "counter", offer, text: duelText(kind, round, offer), rule, surplus: surplusOf(state, offer), round };
}
