import type { Issue } from "../engine/config.js";
import { pickIssues, sameOffer, type Offer } from "../engine/issues.js";

/**
 * Modo solo texto: la oferta del rival extraída del texto solo se registra si el parser
 * determinista y el parser LLM coinciden en cada issue; sin LLM (`dual` falso) basta el
 * determinista, que ya exige un único valor no ambiguo por issue. Si no, turno sin oferta.
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
