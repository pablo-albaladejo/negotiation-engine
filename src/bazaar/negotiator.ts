import { enforceGuardrails, type Mandate } from "../engine/guardrails.js";
import { concession } from "../engine/offer.js";

/**
 * Negociador con un dealer (un hilo, una cifra): decide aceptar, contraofertar, esperar o cerrar.
 * Reutiliza el motor: curva Boulware (`concession`), monotonía y mandato (`enforceGuardrails`),
 * y AC_next (aceptar si su oferta es al menos tan buena como nuestra siguiente contraoferta).
 * Puro y determinista: sin red, sin reloj, sin texto del dealer.
 */

export type Side = "buy" | "sell";

export interface NegotiatorParams {
  /** Compra: apertura = fracción de min(reserva, su primer precio). */
  buyAnchorFrac: number;
  /** Venta: apertura = múltiplo de max(reserva, su primera puja). */
  sellAnchorMult: number;
  /** β de la curva Boulware (< 1 concede despacio al principio). */
  beta: number;
  /** Número de contraofertas en que la curva llega a la reserva efectiva. */
  horizon: number;
  /** Paso máximo por contraoferta como fracción del tramo apertura-reserva. */
  maxStepFrac: number;
  /** Reciprocidad: fracción de su último movimiento que devolvemos. */
  reciprocity: number;
  /** Tics que aguantamos sin movernos (mensaje educado, mismo precio) antes de cerrar si estamos atascados. */
  maxHolds: number;
}

export const DEFAULT_NEGOTIATOR_PARAMS: NegotiatorParams = {
  buyAnchorFrac: 0.45,
  sellAnchorMult: 2.0,
  beta: 0.5,
  horizon: 12,
  maxStepFrac: 0.08,
  reciprocity: 0.6,
  maxHolds: 3,
};

export interface HerOffer {
  offerId: number;
  price: number;
  final: boolean;
}

export interface ThreadView {
  side: Side;
  /** Reserva privada: compra = máximo a pagar; venta = mínimo a cobrar. Nunca sale en un mensaje. */
  reservation: number;
  /** Su primer precio en el hilo (cerrar a ese precio no cuenta en la escalera). */
  herOpening?: number;
  /** Sus precios en orden (incluido el actual). */
  herPrices: readonly number[];
  /** Su oferta vigente (abierta), si hay. */
  herCurrent?: HerOffer;
  /** Nuestros precios enviados en orden. */
  ourPrices: readonly number[];
  /** Aún no hemos escrito en este hilo en este tick. */
  canMessage: boolean;
  /** El equipo aún no ha aceptado nada en este tick. */
  canAccept: boolean;
  /** Mensajes de espera ya gastados en este hilo (mismo precio, sin nueva oferta) esperando su final. */
  holdsUsed?: number;
}

export type Rule =
  | "anchor"
  | "boulware"
  | "reciprocity"
  | "ac-next"
  | "final-above-reservation"
  | "final-below-reservation"
  | "stuck-at-reservation"
  | "hold"
  | "holds-exhausted"
  | "no-zone"
  | "one-message-per-tick"
  | "one-accept-per-tick";

export type Action =
  | { kind: "accept"; offerId: number; price: number }
  | { kind: "counter"; price: number }
  | { kind: "hold"; price: number }
  | { kind: "close" }
  | { kind: "wait" };

export interface Decision {
  action: Action;
  rule: Rule;
  /** Reserva efectiva: la privada, recortada para no cerrar a su precio de apertura. */
  effectiveReservation: number;
  /** Contraoferta que enviaríamos (para AC_next y trazas). */
  ourNext?: number;
}

const better = (side: Side, a: number, b: number) => (side === "buy" ? a < b : a > b);
const atLeastAsGood = (side: Side, a: number, b: number) => (side === "buy" ? a <= b : a >= b);

export function effectiveReservation(view: Pick<ThreadView, "side" | "reservation" | "herOpening">): number {
  const { side, reservation, herOpening } = view;
  if (side === "buy") return Math.floor(herOpening === undefined ? reservation : Math.min(reservation, herOpening - 1));
  return Math.ceil(herOpening === undefined ? reservation : Math.max(reservation, herOpening + 1));
}

export function anchorPrice(view: Pick<ThreadView, "side" | "reservation" | "herOpening">, p: NegotiatorParams, effRes: number): number {
  if (view.side === "buy") {
    const ref = Math.min(view.reservation, view.herOpening ?? view.reservation);
    return Math.max(1, Math.min(effRes, Math.round(ref * p.buyAnchorFrac)));
  }
  const ref = Math.max(view.reservation, view.herOpening ?? view.reservation);
  return Math.max(effRes, Math.round(ref * p.sellAnchorMult));
}

/** Lo que concedió en su último movimiento, en nuestra dirección (0 si no se movió o retrocedió). */
export function herLastConcession(side: Side, herPrices: readonly number[]): number {
  if (herPrices.length < 2) return 0;
  const cur = herPrices[herPrices.length - 1]!;
  const prev = herPrices[herPrices.length - 2]!;
  return Math.max(0, side === "buy" ? prev - cur : cur - prev);
}

/** Siguiente contraoferta: Boulware hacia la reserva efectiva, pasos pequeños, recíprocos y estrictamente monótonos. */
export function nextPrice(view: ThreadView, p: NegotiatorParams = DEFAULT_NEGOTIATOR_PARAMS): { price: number; rule: Rule } | undefined {
  const effRes = effectiveReservation(view);
  const anchor = anchorPrice(view, p, effRes);
  const mandate: Mandate = { role: view.side === "buy" ? "buyer" : "seller", reservation: effRes };
  const prev = view.ourPrices[view.ourPrices.length - 1];
  if (prev === undefined) return { price: enforceGuardrails(mandate, anchor), rule: "anchor" };

  const dir = view.side === "buy" ? 1 : -1;
  const span = Math.abs(effRes - anchor);
  const maxStep = Math.max(1, Math.round(span * p.maxStepFrac));
  const t = view.ourPrices.length / p.horizon;
  const target = Math.round(anchor + (effRes - anchor) * concession(t, p.beta));
  const herMove = herLastConcession(view.side, view.herPrices);
  const step = herMove > 0 ? Math.min(maxStep, Math.max(1, Math.round(herMove * p.reciprocity))) : 1;
  const byStep = prev + dir * step;
  const byCurve = dir > 0 ? Math.min(target, prev + maxStep) : Math.max(target, prev - maxStep);
  const proposed = dir > 0 ? Math.max(byStep, byCurve) : Math.min(byStep, byCurve);
  const price = enforceGuardrails(mandate, proposed, prev);
  if (price === prev) return undefined;
  return { price, rule: herMove > 0 && Math.abs(byStep - prev) >= Math.abs(byCurve - prev) ? "reciprocity" : "boulware" };
}

export function decide(view: ThreadView, p: NegotiatorParams = DEFAULT_NEGOTIATOR_PARAMS): Decision {
  const effRes = effectiveReservation(view);
  if (effRes < 1) return { action: { kind: "close" }, rule: "no-zone", effectiveReservation: effRes };
  const next = nextPrice(view, p);
  const her = view.herCurrent;

  if (her) {
    const isOpening = view.herOpening !== undefined && her.price === view.herOpening;
    const withinRes = !isOpening && atLeastAsGood(view.side, her.price, effRes);
    // AC_next: su oferta es al menos tan buena como la que le mandaríamos; o ya no podemos movernos.
    const acNext = withinRes && (next === undefined || atLeastAsGood(view.side, her.price, next.price));
    const take = acNext || (her.final && withinRes);
    if (take) {
      const rule: Rule = acNext ? "ac-next" : "final-above-reservation";
      if (!view.canAccept) return { action: { kind: "wait" }, rule: "one-accept-per-tick", effectiveReservation: effRes };
      return { action: { kind: "accept", offerId: her.offerId, price: her.price }, rule, effectiveReservation: effRes, ...(next ? { ourNext: next.price } : {}) };
    }
    if (her.final) return { action: { kind: "close" }, rule: "final-below-reservation", effectiveReservation: effRes };
  }

  // Atascados: nuestra siguiente contraoferta cruzaría la reserva efectiva (no mejora su oferta, o no hay
  // margen para moverse). En vez de cerrar de golpe, aguantamos el precio unos tics (sin oferta final suya)
  // para que ella diga su última palabra; solo cerramos si ya se agotaron los aguantes.
  const stuck = next === undefined || (her !== undefined && !better(view.side, next.price, her.price));
  if (stuck) {
    const prevPrice = view.ourPrices[view.ourPrices.length - 1];
    const holdsUsed = view.holdsUsed ?? 0;
    if (her && !her.final && prevPrice !== undefined && holdsUsed < p.maxHolds) {
      if (!view.canMessage) return { action: { kind: "wait" }, rule: "one-message-per-tick", effectiveReservation: effRes };
      return { action: { kind: "hold", price: prevPrice }, rule: "hold", effectiveReservation: effRes };
    }
    return { action: { kind: "close" }, rule: holdsUsed > 0 ? "holds-exhausted" : "stuck-at-reservation", effectiveReservation: effRes };
  }
  if (!view.canMessage) return { action: { kind: "wait" }, rule: "one-message-per-tick", effectiveReservation: effRes, ourNext: next.price };
  return { action: { kind: "counter", price: next.price }, rule: next.rule, effectiveReservation: effRes, ourNext: next.price };
}
