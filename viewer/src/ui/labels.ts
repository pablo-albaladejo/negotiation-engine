import type { TranscriptLine } from "../../../src/arena/results-schema.js";

/** UI label + KPI tone for the engine's logged `endReason`: "Deal"/"Walk" per the spec; other reasons keep a plain English label with no tone. */
export function resultKpi(endReason: TranscriptLine["endReason"]): { label: string; tone?: "deal" | "walk" } {
  switch (endReason) {
    case "agreement":
      return { label: "Deal", tone: "deal" };
    case "agent-walk":
    case "rival-walk":
      return { label: "Walk", tone: "walk" };
    case "limit":
      return { label: "Round limit" };
    case "rival-error":
      return { label: "Rival error" };
    case "agent-error":
      return { label: "Agent error" };
    case "protocol-violation":
      return { label: "Protocol violation", tone: "walk" };
    default:
      // Motivo de fin que esta versión del visor no conoce: se muestra literal, sin tono.
      return { label: String(endReason) };
  }
}

/** ZOPA KPI label: the engine only logs whether it was empty. */
export function zopaKpi(zopaEmpty: boolean): string {
  return zopaEmpty ? "Empty" : "Open";
}
