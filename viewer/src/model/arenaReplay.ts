import type { TranscriptLine } from "../../../src/arena/results-schema.js";
import type { TraceLine } from "../../../src/pipeline/trace.js";
import { explainSeries, roundPanels, splitTrace, type Offer, type RoundPanel } from "./rounds.js";

export interface ArenaReplayModel {
  game: {
    gameId: string;
    scenarioId: string;
    rival: string;
    role: TranscriptLine["role"];
    mode: TranscriptLine["mode"];
    seed: number;
    endReason: TranscriptLine["endReason"];
    rounds: number;
    roundLimit: number | null;
    agreement: Offer | null;
    agreedBy: "agent" | "rival" | null;
    surplusShare: number | null;
    zopaEmpty: boolean;
  };
  /** Reservas de ambas partes (transcript v2, solo arena); `null` en v1 ("not logged"). */
  reserves: { ours: Offer; rival: Offer } | null;
  offers: { ours: { round: number; offer: Offer }[]; rival: { round: number; offer: Offer }[] };
  chat: { round: number; from: "agent" | "rival"; action: string; text: string; offer: Offer | null }[];
  /** Sin traza (`--no-traces`, `--agent-url`): gráfico y chat desde el transcript, panel "no trace". */
  hasTrace: boolean;
  rounds: RoundPanel[] | null;
  /** Curva objetivo, utilidades y estimación de reserva del rival: solo rondas con `explain`. */
  explain: ReturnType<typeof explainSeries>;
}

/** P3: una línea de `transcripts.jsonl` y, si existe, su traza (`traces/<gameId>.jsonl`). */
export function arenaReplayModel(line: TranscriptLine, trace: readonly TraceLine[] | null): ArenaReplayModel {
  let rounds: RoundPanel[] | null = null;
  if (trace) {
    const { header, records } = splitTrace(trace);
    if (header && header.mode !== "arena") throw new Error(`traza de ${header.sessionId}: modo ${header.mode}, se esperaba arena`);
    rounds = roundPanels(records);
  }
  const moves = (from: "agent" | "rival") =>
    line.transcript.flatMap((e) => (e.from === from && e.offer ? [{ round: e.round, offer: e.offer }] : []));
  return {
    game: {
      gameId: line.gameId,
      scenarioId: line.scenarioId,
      rival: line.rival,
      role: line.role,
      mode: line.mode,
      seed: line.seed,
      endReason: line.endReason,
      rounds: line.rounds,
      roundLimit: line.roundLimit ?? null,
      agreement: line.agreement ?? null,
      agreedBy: line.agreedBy ?? null,
      surplusShare: line.metrics.surplusShare,
      zopaEmpty: line.metrics.zopaEmpty,
    },
    reserves: line.reserves ?? null,
    offers: { ours: moves("agent"), rival: moves("rival") },
    chat: line.transcript.map((e) => ({ round: e.round, from: e.from, action: e.action, text: e.text, offer: e.offer ?? null })),
    hasTrace: rounds !== null,
    rounds,
    explain: rounds ? explainSeries(rounds) : [],
  };
}
