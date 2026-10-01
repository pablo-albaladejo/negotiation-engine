import { randomUUID } from "node:crypto";
import type { AgentCard, Message, Part } from "@a2a-js/sdk";
import { AgentEvent, DefaultRequestHandler, InMemoryTaskStore, JsonRpcTransportHandler, ServerCallContext, type AgentExecutor } from "@a2a-js/sdk/server";
import { Hono } from "hono";
import type { Brain } from "../pipeline/pipeline.js";
import { silentLogger } from "../pipeline/box.js";
import { createCanonicalHandler, type AdapterOptions, type AdapterResult, type RingAdapter } from "./adapter.js";
import { ProtocolError, type ProtocolErrorBody, type TurnOutput } from "./schemas.js";

/**
 * Spike A2A (tarea 9.5): `@a2a-js/sdk` 1.3 (A2A v1.0) sin Express. `JsonRpcTransportHandler` es
 * independiente del framework y se monta en Hono. Contrato del spike: el mensaje del cliente lleva
 * el turno canónico en una parte `data`; la respuesta es un mensaje con la salida canónica en una
 * parte `data` y su texto en una parte `text`. La traducción de un ring A2A de solo texto
 * (contextId → sesión, ronda) queda para el adaptador completo (17.1) o el protocolo real (10.x).
 */
export interface A2AOptions extends AdapterOptions {
  /** URL pública del endpoint JSON-RPC que se anuncia en la tarjeta. */
  url?: string;
  name?: string;
  version?: string;
}

export function agentCard(options: Pick<A2AOptions, "url" | "name" | "version">): AgentCard {
  return {
    name: options.name ?? "negotiation-ring",
    description: "Agente negociador del Negotiation Ring: un turno de negociación por mensaje.",
    version: options.version ?? "0.1.0",
    supportedInterfaces: [{ url: options.url ?? "http://localhost:8787/a2a", protocolBinding: "JSONRPC", protocolVersion: "1.0", tenant: "" }],
    provider: undefined,
    capabilities: { streaming: false, pushNotifications: false, extensions: [], extendedAgentCard: false },
    securitySchemes: {},
    securityRequirements: [],
    defaultInputModes: ["application/json"],
    defaultOutputModes: ["application/json", "text/plain"],
    skills: [
      {
        id: "negotiate_turn",
        name: "negotiate_turn",
        description: "Recibe el turno canónico del ring y devuelve la respuesta canónica.",
        tags: ["negotiation"],
        examples: [],
        inputModes: ["application/json"],
        outputModes: ["application/json"],
        securityRequirements: [],
      },
    ],
    signatures: [],
  } as AgentCard;
}

function dataPart(value: unknown): Part {
  return { content: { $case: "data", value }, metadata: undefined, filename: "", mediaType: "application/json" } as Part;
}

function textPart(value: string): Part {
  return { content: { $case: "text", value }, metadata: undefined, filename: "", mediaType: "text/plain" } as Part;
}

function reply(contextId: string, parts: Part[]): Message {
  return { messageId: randomUUID(), contextId, taskId: "", role: 2, parts, metadata: undefined, extensions: [], referenceTaskIds: [] } as unknown as Message;
}

/** App Hono con la tarjeta de agente y el endpoint JSON-RPC de A2A. */
export function createA2AApp(brain: Brain, options: A2AOptions): Hono {
  const logger = options.logger ?? silentLogger;
  const handle = createCanonicalHandler(brain, options);
  const executor: AgentExecutor = {
    async execute(ctx, bus) {
      const part = ctx.userMessage.parts.find((p) => p.content?.$case === "data");
      const text = ctx.userMessage.parts.find((p) => p.content?.$case === "text");
      let result: AdapterResult;
      if (part?.content?.$case === "data") result = await handle(part.content.value);
      else if (text?.content?.$case === "text") result = await handle(textTurn(ctx.contextId, text.content.value));
      else result = { status: "protocol_error", error: new ProtocolError("Falta la parte data con el turno canónico o una parte text").toBody() };
      const parts = result.status === "ok" ? [dataPart(result.output), textPart(result.output.text)] : [dataPart(result.error)];
      bus.publish(AgentEvent.message(reply(ctx.contextId, parts)));
      bus.finished();
    },
    async cancelTask() {},
  };
  // Ring A2A de solo texto (provisional hasta el protocolo real, 10.x): contextId → sesión y ronda por contexto.
  const rounds = new Map<string, number>();
  function textTurn(contextId: string, value: string) {
    const round = (rounds.get(contextId) ?? 0) + 1;
    rounds.set(contextId, round);
    return { sessionId: contextId, round, rivalAction: round === 1 ? "message" : "offer", text: value };
  }
  const card = agentCard(options);
  const rpc = new JsonRpcTransportHandler(new DefaultRequestHandler(card, new InMemoryTaskStore(), executor));
  const app = new Hono();

  app.get("/.well-known/agent-card.json", (c) => c.json(card));
  app.post("/a2a", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400);
    }
    const response = await rpc.handle(body as Record<string, unknown>, new ServerCallContext());
    if (Symbol.asyncIterator in (response as object)) {
      logger.warn("a2a_streaming_unsupported");
      return c.json({ jsonrpc: "2.0", id: null, error: { code: -32004, message: "Streaming no soportado" } }, 400);
    }
    return c.json(response as object);
  });
  return app;
}

/** Petición JSON-RPC `SendMessage` con el turno canónico como parte `data`. */
export function sendMessageRequest(turn: unknown, id: number | string = 1): Record<string, unknown> {
  return { jsonrpc: "2.0", id, method: "SendMessage", params: { message: { messageId: randomUUID(), role: "ROLE_USER", parts: [{ data: turn }] } } };
}

type A2AFetch = (path: string, init: RequestInit) => Promise<Response>;

/** Cliente A2A mínimo: `SendMessage` con el turno canónico y lectura de la parte `data` de la respuesta. */
export function createA2AClient(post: A2AFetch) {
  let id = 0;
  return async (raw: unknown): Promise<AdapterResult> => {
    const res = await post("/a2a", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sendMessageRequest(raw, ++id)) });
    const body = (await res.json()) as { result?: { message?: { parts?: { data?: unknown }[] } }; error?: { message: string } };
    const data = body.result?.message?.parts?.find((p) => p.data !== undefined)?.data as { error?: unknown } | undefined;
    if (!data) throw new Error(`respuesta A2A sin datos: ${body.error?.message ?? res.status}`);
    return data.error ? { status: "protocol_error", error: data as ProtocolErrorBody } : { status: "ok", output: data as TurnOutput };
  };
}

/** Vista `RingAdapter` de la app A2A (batería común de contrato). */
export function a2aAdapterFromApp(app: Hono): RingAdapter {
  const call = createA2AClient(async (path, init) => app.request(path, init));
  return { name: "a2a-jsonrpc", handle: call };
}
