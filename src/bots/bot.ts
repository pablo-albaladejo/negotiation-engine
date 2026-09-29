import type { GameSetup, Participant, PlayerSession } from "../arena/participant.js";
import { enforceOfferGuardrails } from "../engine/guardrails.js";
import { orientIssues, pickIssues, reservationUtility, roundInFavor, utility, withinOfferMandate, type Offer } from "../engine/issues.js";
import { concession, offerAboveReservation, openingUtility } from "../engine/offer.js";
import { createRng, type Rng } from "../engine/rng.js";
import { formatOffer } from "../llm/template.js";
import type { TurnInput, TurnOutput } from "../protocol/schemas.js";

/** Lo que ve una estrategia de bot para elegir la utilidad (propia) de su siguiente oferta. */
export interface StrategyContext {
  t: number;
  uOpen: number;
  uRes: number;
  /** Utilidades (del bot) de sus ofertas anteriores. */
  own: readonly number[];
  /** Utilidades (del bot) de las ofertas del rival. */
  theirs: readonly number[];
}

export type Strategy = (ctx: StrategyContext) => number;

/** Táctica dependiente del tiempo (Faratin et al.): β < 1 Boulware, β > 1 Conceder. */
export function timeDependent(beta: number): Strategy {
  return ({ t, uOpen, uRes }) => uOpen - (uOpen - uRes) * concession(t, beta);
}

/** Tit-for-Tat relativo: concede en su utilidad lo mismo que concedió el rival en su última oferta. */
export const titForTat: Strategy = ({ uOpen, own, theirs }) => {
  const last = own.at(-1);
  if (last === undefined) return uOpen;
  if (theirs.length < 2) return last;
  const rivalConcession = Math.max(0, theirs.at(-1)! - theirs.at(-2)!);
  return last - rivalConcession;
};

export interface RenderInput {
  action: "accept" | "counter" | "walk";
  offer?: Offer;
  rng: Rng;
}

export type Renderer = (input: RenderInput) => string;

/** Texto sencillo con cifras en dígitos (bots clásicos). */
export const plainRenderer: Renderer = ({ action, offer }) => {
  if (action === "accept") return "De acuerdo, acepto.";
  if (action === "walk") return "No hay acuerdo posible, me retiro.";
  return `Mi propuesta: ${formatOffer(offer ?? {})}.`;
};

export interface BotOptions {
  name: string;
  strategy: Strategy;
  pool?: "tuning" | "heldOut";
  /** Fracción del tramo entre la reserva y 1 con la que abre. */
  openingMargin?: number;
  /** Amplitud del ruido sembrado sobre el paso de concesión. */
  noise?: number;
  /** Horizonte supuesto si el turno no trae límite de rondas. */
  defaultHorizon?: number;
  render?: Renderer;
}

/** Decisión de un turno del bot, con su oferta real (la que la arena usa como verdad). */
export interface BotMove {
  action: "accept" | "counter" | "walk";
  offer?: Offer;
}

/**
 * Bot determinista por semilla, sin LLM ni red. Acepta la oferta actual del rival si está dentro
 * de su mandato y le da al menos la utilidad de su siguiente oferta (AC_next), o en su último
 * movimiento si cubre su reserva. Sus ofertas nunca cruzan su reserva y son monótonas.
 */
export function createBot(options: BotOptions): Participant {
  const openingMargin = options.openingMargin ?? 0.9;
  const noise = options.noise ?? 0.1;
  const render = options.render ?? plainRenderer;
  return {
    name: options.name,
    kind: "bot",
    pool: options.pool ?? "tuning",
    start(setup: GameSetup): PlayerSession {
      const issues = orientIssues(setup.issues, setup.mandate.role);
      const mandate = setup.mandate;
      const uRes = reservationUtility(issues, mandate);
      const uOpen = openingUtility(uRes, openingMargin);
      const rng = createRng(setup.seed);
      const own: Offer[] = [];
      const theirs: Offer[] = [];

      function move(turn: TurnInput): BotMove {
        if (turn.rivalAction === "walk") return { action: "walk" };
        if (turn.rivalOffer) theirs.push(pickIssues(issues, turn.rivalOffer));
        const limit = turn.roundLimit ?? options.defaultHorizon ?? 10;
        const t = Math.min(1, turn.round / limit);
        const previous = own.at(-1);
        const previousU = previous ? utility(issues, previous) : uOpen;
        const raw = options.strategy({
          t,
          uOpen,
          uRes,
          own: own.map((o) => utility(issues, o)),
          theirs: theirs.map((o) => utility(issues, o)),
        });
        const epsilon = noise === 0 ? 0 : rng.between(-noise, noise);
        const step = Math.max(0, previousU - raw) * (previous && t < 1 ? 1 + epsilon : 1);
        const target = Math.max(uRes, Math.min(previousU, previousU - step));
        const proposal = roundInFavor(issues, offerAboveReservation(issues, mandate.reservation, target));
        const next = enforceOfferGuardrails(issues, mandate, proposal, previous);

        const current = theirs.at(-1);
        if (turn.rivalOffer && current && withinOfferMandate(issues, mandate, current)) {
          const u = utility(issues, current);
          if (u >= utility(issues, next) || (t >= 1 && u >= uRes)) return { action: "accept", offer: current };
        }
        own.push(next);
        return { action: "counter", offer: next };
      }

      return {
        async respond(turn: TurnInput): Promise<TurnOutput> {
          const decided = move(turn);
          const text = render({ ...decided, rng });
          const base = { sessionId: turn.sessionId, round: turn.round, text };
          if (decided.action === "walk") return { ...base, action: "walk" };
          return { ...base, action: decided.action, offer: decided.offer! };
        },
      };
    },
  };
}
