import { createHttpAgentClient, type FetchLike } from "../protocol/http.js";
import type { AdapterResult } from "../protocol/adapter.js";
import { createA2AClient } from "../protocol/a2a.js";
import { createMcpClient, type McpFetch } from "../protocol/mcp.js";
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

function sessionFrom(call: (turn: unknown) => Promise<AdapterResult>, close?: () => Promise<void>): PlayerSession {
  return {
    async respond(turn) {
      const result = await call(turn);
      if (result.status !== "ok") throw new Error(`error de protocolo del rival: ${result.error.error.message}`);
      return result.output;
    },
    ...(close ? { close } : {}),
  };
}

/** Agente externo por A2A (JSON-RPC `SendMessage` en `<baseUrl>/a2a`); conjunto reservado. */
export function createA2AParticipant(options: { name: string; baseUrl: string; kind?: "agent" | "external"; timeoutMs?: number; fetch?: FetchLike }): Participant {
  const doFetch = options.fetch ?? ((url: string, init?: RequestInit) => fetch(url, init));
  return {
    name: options.name,
    kind: options.kind ?? "external",
    pool: "heldOut",
    start(): PlayerSession {
      const call = createA2AClient((path, init) => doFetch(new URL(path, options.baseUrl).toString(), { ...init, signal: AbortSignal.timeout(options.timeoutMs ?? 5000) }));
      return sessionFrom(call);
    },
  };
}

/** Agente externo por MCP (`negotiate_turn` sobre Streamable HTTP en `<baseUrl>/mcp`); conjunto reservado. */
export function createMcpParticipant(options: { name: string; baseUrl: string; kind?: "agent" | "external"; timeoutMs?: number; fetch?: McpFetch }): Participant {
  return {
    name: options.name,
    kind: options.kind ?? "external",
    pool: "heldOut",
    start(): PlayerSession {
      const client = createMcpClient({ baseUrl: options.baseUrl, ...(options.fetch ? { fetch: options.fetch } : {}), timeoutMs: options.timeoutMs ?? 5000 });
      return sessionFrom((turn) => client.call(turn), () => client.close());
    },
  };
}
