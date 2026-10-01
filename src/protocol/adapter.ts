import type { Brain } from "../pipeline/pipeline.js";
import { silentLogger, type Logger } from "../pipeline/box.js";
import { createProtocolSchemas, ProtocolError, type ProtocolErrorBody, type TurnOutput } from "./schemas.js";

export type AdapterResult = { status: "ok"; output: TurnOutput } | { status: "protocol_error"; error: ProtocolErrorBody };

/** Modo servidor: el ring nos llama con un mensaje de su protocolo y respondemos. */
export interface RingAdapter {
  name: string;
  handle(raw: unknown): Promise<AdapterResult>;
}

export interface AdapterOptions {
  /** Issues declarados en la configuración vigente. */
  issueNames: () => readonly string[];
  logger?: Logger;
}

const LAST_RESORT = "Gracias por tu tiempo, pero así no podemos seguir. Lo dejamos aquí.";

/**
 * Núcleo común de los adaptadores: valida la entrada sin invocar al cerebro, y nunca envía una
 * salida que no cumpla el esquema (si falla, ruta de emergencia del cerebro).
 */
export function createCanonicalHandler(brain: Brain, options: AdapterOptions): (canonical: unknown) => Promise<AdapterResult> {
  const logger = options.logger ?? silentLogger;
  return async (canonical) => {
    const schemas = createProtocolSchemas(options.issueNames());
    const input = schemas.turnInput.safeParse(canonical);
    if (!input.success) {
      const error = ProtocolError.fromZod(input.error, "Turno");
      logger.warn("protocol_error", { fields: error.fields });
      return { status: "protocol_error", error: error.toBody() };
    }
    let output: unknown;
    try {
      output = await brain.turn(input.data);
    } catch (error) {
      if (error instanceof ProtocolError) return { status: "protocol_error", error: error.toBody() };
      logger.error("brain_failed", { error: (error as Error)?.message?.slice(0, 200) });
      output = brain.fallback(input.data);
    }
    const checked = schemas.turnOutput.safeParse(output);
    if (checked.success) return { status: "ok", output: checked.data };
    logger.error("invalid_output_blocked", { fields: checked.error.issues.map((i) => i.path.join(".")) });
    const fallback = schemas.turnOutput.safeParse(brain.fallback(input.data));
    if (fallback.success) return { status: "ok", output: fallback.data };
    return {
      status: "ok",
      output: { sessionId: input.data.sessionId, round: input.data.round, action: "walk", text: LAST_RESORT },
    };
  };
}

/** Adaptador en memoria: el protocolo es el contrato canónico (tests y arena en proceso). */
export function createInMemoryAdapter(brain: Brain, options: AdapterOptions): RingAdapter {
  const handle = createCanonicalHandler(brain, options);
  return { name: "in-memory", handle };
}

/** Modo cliente: nosotros conducimos el bucle pidiendo turnos al ring. */
export type RingPoll = { kind: "turn"; turn: unknown } | { kind: "wait" } | { kind: "done" };

export interface RingClient {
  next(): Promise<RingPoll>;
  respond(output: TurnOutput): Promise<void>;
  reportError(error: ProtocolErrorBody): Promise<void>;
}

export interface ClientLoopOptions {
  pollIntervalMs?: number;
  maxTurns?: number;
  /** Errores seguidos del ring antes de abandonar el bucle. */
  maxConsecutiveErrors?: number;
  logger?: Logger;
  sleep?: (ms: number) => Promise<void>;
}

export interface ClientLoopResult {
  turns: number;
  protocolErrors: number;
  ringErrors: number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Bucle de turnos por sondeo: el mismo adaptador (y pipeline) que en modo servidor. */
export async function runClientLoop(client: RingClient, adapter: RingAdapter, options: ClientLoopOptions = {}): Promise<ClientLoopResult> {
  const logger = options.logger ?? silentLogger;
  const sleep = options.sleep ?? defaultSleep;
  const result: ClientLoopResult = { turns: 0, protocolErrors: 0, ringErrors: 0 };
  let consecutiveErrors = 0;
  while (result.turns < (options.maxTurns ?? Number.POSITIVE_INFINITY)) {
    let poll: RingPoll;
    try {
      poll = await client.next();
      consecutiveErrors = 0;
    } catch (error) {
      result.ringErrors++;
      consecutiveErrors++;
      logger.warn("ring_error", { error: (error as Error)?.message?.slice(0, 200) });
      if (consecutiveErrors >= (options.maxConsecutiveErrors ?? 5)) break;
      await sleep(options.pollIntervalMs ?? 200);
      continue;
    }
    if (poll.kind === "done") break;
    if (poll.kind === "wait") {
      await sleep(options.pollIntervalMs ?? 200);
      continue;
    }
    const handled = await adapter.handle(poll.turn);
    try {
      if (handled.status === "ok") {
        await client.respond(handled.output);
        result.turns++;
      } else {
        result.protocolErrors++;
        await client.reportError(handled.error);
      }
    } catch (error) {
      result.ringErrors++;
      logger.warn("ring_error", { error: (error as Error)?.message?.slice(0, 200) });
    }
  }
  return result;
}

/** Ring en memoria para el modo cliente: entrega turnos de una cola y guarda las respuestas. */
export class InMemoryRingClient implements RingClient {
  readonly responses: TurnOutput[] = [];
  readonly errors: ProtocolErrorBody[] = [];
  readonly #queue: unknown[];

  constructor(turns: readonly unknown[]) {
    this.#queue = [...turns];
  }

  async next(): Promise<RingPoll> {
    if (this.#queue.length === 0) return { kind: "done" };
    return { kind: "turn", turn: this.#queue.shift() };
  }

  async respond(output: TurnOutput): Promise<void> {
    this.responses.push(output);
  }

  async reportError(error: ProtocolErrorBody): Promise<void> {
    this.errors.push(error);
  }
}
