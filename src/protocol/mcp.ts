import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { Hono } from "hono";
import { z } from "zod";
import type { Brain } from "../pipeline/pipeline.js";
import { createCanonicalHandler, type AdapterOptions, type AdapterResult, type RingAdapter } from "./adapter.js";
import type { ProtocolErrorBody, TurnOutput } from "./schemas.js";

/**
 * Adaptador MCP: herramienta `negotiate_turn` sobre Streamable HTTP (`POST /mcp`, sin estado:
 * un servidor y un transporte por petición, respuesta JSON). Recibe el turno canónico en
 * `turn` y devuelve la salida canónica en `structuredContent.output` (o el error de protocolo
 * en `structuredContent.error` con `isError`). La validación es la del manejador común.
 */
export function createMcpServer(brain: Brain, options: AdapterOptions): McpServer {
  const handle = createCanonicalHandler(brain, options);
  const server = new McpServer({ name: "negotiation-ring", version: "0.1.0" });
  server.registerTool(
    "negotiate_turn",
    { description: "Recibe el turno canónico del ring y devuelve la respuesta canónica.", inputSchema: { turn: z.unknown() } },
    async ({ turn }) => {
      const result = await handle(turn);
      if (result.status === "ok") return { content: [{ type: "text" as const, text: result.output.text }], structuredContent: { output: result.output } };
      return { isError: true, content: [{ type: "text" as const, text: result.error.error.message }], structuredContent: { error: result.error } };
    },
  );
  return server;
}

export function createMcpApp(brain: Brain, options: AdapterOptions): Hono {
  const app = new Hono();
  app.all("/mcp", async (c) => {
    const server = createMcpServer(brain, options);
    const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
    await server.connect(transport);
    try {
      return await transport.handleRequest(c.req.raw);
    } finally {
      void server.close();
    }
  });
  return app;
}

export type McpFetch = (url: string | URL, init?: RequestInit) => Promise<Response>;

/** Cliente MCP de `negotiate_turn` (conexión perezosa y reutilizada). */
export function createMcpClient(options: { baseUrl: string; fetch?: McpFetch; timeoutMs?: number }) {
  let connected: Promise<Client> | undefined;
  const connect = () =>
    (connected ??= (async () => {
      const client = new Client({ name: "negotiation-ring-client", version: "0.1.0" });
      const transport = new StreamableHTTPClientTransport(new URL("/mcp", options.baseUrl), options.fetch ? { fetch: options.fetch } : {});
      // El SDK no está compilado con exactOptionalPropertyTypes (sessionId?: string).
      await client.connect(transport as unknown as Parameters<Client["connect"]>[0]);
      return client;
    })());
  return {
    async call(turn: unknown): Promise<AdapterResult> {
      const client = await connect();
      const res = await client.callTool({ name: "negotiate_turn", arguments: { turn } }, undefined, { timeout: options.timeoutMs ?? 5000 });
      const sc = res.structuredContent as { output?: TurnOutput; error?: ProtocolErrorBody } | undefined;
      if (sc?.output) return { status: "ok", output: sc.output };
      if (sc?.error) return { status: "protocol_error", error: sc.error };
      throw new Error("respuesta MCP sin structuredContent");
    },
    async close() {
      if (connected) await (await connected).close();
      connected = undefined;
    },
  };
}

/** Vista `RingAdapter` de la app MCP sin abrir puertos (batería común de contrato). */
export function mcpAdapterFromApp(app: Hono): RingAdapter {
  const client = createMcpClient({ baseUrl: "http://mcp.local", fetch: async (url, init) => app.request(String(url), init) });
  return { name: "mcp-streamable-http", handle: (raw) => client.call(raw) };
}
