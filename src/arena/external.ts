import { createHttpAgentClient, type FetchLike } from "../protocol/http.js";
import type { GameSetup, Participant, PlayerSession } from "./participant.js";

export interface HttpParticipantOptions {
  name: string;
  baseUrl: string;
  kind?: "agent" | "external";
  timeoutMs?: number;
  headers?: Record<string, string>;
  fetch?: FetchLike;
}

/**
 * Participante externo por el lado cliente del adaptador HTTP JSON (`POST /turn`): un agente
 * o bot servido en otra URL. Su mandato lo fija el propio servidor (su escenario), no la arena.
 * Cualquier fallo de red, tiempo o contrato se propaga y la arena lo registra como error del rival.
 * Los agentes externos pertenecen al conjunto reservado.
 */
export function createHttpParticipant(options: HttpParticipantOptions): Participant {
  return {
    name: options.name,
    kind: options.kind ?? "external",
    pool: "heldOut",
    start(setup: GameSetup): PlayerSession {
      const client = createHttpAgentClient({
        baseUrl: options.baseUrl,
        issueNames: setup.issues.map((i) => i.name),
        timeoutMs: options.timeoutMs ?? 5_000,
        ...(options.headers ? { headers: options.headers } : {}),
        ...(options.fetch ? { fetch: options.fetch } : {}),
      });
      return { respond: (turn) => client.turn(turn) };
    },
  };
}
