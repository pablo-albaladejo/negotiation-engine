import { closeText, counterText, holdText } from "../dealers/messages.js";
import { decide, DEFAULT_NEGOTIATOR_PARAMS, type Action, type NegotiatorParams, type Side, type ThreadView } from "../dealers/negotiator.js";
import type { Thread } from "../shared/schemas.js";
import { threadPrices, type DealerRef } from "../dealers/view.js";

/**
 * Políticas que el arnés enfrenta al `DealerSim`: nuestro negociador (las mismas llamadas que
 * `BazaarAgent.negotiate`: `threadPrices` → `decide` → plantillas) y el `starter_agent.py` del kit
 * (pasos de +2 P) como línea base.
 */

export interface PolicyCtx {
  side: Side;
  reservation: number;
  tick: number;
  /** Precios que hemos enviado en el hilo, en orden. */
  sent: readonly number[];
  lastSentTick?: number;
  lastAcceptTick: number;
  /** Aguantes ya gastados en este hilo (política `ours`). */
  holdsUsed?: number;
  dealer: DealerRef;
}

export interface PolicyStep {
  action: Action;
  text?: string;
  rule?: string;
}

export interface Policy {
  name: string;
  act(thread: Thread, ctx: PolicyCtx): PolicyStep;
}

/** Nuestro negociador sin cambios (parámetros opcionales para barridos). */
export function oursPolicy(params: NegotiatorParams = DEFAULT_NEGOTIATOR_PARAMS, name = "ours"): Policy {
  return {
    name,
    act(thread, ctx) {
      const p = threadPrices(thread, ctx.side, ctx.dealer);
      if (ctx.sent.length) p.ourPrices = [...ctx.sent];
      const view: ThreadView = {
        side: ctx.side,
        reservation: ctx.reservation,
        herPrices: p.herPrices,
        ourPrices: p.ourPrices,
        ...(p.herOpening !== undefined ? { herOpening: p.herOpening } : {}),
        ...(p.herCurrent ? { herCurrent: p.herCurrent } : {}),
        canMessage: ctx.lastSentTick !== ctx.tick,
        canAccept: ctx.lastAcceptTick !== ctx.tick,
        holdsUsed: ctx.holdsUsed ?? 0,
      };
      const d = decide(view, params);
      const a = d.action;
      if (a.kind === "counter") return { action: a, text: counterText(ctx.side, p.ourPrices.length, a.price), rule: d.rule };
      if (a.kind === "hold") return { action: a, text: holdText(p.ourPrices.length, a.price), rule: d.rule };
      if (a.kind === "close") return { action: a, text: closeText(p.ourPrices.length), rule: d.rule };
      return { action: a, rule: d.rule };
    },
  };
}

/**
 * `starter_agent.py`: compra empezando en 0,6 × presupuesto y sube 2 P por ronda hasta el
 * presupuesto; acepta si su precio ≤ min(presupuesto, oferta + 1) o si es final y cabe. Nunca cierra.
 * En venta, el espejo (ASSUMPTION): empieza en max(reserva, 2 × su primera puja) y baja 2 P.
 */
export function naivePolicy(name = "naive"): Policy {
  return {
    name,
    act(thread, ctx) {
      const p = threadPrices(thread, ctx.side, ctx.dealer);
      const her = p.herCurrent;
      const res = ctx.reservation;
      const buy = ctx.side === "buy";
      const start = buy ? Math.floor(res * 0.6) : Math.max(res, 2 * (p.herOpening ?? res));
      const offer = ctx.sent.length === 0 ? start : buy ? Math.min(res, ctx.sent.at(-1)! + 2) : Math.max(res, ctx.sent.at(-1)! - 2);
      if (her) {
        const fine = buy ? her.price <= Math.min(res, offer + 1) : her.price >= Math.max(res, offer - 1);
        const lastWord = her.final && (buy ? her.price <= res : her.price >= res);
        if (fine || lastWord) return ctx.lastAcceptTick === ctx.tick ? { action: { kind: "wait" } } : { action: { kind: "accept", offerId: her.offerId, price: her.price } };
      }
      if (ctx.lastSentTick === ctx.tick) return { action: { kind: "wait" } };
      return { action: { kind: "counter", price: offer }, text: `Hola, Abuela! Would ${offer} P be all right? Thank you very much.` };
    },
  };
}
