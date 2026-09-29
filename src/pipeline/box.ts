import { z } from "zod";
import { createRng, type Rng } from "../engine/rng.js";

/** Logger mínimo; nunca recibe el mandato ni la reserva. */
export interface Logger {
  info(event: string, data?: Record<string, unknown>): void;
  warn(event: string, data?: Record<string, unknown>): void;
  error(event: string, data?: Record<string, unknown>): void;
}

export const silentLogger: Logger = { info() {}, warn() {}, error() {} };

export type BoxResult = "ok" | "retry" | "fallback" | "error";

export interface TraceRecord {
  sessionId: string;
  round: number;
  box: string;
  input: unknown;
  output: unknown;
  result: BoxResult;
  latencyMs: number;
  seed?: number;
  configVersion?: number;
  provider?: string;
  error?: string;
}

export interface TraceSink {
  write(record: TraceRecord): void;
}

/** Traza en memoria (tests y arena); el escritor JSONL está en trace.ts. */
export class MemoryTrace implements TraceSink {
  readonly records: TraceRecord[] = [];
  write(record: TraceRecord): void {
    this.records.push(record);
  }
}

export interface BoxContext {
  rng: Rng;
  /** Reloj inyectado en milisegundos. */
  now: () => number;
  logger: Logger;
  trace: TraceSink;
}

export function createContext(overrides: Partial<BoxContext> = {}): BoxContext {
  return {
    rng: overrides.rng ?? createRng(0),
    now: overrides.now ?? (() => Date.now()),
    logger: overrides.logger ?? silentLogger,
    trace: overrides.trace ?? new MemoryTrace(),
  };
}

/** Caja con contrato: entrada y salida validadas con Zod, ejecutable de forma aislada. */
export interface Box<I, O> {
  name: string;
  input: z.ZodType<I>;
  output: z.ZodType<O>;
  run(input: I, ctx: BoxContext): O | Promise<O>;
}

export class BoxContractError extends Error {
  override name = "BoxContractError";
  constructor(
    readonly box: string,
    readonly stage: "input" | "output",
    readonly issues: z.core.$ZodIssue[],
  ) {
    const where = issues.map((i) => `${i.path.join(".") || "(raíz)"}: ${i.message}`).join("; ");
    super(`Caja ${box}: ${stage === "input" ? "entrada" : "salida"} inválida → ${where}`);
  }

  /** Rutas de los campos que no cumplen el contrato. */
  get paths(): string[] {
    return this.issues.map((i) => i.path.join("."));
  }
}

export async function runBox<I, O>(box: Box<I, O>, input: unknown, ctx: BoxContext): Promise<O> {
  const parsedInput = box.input.safeParse(input);
  if (!parsedInput.success) throw new BoxContractError(box.name, "input", parsedInput.error.issues);
  const raw = await box.run(parsedInput.data, ctx);
  const parsedOutput = box.output.safeParse(raw);
  if (!parsedOutput.success) throw new BoxContractError(box.name, "output", parsedOutput.error.issues);
  return parsedOutput.data;
}

export function defineBox<I, O>(box: Box<I, O>): Box<I, O> {
  return box;
}

// El registro guarda cajas de tipos heterogéneos.
type AnyBox = Box<any, any>;

const registry = new Map<string, AnyBox>();

export function registerBox(box: AnyBox): void {
  if (registry.has(box.name) && registry.get(box.name) !== box) {
    throw new Error(`Caja ya registrada: ${box.name}`);
  }
  registry.set(box.name, box);
}

export function getBox(name: string): AnyBox | undefined {
  return registry.get(name);
}

export function listBoxes(): string[] {
  return [...registry.keys()].sort();
}

/** Caja trivial para probar el contrato y, más adelante, `pnpm box`. */
export const echoBox = defineBox({
  name: "echo",
  input: z.object({ message: z.string() }).strict(),
  output: z.object({ message: z.string() }).strict(),
  run: (input) => ({ message: input.message }),
});

registerBox(echoBox);
