import type { Explain } from "../../../src/engine/engine.js";
import type { TraceHeader, TraceLine } from "../../../src/pipeline/trace.js";

export type Offer = Record<string, number>;
type BoxLine = Exclude<TraceLine, TraceHeader>;

/** Panel "Engine decision this round": registros de una ronda tal como se escribieron. */
export interface RoundPanel {
  round: number;
  decision: { action: string; rule: string; offer: Offer | null } | null;
  /** `null` en trazas sin `explain` (v1): el panel muestra "not logged" y no hay curva. */
  explain: Explain | null;
  parser: { intent: string; injectionSuspected: boolean } | null;
  /** Salida saneada del validador (solo longitudes y banderas). */
  validator: Record<string, unknown> | null;
  leak: boolean | null;
  /** Nuestro mensaje salió por plantilla (registro `template` con `fallback`). */
  template: boolean;
  /** Texto crudo del rival (registro local `rivalText`); se pinta solo como texto. */
  rivalText: string | null;
  ourText: string | null;
  ourOffer: Offer | null;
  /** Oferta del rival enlazada este turno (registro `binding` con `kind: "offer"`). */
  rivalOffer: Offer | null;
  /** Fin de partida registrado este turno (`binding` con `kind: "agreement" | "walk"`); `null` el resto de turnos. */
  outcome: { kind: "agreement" | "walk"; offer: Offer | null } | null;
  boxes: { box: string; result: string; latencyMs: number }[];
}

const obj = (value: unknown): Record<string, unknown> | null => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null);

export function splitTrace(trace: readonly TraceLine[]): { header: TraceHeader | null; records: BoxLine[] } {
  const header = (trace.find((l) => l.kind === "header") as TraceHeader | undefined) ?? null;
  return { header, records: trace.filter((l): l is BoxLine => l.kind === "box") };
}

function panel(round: number, records: readonly BoxLine[]): RoundPanel {
  const out = (box: string, result?: string) => obj(records.find((r) => r.box === box && (result === undefined || r.result === result))?.output);
  const decided = out("engine", "ok") ?? out("emergency");
  const parser = out("parser");
  const leak = out("leak");
  const output = out("output");
  const binding = out("binding");
  return {
    round,
    decision: decided
      ? { action: String(decided.action), rule: String(decided.rule), offer: (decided.offer as Offer | undefined) ?? null }
      : null,
    explain: (decided?.explain as Explain | undefined) ?? null,
    parser: parser ? { intent: String(parser.intent), injectionSuspected: parser.injectionSuspected === true } : null,
    validator: out("validator"),
    leak: leak && typeof leak.leak === "boolean" ? leak.leak : null,
    template: records.some((r) => r.box === "template" && r.result === "fallback"),
    rivalText: typeof out("rivalText")?.text === "string" ? (out("rivalText")!.text as string) : null,
    ourText: typeof output?.text === "string" ? output.text : null,
    ourOffer: (output?.offer as Offer | undefined) ?? null,
    rivalOffer: binding?.kind === "offer" ? (binding.offer as Offer) : null,
    outcome:
      binding?.kind === "agreement"
        ? { kind: "agreement", offer: (binding.offer as Offer | undefined) ?? null }
        : binding?.kind === "walk"
          ? { kind: "walk", offer: null }
          : null,
    boxes: records.map((r) => ({ box: r.box, result: r.result, latencyMs: r.latencyMs })),
  };
}

/** Un panel por ronda registrada, en orden de ronda. */
export function roundPanels(records: readonly BoxLine[]): RoundPanel[] {
  const rounds = [...new Set(records.map((r) => r.round))].sort((a, b) => a - b);
  return rounds.map((round) => panel(round, records.filter((r) => r.round === round)));
}

/** Curva objetivo y estimación de reserva del rival: solo rondas con `explain` registrado. */
export function explainSeries(
  panels: readonly RoundPanel[],
): { round: number; target: number; targetOffer: Offer | null; uOffer: number; uRival: number | null; rivalReserveEstimate: Offer }[] {
  return panels.flatMap((p) =>
    p.explain
      ? [
          {
            round: p.round,
            target: p.explain.target,
            targetOffer: p.explain.targetOffer,
            uOffer: p.explain.uOffer,
            uRival: p.explain.uRival,
            rivalReserveEstimate: p.explain.rivalReserveEstimate,
          },
        ]
      : [],
  );
}

/**
 * Utilidad (para nosotros) del acuerdo cerrado, derivada de quién cerró (X1): si el rival aceptó
 * nuestra última oferta (`decision.rule === "rival-accepted"`), la utilidad es el `uOffer` de la
 * ronda en la que hicimos esa oferta (la ronda anterior); si fuimos nosotros quienes aceptamos la
 * oferta del rival, es el `uRival` de esa misma ronda (ya calculado sobre la oferta aceptada).
 * `null` ("not logged") si no hay ninguna ronda con `decision.action === "accept"` o si a la ronda
 * relevante le falta `explain`. No distingue un "walk" (sin acuerdo): eso lo decide quien llama,
 * que ya conoce el desenlace de la sesión.
 */
export function dealUtility(panels: readonly RoundPanel[]): number | null {
  const accepted = panels
    .map((p, i) => ({ p, i }))
    .reverse()
    .find(({ p }) => p.decision?.action === "accept");
  if (!accepted) return null;
  const { p, i } = accepted;
  if (p.decision!.rule === "rival-accepted") return panels[i - 1]?.explain?.uOffer ?? null;
  return p.explain?.uRival ?? null;
}

/**
 * Acceptance rule logged for the round that closed the deal (X3), e.g. `"ac-time"`; `null` when the
 * rival accepted our offer (no acceptance rule of ours applied -- it's just a confirmed deal) or
 * when no `decision.action === "accept"` was logged.
 */
export function dealRule(panels: readonly RoundPanel[]): string | null {
  const rule = [...panels].reverse().find((p) => p.decision?.action === "accept")?.decision?.rule ?? null;
  return rule && rule !== "rival-accepted" ? rule : null;
}

/** Registros `protocol` (rival que rompe el protocolo): solo rutas y códigos de Zod, tal como se escribieron. */
export function protocolBreaks(records: readonly BoxLine[]): { round: number; issues: { path: string; code: string }[] }[] {
  return records.flatMap((r) => {
    if (r.box !== "protocol") return [];
    const issues = obj(r.output)?.issues;
    if (!Array.isArray(issues)) return [{ round: r.round, issues: [] }];
    return [{ round: r.round, issues: issues.flatMap((i) => (obj(i) && typeof obj(i)!.path === "string" && typeof obj(i)!.code === "string" ? [{ path: obj(i)!.path as string, code: obj(i)!.code as string }] : [])) }];
  });
}

/** `provider` del último registro que lo lleva (LLM_PROVIDER del agente); `null` si no se registró. */
export function loggedProvider(records: readonly BoxLine[]): string | null {
  return [...records].reverse().find((r) => typeof r.provider === "string")?.provider ?? null;
}
