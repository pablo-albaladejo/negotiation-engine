import { enforceGuardrails, type Mandate } from "../engine/guardrails.js";
import { concession } from "../engine/offer.js";

/**
 * Negociador con un dealer (un hilo, una cifra): decide aceptar, contraofertar, esperar o cerrar.
 * Por defecto, pasos adaptativos a su paciencia (medida en vivo en intercambios, no en tics): el
 * paso cierra el hueco hasta nuestro límite en los mensajes que le quedan, y vuelve a pasos de 1 si
 * los pasos grandes no le arrancan más que los de 1. El modo `boulware` (anterior) usa la curva del
 * motor (`concession`). Siempre: monotonía y mandato (`enforceGuardrails`) y AC_next.
 * Puro y determinista: sin red, sin reloj, sin texto del dealer.
 */

export type Side = "buy" | "sell";

export type StepMode = "adaptive" | "boulware";

export interface NegotiatorParams {
  /** `adaptive` (por defecto): paso = ⌈hueco ÷ paciencia restante⌉; `boulware`: curva del motor (negociador anterior). */
  stepMode: StepMode;
  /** Paciencia estimada del dealer en mensajes nuestros por hilo (hilos 56 y 125: ~6–7). */
  patienceBudget: number;
  /** Paso máximo por contraoferta en modo adaptativo (P). */
  maxStep: number;
  /** Compra: apertura = fracción de su primer precio (adaptativo) o de min(reserva, su primer precio) (boulware). */
  buyAnchorFrac: number;
  /** Venta con su puja por encima de nuestro mínimo: apertura = múltiplo de su puja (adaptativo: recortada para cerrar el hueco en la paciencia). */
  sellAnchorMult: number;
  /** Venta con su puja por debajo de nuestro mínimo (o sin puja): apertura = ⌈mínimo × esto⌉ (modo adaptativo). */
  sellFloorAnchorMult: number;
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
  /**
   * Precio fijo: si tras este número de concesiones nuestras su precio no se ha movido, se trata como fijo
   * (aceptar si cabe en la reserva y crea valor, aunque sea su apertura; si no, cerrar). 0 lo desactiva.
   */
  fixedAfterConcessions: number;
  /**
   * Venta con su primera puja < esto × nuestro mínimo (o compra con su precio > nuestro máximo ÷ esto): tras una
   * contraoferta, si sigue igual de lejos, se cierra educadamente para no gastar su paciencia ni la cuota de tratos
   * (hilo 125: pujó 5–6 por un mínimo de 10). 0 lo desactiva.
   */
  lowballFrac: number;
}

export const DEFAULT_NEGOTIATOR_PARAMS: NegotiatorParams = {
  stepMode: "adaptive",
  patienceBudget: 6,
  maxStep: 3,
  buyAnchorFrac: 0.75,
  sellAnchorMult: 2.0,
  sellFloorAnchorMult: 1.3,
  beta: 1,
  horizon: 12,
  maxStepFrac: 0.08,
  reciprocity: 0.6,
  maxHolds: 1,
  fixedAfterConcessions: 2,
  lowballFrac: 0.7,
};

/** Negociador anterior a la evidencia de los hilos 56 y 125 (ancla lejana + Boulware), para comparar en el simulador. */
export const LEGACY_NEGOTIATOR_PARAMS: NegotiatorParams = {
  ...DEFAULT_NEGOTIATOR_PARAMS,
  stepMode: "boulware",
  buyAnchorFrac: 0.45,
  sellAnchorMult: 2.0,
  beta: 0.5,
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
  /** Nuestro valor privado de lo que se compra o se vende: un trato solo crea valor si el precio lo mejora. */
  privateValue?: number;
  /**
   * Su precio vigente cuando enviamos cada uno de nuestros precios (misma longitud que `ourPrices`). Con él y
   * `herCurrent` se mide su respuesta a cada paso nuestro; sin él se supone `herPrices[j]` = su precio antes de nuestro mensaje j.
   */
  herAtOurMessages?: readonly number[];
}

export type Rule =
  | "anchor"
  | "boulware"
  | "reciprocity"
  | "adaptive"
  | "adaptive-fallback"
  | "ac-next"
  | "final-above-reservation"
  | "final-below-reservation"
  | "fixed-price"
  | "fixed-price-out-of-range"
  | "opening-last-chance"
  | "lowball-bid"
  | "stuck-at-reservation"
  | "stuck-accept-within-limit"
  | "hold"
  | "holds-exhausted"
  | "no-zone"
  | "one-message-per-tick"
  | "one-accept-per-tick"
  | "structure-mismatch";

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
  if (p.stepMode === "adaptive") {
    if (view.side === "buy") {
      const ref = view.herOpening ?? view.reservation;
      return Math.max(1, Math.min(effRes - 1, Math.round(ref * p.buyAnchorFrac)));
    }
    if (view.herOpening === undefined || view.herOpening < view.reservation) return Math.max(effRes, Math.ceil(view.reservation * p.sellFloorAnchorMult));
    // Su puja ya cubre nuestro mínimo: ancla relativa a ella, pero cerrable en la paciencia con pasos de `maxStep`.
    const closable = effRes + Math.max(1, p.maxStep) * Math.max(0, p.patienceBudget - 1);
    return Math.max(effRes, Math.min(closable, Math.round(view.herOpening * p.sellAnchorMult)));
  }
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

/** Concesiones nuestras: veces que nuestro precio se acercó al suyo respecto al anterior. */
export function ourConcessions(side: Side, ourPrices: readonly number[]): number {
  let n = 0;
  for (let i = 1; i < ourPrices.length; i++) if (better(side, ourPrices[i - 1]!, ourPrices[i]!)) n += 1;
  return n;
}

/**
 * Su precio no se ha movido tras `fixedAfterConcessions` concesiones nuestras (Abuela comprando comunes, hilo 56).
 * Solo cuando el dealer nos compra (vendemos): cuando nos vende, sí concede (hilo 178: 29→25), así que se negocia hasta su final.
 */
export function herPriceIsFixed(view: Pick<ThreadView, "side" | "herPrices" | "ourPrices" | "herCurrent">, p: Pick<NegotiatorParams, "fixedAfterConcessions">): boolean {
  if (view.side !== "sell" || p.fixedAfterConcessions <= 0 || !view.herCurrent || view.herPrices.length === 0) return false;
  const first = view.herPrices[0]!;
  if (view.herCurrent.price !== first || view.herPrices.some((x) => x !== first)) return false;
  return ourConcessions(view.side, view.ourPrices) >= p.fixedAfterConcessions;
}

/** Su precio cabe en nuestra reserva privada (sin el recorte de la apertura) y crea valor a nuestro valor privado. */
export function valuePositive(view: Pick<ThreadView, "side" | "reservation" | "privateValue">, price: number): boolean {
  if (!atLeastAsGood(view.side, price, view.reservation)) return false;
  return view.privateValue === undefined || better(view.side, price, view.privateValue);
}

export interface StepResponse {
  /** Índice de nuestro mensaje (1 = la primera concesión tras el ancla). */
  index: number;
  /** Tamaño de nuestro paso (P, hacia ella). */
  step: number;
  /** Lo que ella se movió hacia nosotros en respuesta (puede ser 0 o negativo). */
  herMove: number;
}

/** Su respuesta a cada paso nuestro ya contestado (el ancla no es un paso). */
export function stepResponses(view: Pick<ThreadView, "side" | "ourPrices" | "herPrices" | "herCurrent" | "herAtOurMessages">): StepResponse[] {
  const { side, ourPrices } = view;
  const aligned = view.herAtOurMessages && view.herAtOurMessages.length === ourPrices.length && view.herCurrent;
  const her = aligned ? [...view.herAtOurMessages!, view.herCurrent!.price] : view.herPrices;
  const out: StepResponse[] = [];
  for (let j = 1; j < ourPrices.length; j++) {
    const before = her[j];
    const after = her[j + 1];
    if (before === undefined || after === undefined) break;
    out.push({ index: j, step: Math.abs(ourPrices[j]! - ourPrices[j - 1]!), herMove: side === "buy" ? before - after : after - before });
  }
  return out;
}

/** Algún paso grande (≥ 2) no le arrancó más que el mejor de nuestros pasos de 1 (0 si aún no hubo ninguno): volver a pasos de 1. */
export function bigStepsDidNotPay(responses: readonly StepResponse[]): boolean {
  const big = responses.filter((r) => r.step >= 2);
  if (!big.length) return false;
  const ones = responses.filter((r) => r.step === 1);
  const baseline = ones.length ? Math.max(...ones.map((r) => r.herMove)) : 0;
  return big.some((r) => r.herMove <= baseline);
}

/** Paso adaptativo: ⌈hueco hasta nuestro límite ÷ mensajes que le quedan de paciencia⌉, entre 1 y `maxStep`. */
export function adaptiveStep(gap: number, sent: number, p: Pick<NegotiatorParams, "patienceBudget" | "maxStep">): number {
  const remaining = Math.max(1, p.patienceBudget - sent);
  return Math.min(Math.max(1, p.maxStep), Math.max(1, Math.ceil(Math.max(0, gap) / remaining)));
}

/** Camino previsto del ancla a nuestro límite en `patienceBudget` mensajes si ella responde (sin vuelta a pasos de 1). */
export function plannedSchedule(view: Pick<ThreadView, "side" | "reservation" | "herOpening">, p: NegotiatorParams = DEFAULT_NEGOTIATOR_PARAMS): number[] {
  const effRes = effectiveReservation(view);
  if (effRes < 1) return [];
  const dir = view.side === "buy" ? 1 : -1;
  const prices = [anchorPrice(view, p, effRes)];
  while (prices.length < Math.max(1, p.patienceBudget)) {
    const prev = prices[prices.length - 1]!;
    const gap = dir * (effRes - prev);
    if (gap <= 0) break;
    prices.push(prev + dir * Math.min(gap, p.stepMode === "adaptive" ? adaptiveStep(gap, prices.length, p) : 1));
  }
  return prices;
}

/**
 * Siguiente contraoferta, estrictamente monótona y sin cruzar la reserva efectiva. Adaptativo: paso según la
 * paciencia que le queda (vuelta a 1 si los pasos grandes no pagan). Boulware: curva del motor y reciprocidad.
 */
export function nextPrice(view: ThreadView, p: NegotiatorParams = DEFAULT_NEGOTIATOR_PARAMS): { price: number; rule: Rule } | undefined {
  const effRes = effectiveReservation(view);
  const anchor = anchorPrice(view, p, effRes);
  const mandate: Mandate = { role: view.side === "buy" ? "buyer" : "seller", reservation: effRes };
  const prev = view.ourPrices[view.ourPrices.length - 1];
  if (prev === undefined) return { price: enforceGuardrails(mandate, anchor), rule: "anchor" };

  if (p.stepMode === "adaptive") {
    const dir = view.side === "buy" ? 1 : -1;
    const wanted = adaptiveStep(dir * (effRes - prev), view.ourPrices.length, p);
    const fallback = wanted > 1 && bigStepsDidNotPay(stepResponses(view));
    const price = enforceGuardrails(mandate, prev + dir * (fallback ? 1 : wanted), prev);
    if (price === prev) return undefined;
    return { price, rule: fallback ? "adaptive-fallback" : "adaptive" };
  }

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

/**
 * Aguantes permitidos: `maxHolds` (1 por defecto). Antes, en adaptativo, se aguantaba hasta su paciencia + maxHolds
 * mensajes esperando su final; en vivo (hilo 184: aguantamos 9 durante 6 tics) no llegó ninguna final y ella se
 * marchó con `no_progress`, así que aguantar el mismo precio no le arranca la final: provoca la retirada.
 */
export function holdsAllowed(_pricedSent: number, p: Pick<NegotiatorParams, "stepMode" | "maxHolds" | "patienceBudget">): number {
  return p.maxHolds;
}

/**
 * Su primer precio y el vigente quedan lejos de nuestro límite tras una contraoferta nuestra: venta, puja < `lowballFrac` ×
 * nuestro mínimo; compra, precio > nuestro máximo ÷ `lowballFrac` (p. ej. al revelar una repetida en rareza+set).
 */
export function isLowball(view: Pick<ThreadView, "side" | "reservation" | "herOpening" | "herCurrent" | "ourPrices">, p: Pick<NegotiatorParams, "lowballFrac">): boolean {
  if (p.lowballFrac <= 0 || view.ourPrices.length < 1 || !view.herCurrent) return false;
  const first = view.herOpening ?? view.herCurrent.price;
  if (view.side === "buy") {
    const ceiling = view.reservation / p.lowballFrac;
    return first > ceiling && view.herCurrent.price > ceiling;
  }
  const floor = p.lowballFrac * view.reservation;
  return first < floor && view.herCurrent.price < floor;
}

export function decide(view: ThreadView, p: NegotiatorParams = DEFAULT_NEGOTIATOR_PARAMS): Decision {
  const effRes = effectiveReservation(view);
  if (effRes < 1) return { action: { kind: "close" }, rule: "no-zone", effectiveReservation: effRes };
  const next = nextPrice(view, p);
  const her = view.herCurrent;

  if (her && herPriceIsFixed(view, p)) {
    if (!valuePositive(view, her.price)) return { action: { kind: "close" }, rule: "fixed-price-out-of-range", effectiveReservation: effRes };
    if (!view.canAccept) return { action: { kind: "wait" }, rule: "one-accept-per-tick", effectiveReservation: effRes };
    return { action: { kind: "accept", offerId: her.offerId, price: her.price }, rule: "fixed-price", effectiveReservation: effRes };
  }

  if (her) {
    const isOpening = view.herOpening !== undefined && her.price === view.herOpening;
    const withinRes = !isOpening && atLeastAsGood(view.side, her.price, effRes);
    // AC_next: su oferta es al menos tan buena como la que le mandaríamos; o ya no podemos movernos.
    const acNext = withinRes && (next === undefined || atLeastAsGood(view.side, her.price, next.price));
    // Una oferta final se acepta si cabe en la reserva privada y crea valor, aunque sea su apertura (cuenta como trato).
    const finalTake = her.final && valuePositive(view, her.price);
    // Está a punto de irse (final, o nuestro próximo mensaje agota la paciencia que le calculamos) con su apertura
    // sin mover: mejor cerrar en efectivo positivo que arriesgar el no-deal (hilo 257: su apertura 13, reserva 9).
    const aboutToWalk = her.final || view.ourPrices.length >= p.patienceBudget - 1;
    const openingLastChance = isOpening && !finalTake && aboutToWalk && valuePositive(view, her.price);
    const take = acNext || finalTake || openingLastChance;
    if (take) {
      const rule: Rule = acNext ? "ac-next" : finalTake ? "final-above-reservation" : "opening-last-chance";
      if (!view.canAccept) return { action: { kind: "wait" }, rule: "one-accept-per-tick", effectiveReservation: effRes };
      return { action: { kind: "accept", offerId: her.offerId, price: her.price }, rule, effectiveReservation: effRes, ...(next ? { ourNext: next.price } : {}) };
    }
    if (her.final) return { action: { kind: "close" }, rule: "final-below-reservation", effectiveReservation: effRes };
    if (isLowball(view, p)) return { action: { kind: "close" }, rule: "lowball-bid", effectiveReservation: effRes };
  }

  // Atascados: nuestra siguiente contraoferta cruzaría la reserva efectiva (no mejora su oferta, o no hay
  // margen para moverse). En vez de cerrar de golpe, aguantamos el precio unos tics (sin oferta final suya)
  // para que ella diga su última palabra; solo cerramos si ya se agotaron los aguantes.
  const stuck = next === undefined || (her !== undefined && !better(view.side, next.price, her.price));
  if (stuck) {
    // Atascados con su precio dentro de nuestro límite privado y creando valor: se acepta ya (el trato cuenta).
    if (her && valuePositive(view, her.price)) {
      if (!view.canAccept) return { action: { kind: "wait" }, rule: "one-accept-per-tick", effectiveReservation: effRes };
      return { action: { kind: "accept", offerId: her.offerId, price: her.price }, rule: "stuck-accept-within-limit", effectiveReservation: effRes };
    }
    const prevPrice = view.ourPrices[view.ourPrices.length - 1];
    const holdsUsed = view.holdsUsed ?? 0;
    if (her && !her.final && prevPrice !== undefined && holdsUsed < holdsAllowed(view.ourPrices.length, p)) {
      if (!view.canMessage) return { action: { kind: "wait" }, rule: "one-message-per-tick", effectiveReservation: effRes };
      return { action: { kind: "hold", price: prevPrice }, rule: "hold", effectiveReservation: effRes };
    }
    return { action: { kind: "close" }, rule: holdsUsed > 0 ? "holds-exhausted" : "stuck-at-reservation", effectiveReservation: effRes };
  }
  if (!view.canMessage) return { action: { kind: "wait" }, rule: "one-message-per-tick", effectiveReservation: effRes, ourNext: next.price };
  return { action: { kind: "counter", price: next.price }, rule: next.rule, effectiveReservation: effRes, ourNext: next.price };
}
