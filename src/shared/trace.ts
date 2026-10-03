import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { PatienceSummary } from "../dealers/negotiation/patience.js";
import type { ThreadSummary } from "../dealers/history/thread-log.js";

/** Una línea JSONL por decisión: lo que el visor necesita para reconstruir cada hilo. Sin clave. */
export interface TraceRecord {
  ts: string;
  tick: number;
  dealer: string;
  dryRun: boolean;
  action: "open" | "accept" | "counter" | "hold" | "close" | "wait" | "idle" | "outcome" | "error" | "blocked";
  thread?: number;
  target?: string;
  side?: "buy" | "sell";
  herPrice?: number;
  herOpening?: number;
  herFinal?: boolean;
  ourPrice?: number;
  /** Reserva privada usada (solo en la traza local; nunca en un mensaje al dealer). */
  reservation?: number;
  effectiveReservation?: number;
  rule?: string;
  text?: string;
  status?: string;
  closedReason?: string;
  settledPrice?: number;
  /** `welcome-first-deal`: su apertura, medida como su límite para este dealer y esta banda (`target`). */
  measuredLimit?: number;
  /**
   * Aceptamos su apertura sin haber hecho oferta: el servidor lo cuenta como took_opening, no como trato negociado
   * (no entra en el share medio; personas.md § 9).
   */
  tookOpening?: boolean;
  error?: string;
  /** Al cerrar/aceptar/terminar: mensajes nuestros, respuestas suyas, tics hasta su final y respuesta a cada paso. */
  patience?: PatienceSummary;
  /** Al terminar una conversación: cartas, copias antes/después, tratos con el dealer en la hora, apertura/final y paciencia. */
  summary?: ThreadSummary;
}

export interface TraceSink {
  write(record: TraceRecord): void;
}

/** `results/bazaar-live/<fecha>/decisions.jsonl` + `thread-<id>.jsonl` por hilo. */
export class FileTrace implements TraceSink {
  constructor(readonly dir: string) {
    mkdirSync(dir, { recursive: true });
  }

  write(record: TraceRecord): void {
    const line = `${JSON.stringify(record)}\n`;
    appendFileSync(join(this.dir, "decisions.jsonl"), line);
    if (record.thread !== undefined) appendFileSync(join(this.dir, `thread-${record.thread}.jsonl`), line);
  }
}

export function liveTraceDir(root: string, now: Date = new Date()): string {
  return join(root, "results", "bazaar-live", now.toISOString().slice(0, 10));
}
