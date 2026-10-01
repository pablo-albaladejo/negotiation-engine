import { z } from "zod";
import { defineBox, registerBox } from "../pipeline/box.js";
import { decideAcceptance, computeTime, type AcceptanceRule, type TimeFields } from "./acceptance.js";
import { IssueSchema, type Issue } from "./config.js";
import { enforceOfferGuardrails } from "./guardrails.js";
import { APR_DAY, APR_PCT, aprOffer, AprBandSchema, enforceAprGuardrails, offerApr, withinAprReservation } from "./apr.js";
import { acceptableForUs, orientIssues, pickIssues, reservationUtility, roundInFavor, utility, type AprBand, type Offer, type OfferMandate } from "./issues.js";
import { boulwareTarget, generateOffer, offerAboveReservation, openingUtility, reciprocityFactor, sampleEpsilon } from "./offer.js";
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
  /** Peso de la reciprocidad Tit-for-Tat sobre el paso (0 = Boulware puro). */
  reciprocity: z.number().min(0).max(1).optional(),
  /** Umbral T de AC_combi(T, MAX^W); ausente = desactivada. */
  acCombiThreshold: z.number().min(0).max(1).optional(),
});
export type EngineParams = z.infer<typeof EngineParamsSchema>;

export const EngineInputSchema = z.object({
  /** Issues tal como se declaran en la configuración (dirección desde el comprador). */
  issues: z.array(IssueSchema).min(1),
  mandate: z.object({ role: z.enum(["buyer", "seller"]), reservation: OfferRecord, apr: AprBandSchema.optional() }),
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

/**
 * Explicación opcional, aditiva, de la decisión: no cambia la acción, la oferta ni la regla
 * (verificado por propiedad sobre fixtures/doradas). No incluye nuestra reserva ni mandato.
 * Se redacta en la exportación OTel (`src/pipeline/otel.ts`).
 */
export const ExplainSchema = z
  .object({
    t: z.number(),
    target: z.number(),
    targetOffer: OfferRecord.nullable(),
    step: z.number().nullable(),
    uOffer: z.number(),
    uRival: z.number().nullable(),
    acNext: z.boolean(),
    acTime: z.enum(["n/a", "applies", "no"]),
    /** Estimación de la reserva del RIVAL (modelo del rival); a priori del escenario sin ofertas suyas, nunca null. */
    rivalReserveEstimate: OfferRecord,
  })
  .strict();
export type Explain = z.infer<typeof ExplainSchema>;

export const DecisionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept"), offer: OfferRecord, rule: z.string(), explain: ExplainSchema.optional() }).strict(),
  z.object({ action: z.literal("counter"), offer: OfferRecord, rule: z.string(), explain: ExplainSchema.optional() }).strict(),
  z.object({ action: z.literal("walk"), rule: z.string(), explain: ExplainSchema.optional() }).strict(),
]);
export type Decision = z.infer<typeof DecisionSchema>;

type Rule = AcceptanceRule | "rival-walked" | "rival-accepted" | "opening" | "emergency";

function asMandate(input: EngineInput): OfferMandate {
  return { role: input.mandate.role, reservation: input.mandate.reservation };
}

/** Nuestra oferta de apertura, ya por los guardarraíles (también la usa la ruta de emergencia). */
export function openingOffer(issues: readonly Issue[], mandate: OfferMandate, params: Pick<EngineParams, "openingMargin" | "beta">): Offer {
  if (mandate.apr) {
    const synthetic = aprSynthetic(mandate.role, mandate.apr);
    const apr = openingOffer(synthetic.issues, synthetic.mandate, params).apr!;
    return enforceAprGuardrails(issues, { ...mandate, apr: mandate.apr }, aprOffer(mandate.apr, mandate.role, apr));
  }
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
  if (input.mandate.apr) return decideApr(input, input.mandate.apr);
  const mandate = asMandate(input);
  const issues = orientIssues(input.issues, mandate.role);
  const { state, params } = input;
  const ourLast = state.ourOffers.at(-1);
  const decision = (action: "accept" | "counter", offer: Offer, rule: Rule, explain?: Explain): Decision => ({
    action,
    offer: pickIssues(issues, offer),
    rule,
    ...(explain ? { explain } : {}),
  });

  if (state.rivalWalked) return { action: "walk", rule: "rival-walked" };
  if (state.rivalAcceptedOurLast && ourLast && acceptableForUs(issues, mandate, ourLast)) {
    return decision("accept", ourLast, "rival-accepted");
  }

  const opponent = new OpponentModel(issues);
  for (const offer of state.rivalOffers) opponent.recordOffer(offer);
  const rivalSummary = opponent.summary();
  const rivalCurrent = state.currentOfferUnconfirmed ? undefined : rivalSummary.currentOffer;

  const timeFields: TimeFields = { round: state.round };
  if (state.roundLimit !== undefined) timeFields.roundLimit = state.roundLimit;
  if (state.deadlineMs !== undefined) timeFields.deadlineMs = state.deadlineMs;
  if (state.startedAtMs !== undefined) timeFields.startedAtMs = state.startedAtMs;
  if (state.nowMs !== undefined) timeFields.nowMs = state.nowMs;
  const time = computeTime(timeFields, params.defaultHorizon);

  const uRes = reservationUtility(issues, mandate);
  const rng = createRng(deriveSeed(input.seed, `engine:${state.round}`));
  const epsilon = sampleEpsilon(rng, params.noise);
  const ourPrevious = state.ourOffers.at(-2);
  const factor = reciprocityFactor(
    params.reciprocity ?? 0,
    rivalSummary.offersSeen >= 2 ? rivalSummary.lastConcession : undefined,
    ourPrevious && ourLast ? utility(issues, ourPrevious) - utility(issues, ourLast) : undefined,
  );
  const proposal = generateOffer(
    { issues, reservation: mandate.reservation, uRes, openingMargin: params.openingMargin, beta: params.beta },
    time.t,
    epsilon,
    ourLast,
    factor,
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
    rivalPrevious: state.rivalOffers.slice(0, -1).map((offer) => pickIssues(issues, offer)),
    ...(params.acCombiThreshold !== undefined ? { acCombiThreshold: params.acCombiThreshold } : {}),
  };
  const verdict = decideAcceptance(rivalCurrent ? { ...acceptance, rivalCurrent } : acceptance);

  const uOpen = openingUtility(uRes, params.openingMargin);
  const target = boulwareTarget(time.t, uOpen, uRes, params.beta);
  const uRival = rivalCurrent ? utility(issues, rivalCurrent) : null;
  // Avoid exposing the reservation offer when target is at or below reservation utility (with tolerance)
  const EPS = 1e-6;
  const explain: Explain = {
    t: time.t,
    target,
    targetOffer: target <= uRes + EPS ? null : roundInFavor(issues, offerAboveReservation(issues, mandate.reservation, target)),
    step: ourLast ? utility(issues, ourLast) - acceptance.ourNextUtility : null,
    uOffer: acceptance.ourNextUtility,
    uRival,
    acNext: rivalCurrent ? uRival! >= acceptance.ourNextUtility - params.acceptMargin : false,
    acTime: !rivalCurrent || time.t < params.acTimeThreshold ? "n/a" : uRival! > uRes + params.acceptMargin ? "applies" : "no",
    rivalReserveEstimate: rivalSummary.estimatedReservation,
  };

  if (verdict.verdict === "accept" && rivalCurrent) return decision("accept", rivalCurrent, verdict.rule, explain);
  if (verdict.verdict === "walk") return { action: "walk", rule: verdict.rule, explain };
  return decision("counter", counter, ourLast ? verdict.rule : "opening", explain);
}

/** Issue sintético `apr` con la banda como rango y la reserva en su borde desfavorable. */
function aprSynthetic(role: OfferMandate["role"], band: AprBand): { issues: Issue[]; mandate: OfferMandate } {
  return {
    issues: [{ name: "apr", min: band.min, max: band.max, direction: "higher-better", weight: 1 }],
    mandate: { role, reservation: { apr: role === "buyer" ? band.min : band.max } },
  };
}

/**
 * Motor con mandato en TAE (design.md D2): el mismo `decide` sobre un único issue sintético `apr`
 * (la banda), con nuestras ofertas y las del rival convertidas a TAE. La TAE decidida se traduce a
 * `{ pct, day }` en el día de la última oferta del rival si está en el rango del issue (solo
 * valoramos la TAE: movernos por la línea de igual TAE no nos cuesta) o en el de referencia, y pasa
 * por el guardarraíl TAE. Acepta cualquier oferta que no cruce el lado de la reserva (también una
 * mejor que nuestro ancla); si no, repite nuestra última oferta o la apertura.
 */
function decideApr(input: EngineInput, band: AprBand): Decision {
  const role = input.mandate.role;
  const mandate = { role, reservation: input.mandate.reservation, apr: band };
  const synthetic = aprSynthetic(role, band);
  const toApr = (offer: Offer): Offer => ({ apr: Math.min(1e6, Math.max(0, offerApr(band, offer))) });
  const decided = decide({
    ...input,
    issues: synthetic.issues,
    mandate: synthetic.mandate,
    state: { ...input.state, ourOffers: input.state.ourOffers.map(toApr), rivalOffers: input.state.rivalOffers.map(toApr) },
  });
  const ourLast = input.state.ourOffers.at(-1);
  const counter = (offer: Offer, rule: string): Decision => ({ action: "counter", offer: enforceAprGuardrails(input.issues, mandate, offer, ourLast), rule });
  const hold = (rule: string) => counter(ourLast ?? openingOffer(input.issues, mandate, input.params), rule);
  if (decided.action === "walk") return { action: "walk", rule: decided.rule };
  if (decided.action === "counter") {
    const atRivalDay = aprOffer(band, role, decided.offer.apr!, rivalDay(input));
    const pct = input.issues.find((i) => i.name === APR_PCT);
    const inRange = !pct || (atRivalDay[APR_PCT]! >= pct.min && atRivalDay[APR_PCT]! <= pct.max);
    return counter(inRange ? atRivalDay : aprOffer(band, role, decided.offer.apr!), decided.rule);
  }
  const agreed = decided.rule === "rival-accepted" ? ourLast : input.state.rivalOffers.at(-1);
  if (!agreed || !withinAprReservation(role, band, agreed)) return hold("apr-band");
  return { action: "accept", offer: pickIssues(input.issues, agreed), rule: decided.rule };
}

/** Día de la última oferta del rival si está dentro del rango del issue `day`; si no, ninguno (día de referencia). */
function rivalDay(input: EngineInput): number | undefined {
  const day = input.state.rivalOffers.at(-1)?.[APR_DAY];
  const issue = input.issues.find((i) => i.name === APR_DAY);
  return day !== undefined && issue && day >= issue.min && day <= issue.max ? day : undefined;
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
