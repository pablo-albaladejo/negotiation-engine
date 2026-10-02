import type { TranscriptLine } from "../../../src/arena/results-schema.js";

export type EndReason = TranscriptLine["endReason"];

export interface ResultLabel {
  label: string;
  tone?: "deal" | "walk";
}

/**
 * Single label table for the engine's logged `endReason`, used everywhere in the viewer:
 * KpiStrip, the Matches Outcome column, the Filters options and the MatchSelector labels
 * (INBOX §0.3). Raw ids stay in the URL and in internal filter values.
 */
export function resultLabel(endReason: EndReason | string | undefined): ResultLabel {
  switch (endReason) {
    case "agreement":
      return { label: "Deal", tone: "deal" };
    case "agent-walk":
      return { label: "We walked", tone: "walk" };
    case "rival-walk":
      return { label: "Opponent walked", tone: "walk" };
    case "rival-error":
    case "protocol-violation":
      return { label: "Opponent error", tone: "walk" };
    case "limit":
      return { label: "Round limit" };
    case "agent-error":
      return { label: "Agent error" };
    default:
      // Motivo de fin que esta versión del visor no conoce: se muestra literal, sin tono.
      return { label: endReason ?? "not logged" };
  }
}

/** Binary deal/walk classification for components that need one, e.g. MatchSelector's swatch. */
export function resultTone(endReason: EndReason | string | undefined): "deal" | "walk" {
  return resultLabel(endReason).tone === "deal" ? "deal" : "walk";
}

/** ZOPA KPI label: the engine only logs whether it was empty. */
export function zopaKpi(zopaEmpty: boolean): string {
  return zopaEmpty ? "Empty" : "Open";
}
