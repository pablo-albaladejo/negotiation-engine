import type { Issue } from "../engine/config.js";
import { pickIssues, sameOffer, type Offer } from "../engine/issues.js";
import type { ParserFigure, ParserOutput } from "../llm/parser.js";
import { verifyFigures, type FigureCheck, type VerifyFailure } from "../llm/verify.js";
import type { ParserPolicy } from "./runtime-config.js";

/**
 * Modo solo texto: la oferta del rival extraída del texto solo se registra si el parser
 * determinista y el parser LLM coinciden en cada issue; sin LLM (`dual` falso) basta el
 * determinista, que ya exige un único valor no ambiguo por issue. Si no, turno sin oferta.
 * Es la política `dual-strict`.
 */
export function reconcileTextOffer(
  issues: readonly Issue[],
  deterministic: Offer | undefined,
  llm: Offer | undefined,
  dual: boolean,
): Offer | undefined {
  if (!deterministic) return undefined;
  if (!dual) return pickIssues(issues, deterministic);
  if (!llm || !sameOffer(issues, deterministic, llm)) return undefined;
  return pickIssues(issues, deterministic);
}

export type OfferConfidence = "structured" | "dual-agreed" | "verified-digits" | "verified-words" | "llm-only" | "deterministic-only" | "unconfirmed";
export type NoOfferReason = VerifyFailure | "disagreement" | "llm-failed";

export interface ReconcileInput {
  issues: readonly Issue[];
  text: string;
  /** Política efectiva: sin LLM disponible el pipeline ya la degrada a `deterministic-only`. */
  policy: ParserPolicy;
  /** Resultado del parser LLM; ausente si no se llamó al LLM. */
  llm?: { ok: true; output: ParserOutput } | { ok: false };
  /** Oferta completa y no ambigua del parser determinista, si la hay. */
  deterministic: Offer | undefined;
  acceptWordNumbers: "confirm" | "llm-only";
  onLlmFailure: "deterministic" | "confirm";
}

export interface Reconciled {
  offer?: Offer;
  confidence: OfferConfidence;
  reason?: NoOfferReason;
  /** Comprobación por cifra (lleva evidencias: texto del rival, solo para la traza local). */
  checks?: FigureCheck[];
}

/** Oferta completa a partir de las cifras del LLM, sin verificar (solo para `dual-strict`). */
function figuresOffer(issues: readonly Issue[], figures: readonly ParserFigure[] | undefined): Offer | undefined {
  if (!figures || figures.length === 0) return undefined;
  const values = new Map<string, number>();
  for (const f of figures) {
    const previous = values.get(f.issue);
    if (previous !== undefined && previous !== f.value) return undefined;
    values.set(f.issue, f.value);
  }
  if (!issues.every((i) => values.has(i.name))) return undefined;
  return Object.fromEntries(issues.map((i) => [i.name, values.get(i.name)!]));
}

const none = (reason: NoOfferReason, checks?: FigureCheck[]): Reconciled => ({ confidence: "unconfirmed", reason, ...(checks ? { checks } : {}) });

/**
 * Oferta del rival desde el texto según `parser.policy`. El LLM nunca fija una cifra por su
 * cuenta: con `llm-primary-verified` cada cifra pasa la verificación por evidencia literal y el
 * determinista veta si extrae una oferta completa distinta; con `dual-strict` deben coincidir.
 */
export function reconcileOffer(input: ReconcileInput): Reconciled {
  const { issues, deterministic, llm } = input;
  if (input.policy === "deterministic-only" || !llm) {
    return deterministic ? { offer: pickIssues(issues, deterministic), confidence: "deterministic-only" } : none("ambiguous");
  }
  if (input.policy === "dual-strict") {
    if (!llm.ok) return none("llm-failed");
    const llmOffer = llm.output.offer ?? figuresOffer(issues, llm.output.figures);
    const agreed = reconcileTextOffer(issues, deterministic, llmOffer, true);
    if (agreed) return { offer: agreed, confidence: "dual-agreed" };
    return none(!deterministic && !llmOffer ? "partial" : "disagreement");
  }
  // llm-primary-verified
  if (!llm.ok) {
    if (input.onLlmFailure === "deterministic" && deterministic) return { offer: pickIssues(issues, deterministic), confidence: "deterministic-only" };
    return none("llm-failed");
  }
  const figures = llm.output.figures ?? [];
  if (figures.length === 0) return none(deterministic ? "disagreement" : "partial");
  const verified = verifyFigures(input.text, figures, issues, { acceptWordNumbers: input.acceptWordNumbers });
  if (!verified.ok) return none(verified.reason, verified.checks);
  if (deterministic && !sameOffer(issues, deterministic, verified.offer)) return none("disagreement", verified.checks);
  return { offer: verified.offer, confidence: verified.confidence, checks: verified.checks };
}
