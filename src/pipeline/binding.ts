import type { Issue } from "../engine/config.js";
import { sameOffer, type Offer } from "../engine/issues.js";
import { spanAppears, type FigureCheck } from "../llm/verify.js";
import type { RivalAction } from "../protocol/schemas.js";

export type BindingResult =
  | { kind: "agreement"; offer: Offer }
  | { kind: "offer"; offer: Offer }
  | { kind: "walk" }
  | { kind: "none" };

/**
 * Regla de enlace: un `accept` del rival solo acepta nuestra última oferta enviada.
 * Con cifras distintas de esa oferta es una oferta nueva y pasa por el motor.
 */
export function bindRivalMove(
  issues: readonly Issue[],
  action: RivalAction,
  offer: Offer | undefined,
  ourLast: Offer | undefined,
): BindingResult {
  if (action === "walk") return { kind: "walk" };
  if (action === "accept") {
    if (!offer) return ourLast ? { kind: "agreement", offer: { ...ourLast } } : { kind: "none" };
    if (ourLast && sameOffer(issues, offer, ourLast)) return { kind: "agreement", offer: { ...ourLast } };
    return { kind: "offer", offer: { ...offer } };
  }
  return offer ? { kind: "offer", offer: { ...offer } } : { kind: "none" };
}

export type TextAcceptReason = "not-accept" | "no-evidence" | "negated" | "no-prior-offer" | "figures-unverified" | "llm-only" | "figures-differ";

export interface TextAcceptInput {
  issues: readonly Issue[];
  text: string;
  intent: string;
  intentEvidence?: string;
  /** Negación detectada por el parser determinista (es/en). */
  negated: boolean;
  ourLast: Offer | undefined;
  /** Comprobación de las cifras que el parser LLM citó, si citó alguna. */
  checks?: readonly FigureCheck[];
  /** Oferta completa del parser determinista (política `deterministic-only`). */
  deterministic?: Offer;
  /** ¿El normalizador encuentra cifras en el texto? */
  textHasNumbers: boolean;
}

/**
 * Aceptación verificada leída en el texto (`acceptance.signal = parser-intent-verified`): intención
 * `accept` con evidencia literal, sin negación, tras una oferta nuestra y sin cifras nuevas, o con
 * cada cifra citada verificada (nunca `llm-only`) e igual a nuestra última oferta. El acuerdo es
 * siempre nuestra última oferta, que ya pasó los guardarraíles.
 */
export function verifyTextAcceptance(input: TextAcceptInput): { verified: true } | { verified: false; reason: TextAcceptReason } {
  const fail = (reason: TextAcceptReason) => ({ verified: false as const, reason });
  if (input.intent !== "accept") return fail("not-accept");
  if (!spanAppears(input.text, input.intentEvidence)) return fail("no-evidence");
  if (input.negated) return fail("negated");
  const ourLast = input.ourLast;
  if (!ourLast) return fail("no-prior-offer");
  const known = new Set(input.issues.map((i) => i.name));
  if (input.checks && input.checks.length > 0) {
    if (input.checks.some((c) => !c.ok)) return fail("figures-unverified");
    if (input.checks.some((c) => c.confidence === "llm-only")) return fail("llm-only");
    const equal = input.checks.every((c) => known.has(c.issue) && ourLast[c.issue] !== undefined && Math.abs(ourLast[c.issue]! - c.value) <= 1e-6);
    return equal ? { verified: true } : fail("figures-differ");
  }
  if (input.deterministic) return sameOffer(input.issues, input.deterministic, ourLast) ? { verified: true } : fail("figures-differ");
  return input.textHasNumbers ? fail("figures-unverified") : { verified: true };
}
