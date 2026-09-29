import { Hono } from "hono";
import { createProtocolSchemas, type ProtocolErrorBody, type TurnOutput } from "./schemas.js";

/**
 * Ring simulado para el modo cliente (tests y humo): sirve `GET /next`, `POST /respond`,
 * `POST /error` con una cola de turnos canónicos (o generados por un rival) y valida cada respuesta.
 */
export interface SimulatedRingOptions {
  issueNames: readonly string[];
  /** Turno siguiente a partir de la última respuesta; null para terminar. */
  nextTurn: (round: number, last: TurnOutput | undefined) => unknown | null;
}

export interface SimulatedRing {
  app: Hono;
  responses: TurnOutput[];
  invalidResponses: unknown[];
  errors: ProtocolErrorBody[];
  readonly done: boolean;
}

export function createSimulatedRing(options: SimulatedRingOptions): SimulatedRing {
  const schemas = createProtocolSchemas(options.issueNames);
  const state = {
    round: 0,
    pending: false,
    done: false,
    responses: [] as TurnOutput[],
    invalidResponses: [] as unknown[],
    errors: [] as ProtocolErrorBody[],
  };
  const app = new Hono();

  app.get("/next", (c) => {
    if (state.done) return c.body(null, 410);
    if (state.pending) return c.body(null, 204);
    const turn = options.nextTurn(state.round + 1, state.responses.at(-1));
    if (turn === null) {
      state.done = true;
      return c.body(null, 410);
    }
    state.round++;
    state.pending = true;
    return c.json(turn as object);
  });

  app.post("/respond", async (c) => {
    const body = (await c.req.json().catch(() => null)) as unknown;
    state.pending = false;
    const parsed = schemas.turnOutput.safeParse(body);
    if (!parsed.success) {
      state.invalidResponses.push(body);
      return c.json({ ok: false }, 400);
    }
    state.responses.push(parsed.data);
    if (parsed.data.action !== "counter") state.done = true;
    return c.json({ ok: true });
  });

  app.post("/error", async (c) => {
    state.errors.push((await c.req.json().catch(() => null)) as ProtocolErrorBody);
    state.pending = false;
    return c.json({ ok: true });
  });

  return {
    app,
    responses: state.responses,
    invalidResponses: state.invalidResponses,
    errors: state.errors,
    get done() {
      return state.done;
    },
  };
}

/** Rival de sparring sencillo: vendedor que concede linealmente en `pct` y acepta si le ofrecemos ≤ su reserva. */
export function linearSellerRival(options: { sessionId: string; rounds: number; reservation: number; start?: number; step?: number }) {
  const start = options.start ?? 1;
  const step = options.step ?? 0.5;
  return (round: number, last: TurnOutput | undefined): unknown | null => {
    if (round > options.rounds) return null;
    const base = { sessionId: options.sessionId, round, roundLimit: options.rounds };
    if (last && last.action === "counter" && last.offer.pct! <= options.reservation) {
      return { ...base, rivalAction: "accept", text: "De acuerdo." };
    }
    const pct = Math.min(options.reservation, start + step * (round - 1));
    return { ...base, rivalAction: "offer", rivalOffer: { pct }, text: `Puedo ofrecer un ${pct} %.` };
  };
}
