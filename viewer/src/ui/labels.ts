import type { Summary, TranscriptLine } from "../../../src/arena/results-schema.js";
import type { RunKind } from "../model/index.js";

export type EndReason = TranscriptLine["endReason"];

export interface ResultLabel {
  label: string;
  tone?: "deal" | "walk";
}

/** Side that broke the protocol, as logged either on the transcript line (`protocolViolation.by`) or on its metrics (`metrics.protocolViolation`). */
export type ViolationBy = "agent" | "rival" | null | undefined;

/**
 * Single label table for the engine's logged `endReason`, used everywhere in the viewer:
 * KpiStrip, the Matches Outcome column, the Filters options and the MatchSelector labels
 * (INBOX §0.3). Raw ids stay in the URL and in internal filter values.
 *
 * `violationBy` disambiguates `endReason: "protocol-violation"` (either side can break the
 * protocol): pass `line.protocolViolation?.by ?? metrics.protocolViolation`. Omit it where only
 * the raw `endReason` is known (e.g. the Filters dropdown options) -- the generic "Protocol
 * violation" label never collides with "Opponent error" (`rival-error`).
 */
export function resultLabel(endReason: EndReason | string | undefined, violationBy?: ViolationBy): ResultLabel {
  switch (endReason) {
    case "agreement":
      return { label: "Deal", tone: "deal" };
    case "agent-walk":
      return { label: "We walked", tone: "walk" };
    case "rival-walk":
      return { label: "Opponent walked", tone: "walk" };
    case "rival-error":
      return { label: "Opponent error", tone: "walk" };
    case "protocol-violation":
      if (violationBy === "rival") return { label: "Opponent protocol violation", tone: "walk" };
      if (violationBy === "agent") return { label: "Our protocol violation", tone: "walk" };
      return { label: "Protocol violation", tone: "walk" };
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
export function resultTone(endReason: EndReason | string | undefined, violationBy?: ViolationBy): "deal" | "walk" {
  return resultLabel(endReason, violationBy).tone === "deal" ? "deal" : "walk";
}

/** ZOPA KPI label: the engine only logs whether it was empty. */
export function zopaKpi(zopaEmpty: boolean): string {
  return zopaEmpty ? "Empty" : "Open";
}

/**
 * Label for the Runs table "Type" column: raw `RunKind` values never reach the UI (INBOX §1).
 */
export function runKindLabel(kind: RunKind): string {
  switch (kind) {
    case "arena":
      return "Arena run";
    case "promotion":
      return "Promotion";
    case "tournament":
      return "Tournament run";
    default:
      return kind;
  }
}

/**
 * English, local-time formatting of a logged ISO date (e.g. "2026-10-01T09:42:00.000Z" ->
 * "Oct 1, 2026 09:42"), used by the Runs table "Date" column. No value is computed here, only
 * formatted; an unparsable date falls back to "not logged".
 */
export function formatRunDate(iso: string | null): string {
  if (!iso) return "not logged";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "not logged";
  const month = d.toLocaleString("en-US", { month: "short" });
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${month} ${d.getDate()}, ${d.getFullYear()} ${hh}:${mm}`;
}

/** English label for the logged `role` ("buyer"/"seller"), used in Filters (INBOX §2). */
export function roleLabel(role: string): string {
  return role === "buyer" ? "Buyer" : role === "seller" ? "Seller" : role;
}

/** Engine params portion of the `.nr-cfg` config line, shared by Matches and the replay headers (M1/A2). */
export function configParamsLine(params: Summary["config"]["params"] | undefined): string {
  if (!params) return "not logged";
  return `β=${params.beta} · openingMargin ${params.openingMargin} · acceptMargin ${params.acceptMargin} · acTimeThreshold ${params.acTimeThreshold} · noise ${params.noise} · horizon ${params.defaultHorizon}`;
}

/**
 * Full `.nr-cfg` config line for a single match replay header (A2, d:93): engine params, persona
 * and provider, each "not logged" on its own when the run/trace doesn't carry it.
 */
export function matchConfigLine(params: Summary["config"]["params"] | undefined, persona: string | null, provider: string | null): string {
  return [configParamsLine(params), persona ? `persona ${persona}` : "persona not logged", provider ? `LLM_PROVIDER ${provider}` : "LLM_PROVIDER not logged"].join(" · ");
}
