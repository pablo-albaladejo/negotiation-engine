import pino from "pino";
import type { Logger } from "./box.js";

/**
 * Rutas que `redact` censura aunque alguien las loguee por error. La redacción de pino es por
 * rutas: el test de barrido (test/pipeline/log.test.ts) busca además la reserva en todos los
 * valores de logs y trazas, en todas las formas del normalizador.
 */
export const REDACT_PATHS = [
  "mandate",
  "reservation",
  "config",
  "*.mandate",
  "*.reservation",
  "*.config",
  "*.*.mandate",
  "*.*.reservation",
];

type Level = pino.Level;

export interface PinoLoggerOptions {
  level?: Level;
  /** Destino (por defecto stderr). */
  destination?: pino.DestinationStream;
}

/** Logger JSON estructurado con pino y `redact` del mandato. */
export function createPinoLogger(options: PinoLoggerOptions = {}): Logger {
  const log = pino(
    { level: options.level ?? "info", base: null, redact: { paths: REDACT_PATHS, censor: "[redactado]" } },
    options.destination ?? pino.destination(2),
  );
  const emit = (level: Level) => (event: string, data?: Record<string, unknown>) => log[level]({ event, ...data });
  return { info: emit("info"), warn: emit("warn"), error: emit("error"), debug: emit("debug"), trace: emit("trace") };
}

export function levelFromEnv(value = process.env.LOG_LEVEL): Level {
  const levels: Level[] = ["fatal", "error", "warn", "info", "debug", "trace"];
  return levels.includes(value as Level) ? (value as Level) : "info";
}
