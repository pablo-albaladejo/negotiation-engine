import type { ChatMessageFlag } from "@negotiation-ring/design-system";
import type { RoundPanel } from "../model/index.js";
import { offerValue } from "./offer.js";

/**
 * Chat message flags (A6, d:413-428), all derived from logged fields: our `target`/`est. reserve`/
 * `rule: …` on a counter-offer, the accept flag on an accept decision, and `injection`/
 * `quarantined` on the opponent's turn when the parser flagged it. Never invents a value the trace
 * doesn't carry (e.g. tactics aren't logged on `RoundPanel`, so they're not shown).
 */
export function chatFlags(from: "agent" | "rival", panel: RoundPanel | null): ChatMessageFlag[] {
  if (!panel) return [];
  if (from === "agent") {
    if (panel.decision?.action === "accept") {
      const price = offerValue(panel.decision.offer);
      return [{ kind: "decision", label: price !== null ? `AC_next · accepts ${price}` : "AC_next · accepts" }];
    }
    const flags: ChatMessageFlag[] = [];
    if (panel.explain) flags.push({ kind: "neutral", label: `target ${panel.explain.target}` });
    const estimate = panel.explain ? offerValue(panel.explain.rivalReserveEstimate) : null;
    if (estimate !== null) flags.push({ kind: "neutral", label: `est. reserve ${estimate}` });
    if (panel.decision?.rule) flags.push({ kind: "neutral", label: `rule: ${panel.decision.rule}` });
    return flags;
  }
  if (panel.parser?.injectionSuspected) {
    return [
      { kind: "injection", label: "injection" },
      { kind: "neutral", label: "quarantined" },
    ];
  }
  return [];
}
