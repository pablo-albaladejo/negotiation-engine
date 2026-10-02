import type { GameSetup, Participant, PlayerSession } from "../arena/participant.js";
import { APR_DAY, APR_PCT, aprBetter, aprOffer, offerApr, withinAprBand } from "../engine/apr.js";
import { enforceOfferGuardrails } from "../engine/guardrails.js";
import { acceptableForUs, orientIssues, pickIssues, reservationUtility, roundInFavor, utility, type Offer } from "../engine/issues.js";
import { offerAboveReservation } from "../engine/offer.js";
import { formatOffer } from "../llm/template.js";
import { createProtocolSchemas, type TurnInput, type TurnOutput } from "../protocol/schemas.js";

/**
 * Imitación (inferida de su UI pública, no confirmada) del motor de producción de Causa Prima:
 * abre en su ancla (el extremo favorable de su banda), concede según un calendario fijo,
 * recomprueba su mandato antes de enviar, acepta la oferta explícita del rival si está dentro de
 * su banda y se retira con `protocol_violation`, `no_convergence` o `round_limit`.
 * Con mandato `apr` su valor es la TAE; si no, la utilidad lineal por issue (ancla u = 1).
 */

/** Fracción de la banda (ancla → reserva) concedida en la k-ésima oferta. */
export const DEFAULT_SCHEDULE: readonly number[] = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1];

export type StopReason = "protocol_violation" | "no_convergence" | "round_limit" | "rival_walked";

export interface CausaPrimaEngineOptions {
  name?: string;
  /** Calendario de concesión: fracciones no decrecientes en [0, 1]; la última se mantiene. */
  schedule?: readonly number[];
  /** Límite de rondas propio; por defecto el del turno o la longitud del calendario. */
  maxRounds?: number;
  /** Rondas seguidas sin que baje la distancia antes de `no_convergence`. */
  stallRounds?: number;
}

interface Valuation {
  value(offer: Offer): number;
  offerAt(value: number): Offer;
  within(offer: Offer): boolean;
  better(a: number, b: number): boolean;
  anchor: number;
  reserve: number;
}

function valuation(setup: GameSetup): Valuation {
  const { mandate } = setup;
  const band = mandate.apr;
  if (band) {
    const buyer = mandate.role === "buyer";
    return {
      value: (offer) => offerApr(band, offer),
      offerAt: (value) => aprOffer(band, mandate.role, value),
      within: (offer) => withinAprBand(band, offer),
      better: (a, b) => aprBetter(mandate.role, a, b),
      anchor: buyer ? band.max : band.min,
      reserve: buyer ? band.min : band.max,
    };
  }
  const issues = orientIssues(setup.issues, mandate.role);
  return {
    value: (offer) => utility(issues, offer),
    offerAt: (value) => enforceOfferGuardrails(issues, mandate, roundInFavor(issues, offerAboveReservation(issues, mandate.reservation, value))),
    within: (offer) => acceptableForUs(issues, mandate, offer),
    better: (a, b) => a > b,
    anchor: 1,
    reserve: reservationUtility(issues, mandate),
  };
}

export function describeOffer(offer: Offer): string {
  const keys = Object.keys(offer);
  if (keys.length === 2 && offer[APR_PCT] !== undefined && offer[APR_DAY] !== undefined) return `${offer[APR_PCT]}% for payment by day ${offer[APR_DAY]}`;
  return formatOffer(offer);
}

export function createCausaPrimaEngineBot(options: CausaPrimaEngineOptions = {}): Participant {
  const schedule = options.schedule ?? DEFAULT_SCHEDULE;
  if (schedule.length === 0 || schedule.some((s, k) => s < 0 || s > 1 || (k > 0 && s < schedule[k - 1]!))) {
    throw new Error("calendario de concesión inválido: fracciones no decrecientes en [0, 1]");
  }
  const stallRounds = options.stallRounds ?? 3;
  return {
    name: options.name ?? "causa-prima-engine",
    kind: "bot",
    pool: "heldOut",
    start(setup: GameSetup): PlayerSession {
      const v = valuation(setup);
      const issueNames = setup.issues.map((i) => i.name);
      const schemas = createProtocolSchemas(issueNames);
      const own: Offer[] = [];
      const gaps: number[] = [];
      let lastRound = 0;

      function violation(turn: TurnInput): boolean {
        if (!schemas.turnInput.safeParse(turn).success || turn.sessionId !== setup.sessionId || turn.round <= lastRound) return true;
        if (turn.rivalAction === "offer" && setup.mode === "structured" && !turn.rivalOffer) return true;
        return Boolean(turn.rivalOffer && setup.issues.some((i) => turn.rivalOffer![i.name]! < i.min || turn.rivalOffer![i.name]! > i.max));
      }

      const stop = (turn: TurnInput, reason: StopReason): TurnOutput => ({
        sessionId: turn.sessionId,
        round: Number.isInteger(turn.round) && turn.round >= 1 ? turn.round : 1,
        action: "walk",
        text: `Negotiation stopped: ${reason}`,
      });

      return {
        async respond(turn: TurnInput): Promise<TurnOutput> {
          if (violation(turn)) return stop(turn, "protocol_violation");
          lastRound = turn.round;
          if (turn.rivalAction === "walk") return stop(turn, "rival_walked");
          const rival = turn.rivalOffer ? pickIssues(setup.issues, turn.rivalOffer) : undefined;
          const base = { sessionId: turn.sessionId, round: turn.round };
          if (rival && v.within(rival)) return { ...base, action: "accept", offer: rival, text: "Accepted" };
          if (turn.round > (options.maxRounds ?? turn.roundLimit ?? schedule.length)) return stop(turn, "round_limit");

          const last = own.at(-1);
          if (last && rival) {
            gaps.push(Math.abs(v.value(last) - v.value(rival)));
            const before = gaps.at(-1 - stallRounds);
            if (before !== undefined && gaps.at(-1)! >= before - 1e-9) return stop(turn, "no_convergence");
          }
          const fraction = schedule[Math.min(own.length, schedule.length - 1)]!;
          let next = v.offerAt(v.anchor - fraction * (v.anchor - v.reserve));
          // Recomprobación del mandato al enviar: nunca fuera de la banda ni retrocediendo.
          if (!v.within(next)) next = v.offerAt(v.reserve);
          if (last && v.better(v.value(next), v.value(last))) next = last;
          own.push(next);
          return { ...base, action: "counter", offer: next, text: `${own.length === 1 ? "Opening offer" : "Counter"}: ${describeOffer(next)}` };
        },
      };
    },
  };
}
