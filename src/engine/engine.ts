import { z } from "zod";
import { defineBox, registerBox } from "../pipeline/box.js";
import { decideAcceptance, computeTime, type AcceptanceRule, type TimeFields } from "./acceptance.js";
import { IssueSchema, type Issue } from "./config.js";
import { enforceOfferGuardrails } from "./guardrails.js";
import { acceptableForUs, orientIssues, pickIssues, reservationUtility, utility, type Offer, type OfferMandate } from "./issues.js";
import { generateOffer, openingUtility, sampleEpsilon } from "./offer.js";
import { OpponentModel } from "./opponent.js";
import { createRng, deriveSeed } from "./rng.js";

const OfferRecord = z.record(z.string(), z.number());

export const EngineParamsSchema = z.object({
  beta: z.number().nonnegative(),
  openingMargin: z.number().min(0).max(1),
  acceptMargin: z.number().min(0).max(1),
  acTimeThreshold: z.number().min(0).max(1),
  noise: z.number().min(0).lt(1),
  defaultHorizon: z.number().int().min(1),
});
export type EngineParams = z.infer<typeof EngineParamsSchema>;

export const EngineInputSchema = z.object({
  /** Issues tal como se declaran en la configuración (dirección desde el comprador). */
  issues: z.array(IssueSchema).min(1),
  mandate: z.object({ role: z.enum(["buyer", "seller"]), reservation: OfferRecord }),
  params: EngineParamsSchema,
  state: z.object({
    round: z.number().int().min(1),
    roundLimit: z.number().int().min(1).optional(),
    deadlineMs: z.number().optional(),
    startedAtMs: z.number().optional(),
    nowMs: z.number().optional(),
    /** Nuestras ofertas enviadas, en orden. */
    ourOffers: z.array(OfferRecord),
    /** Ofertas registradas del rival, en orden; la última es la actual. */
    rivalOffers: z.array(OfferRecord),
    /** El rival aceptó nuestra última oferta (regla de enlace ya aplicada). */
    rivalAcceptedOurLast: z.boolean(),
    rivalWalked: z.boolean(),
    /** Solo texto: el rival mandó cifras que no se pudieron confirmar; no hay oferta aceptable este turno. */
    currentOfferUnconfirmed: z.boolean().optional(),
    /** Si el ring admite respuesta del rival tras nuestro último movimiento. */
    rivalCanRespond: z.boolean().optional(),
  }),
  seed: z.number().int(),
});
export type EngineInput = z.infer<typeof EngineInputSchema>;

export const DecisionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept"), offer: OfferRecord, rule: z.string() }).strict(),
  z.object({ action: z.literal("counter"), offer: OfferRecord, rule: z.string() }).strict(),
  z.object({ action: z.literal("walk"), rule: z.string() }).strict(),
]);
export type Decision = z.infer<typeof DecisionSchema>;

type Rule = AcceptanceRule | "rival-walked" | "rival-accepted" | "opening" | "emergency";

function asMandate(input: EngineInput): OfferMandate {
  return { role: input.mandate.role, reservation: input.mandate.reservation };
}

/** Nuestra oferta de apertura, ya por los guardarraíles (también la usa la ruta de emergencia). */
export function openingOffer(issues: readonly Issue[], mandate: OfferMandate, params: Pick<EngineParams, "openingMargin" | "beta">): Offer {
  const oriented = orientIssues(issues, mandate.role);
  const uRes = reservationUtility(oriented, mandate);
  const proposal = generateOffer(
    { issues: oriented, reservation: mandate.reservation, uRes, openingMargin: params.openingMargin, beta: params.beta },
    0,
    0,
  );
  return enforceOfferGuardrails(oriented, mandate, proposal);
}

/**
 * Motor determinista: utilidad → modelo del rival → oferta → aceptación → guardarraíles.
 * Puro: sin E/S ni reloj; la misma entrada y semilla dan la misma decisión.
 */
export function decide(input: EngineInput): Decision {
  const mandate = asMandate(input);
  const issues = orientIssues(input.issues, mandate.role);
  const { state, params } = input;
  const ourLast = state.ourOffers.at(-1);
  const decision = (action: "accept" | "counter", offer: Offer, rule: Rule): Decision => ({
    action,
    offer: pickIssues(issues, offer),
    rule,
  });

  if (state.rivalWalked) return { action: "walk", rule: "rival-walked" };
  if (state.rivalAcceptedOurLast && ourLast && acceptableForUs(issues, mandate, ourLast)) {
    return decision("accept", ourLast, "rival-accepted");
  }

  const opponent = new OpponentModel(issues);
  for (const offer of state.rivalOffers) opponent.recordOffer(offer);
  const rivalCurrent = state.currentOfferUnconfirmed ? undefined : opponent.summary().currentOffer;

  const timeFields: TimeFields = { round: state.round };
  if (state.roundLimit !== undefined) timeFields.roundLimit = state.roundLimit;
  if (state.deadlineMs !== undefined) timeFields.deadlineMs = state.deadlineMs;
  if (state.startedAtMs !== undefined) timeFields.startedAtMs = state.startedAtMs;
  if (state.nowMs !== undefined) timeFields.nowMs = state.nowMs;
  const time = computeTime(timeFields, params.defaultHorizon);

  const uRes = reservationUtility(issues, mandate);
  const rng = createRng(deriveSeed(input.seed, `engine:${state.round}`));
  const epsilon = sampleEpsilon(rng, params.noise);
  const proposal = generateOffer(
    { issues, reservation: mandate.reservation, uRes, openingMargin: params.openingMargin, beta: params.beta },
    time.t,
    epsilon,
    ourLast,
  );
  const counter = enforceOfferGuardrails(issues, mandate, proposal, ourLast);

  const acceptance = {
    issues,
    mandate,
    ourNextUtility: utility(issues, counter),
    time,
    acceptMargin: params.acceptMargin,
    acTimeThreshold: params.acTimeThreshold,
    rivalCanRespond: state.rivalCanRespond ?? false,
  };
  const verdict = decideAcceptance(rivalCurrent ? { ...acceptance, rivalCurrent } : acceptance);

  if (verdict.verdict === "accept" && rivalCurrent) return decision("accept", rivalCurrent, verdict.rule);
  if (verdict.verdict === "walk") return { action: "walk", rule: verdict.rule };
  return decision("counter", counter, ourLast ? verdict.rule : "opening");
}

/** Utilidad de apertura (para tests y la ruta de emergencia). */
export function openingUtilityFor(issues: readonly Issue[], mandate: OfferMandate, openingMargin: number): number {
  const oriented = orientIssues(issues, mandate.role);
  return openingUtility(reservationUtility(oriented, mandate), openingMargin);
}

export const engineBox = defineBox({
  name: "engine",
  input: EngineInputSchema,
  output: DecisionSchema,
  run: (input) => decide(input),
});

registerBox(engineBox);
