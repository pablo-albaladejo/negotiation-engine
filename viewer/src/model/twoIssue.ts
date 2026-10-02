import type { TranscriptLine } from "../../../src/arena/results-schema.js";
import type { TraceLine } from "../../../src/pipeline/trace.js";
import { arenaReplayModel, type ArenaReplayModel } from "./arenaReplay.js";
import { splitTrace, type Offer } from "./rounds.js";

/** Issue tal como lo registra la entrada del registro `engine` (dirección declarada desde el comprador). */
export interface LoggedIssue {
  name: string;
  min: number;
  max: number;
  direction: "higher-better" | "lower-better";
}

export interface PlanePoint {
  round: number;
  x: number;
  y: number;
}

export interface TwoIssueModel {
  game: ArenaReplayModel["game"];
  /** `configVersion` de la cabecera de la traza; `null` sin traza ("not logged"). */
  configVersion: number | null;
  /** Eje Y = primer issue, eje X = segundo (como en el diseño: descuento × día). */
  axes: { x: { name: string; issue: LoggedIssue | null }; y: { name: string; issue: LoggedIssue | null } };
  /** Mandato de la cabecera de arena; `null` sin traza. `region` son los límites de cada issue que cumple la reserva. */
  mandate: { role: "buyer" | "seller"; reservation: Offer; region: { x: [number, number]; y: [number, number] } | null } | null;
  offers: { ours: PlanePoint[]; rival: PlanePoint[] };
  /** Utilidades registradas por el motor (`explain.uOffer`, `explain.uRival`); vacío sin `explain`. */
  utilities: { round: number; uOffer: number; uRival: number | null }[];
  /** Tabla por ronda de la traza; `null` sin traza. Utilidad `null` = "not logged". */
  rows: { round: number; ours: Offer | null; uOffer: number | null; rival: Offer | null; uRival: number | null }[] | null;
  hasTrace: boolean;
  hasExplain: boolean;
}

/** Nombres de issue de las ofertas del transcript (en orden de aparición). */
export function offerIssues(line: TranscriptLine): string[] {
  const names = new Set<string>();
  for (const e of line.transcript) for (const k of Object.keys(e.offer ?? {})) names.add(k);
  return [...names];
}

/** P5 solo aplica a partidas con exactamente 2 issues. */
export const isTwoIssue = (line: TranscriptLine): boolean => offerIssues(line).length === 2;

function loggedIssues(trace: readonly TraceLine[] | null): LoggedIssue[] | null {
  if (!trace) return null;
  const engine = splitTrace(trace).records.find((r) => r.box === "engine");
  const input = engine?.input as { issues?: unknown } | undefined;
  return Array.isArray(input?.issues) ? (input.issues as LoggedIssue[]) : null;
}

/** Tramo de un issue que cumple la reserva: de la reserva al extremo bueno (el vendedor invierte la dirección). */
function acceptable(issue: LoggedIssue, reserve: number, role: "buyer" | "seller"): [number, number] {
  const higherBetter = (issue.direction === "higher-better") === (role === "buyer");
  return higherBetter ? [reserve, issue.max] : [issue.min, reserve];
}

/** P5: una línea de `transcripts.jsonl` de 2 issues y, si existe, su traza. */
export function twoIssueModel(line: TranscriptLine, trace: readonly TraceLine[] | null): TwoIssueModel {
  const base = arenaReplayModel(line, trace);
  const issues = loggedIssues(trace);
  const [yName, xName] = issues && issues.length === 2 ? [issues[0]!.name, issues[1]!.name] : offerIssues(line);
  if (yName === undefined || xName === undefined) throw new Error(`${line.gameId}: P5 necesita 2 issues`);
  const issue = (name: string) => issues?.find((i) => i.name === name) ?? null;
  const toPoints = (entries: { round: number; offer: Offer }[]): PlanePoint[] =>
    entries.flatMap(({ round, offer }) => (offer[xName] !== undefined && offer[yName] !== undefined ? [{ round, x: offer[xName]!, y: offer[yName]! }] : []));

  const header = trace ? splitTrace(trace).header : null;
  let mandate: TwoIssueModel["mandate"] = null;
  if (header && header.mode === "arena") {
    const { role, reservation } = header.mandate;
    const xi = issue(xName);
    const yi = issue(yName);
    const xr = reservation[xName];
    const yr = reservation[yName];
    const region = xi && yi && xr !== undefined && yr !== undefined ? { x: acceptable(xi, xr, role), y: acceptable(yi, yr, role) } : null;
    mandate = { role, reservation, region };
  }

  return {
    game: base.game,
    configVersion: header?.configVersion ?? null,
    axes: { x: { name: xName, issue: issue(xName) }, y: { name: yName, issue: issue(yName) } },
    mandate,
    offers: { ours: toPoints(base.offers.ours), rival: toPoints(base.offers.rival) },
    utilities: base.explain.map((e) => ({ round: e.round, uOffer: e.uOffer, uRival: e.uRival })),
    rows:
      base.rounds?.map((p) => ({
        round: p.round,
        ours: p.decision?.offer ?? p.ourOffer,
        uOffer: p.explain?.uOffer ?? null,
        rival: p.rivalOffer,
        uRival: p.explain?.uRival ?? null,
      })) ?? null,
    hasTrace: base.hasTrace,
    hasExplain: base.explain.length > 0,
  };
}
