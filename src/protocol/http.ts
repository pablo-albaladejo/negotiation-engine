import { timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import type { Brain } from "../pipeline/pipeline.js";
import { silentLogger } from "../pipeline/box.js";
import { createCanonicalHandler, type AdapterOptions, type RingAdapter, type RingClient, type RingPoll } from "./adapter.js";
import { createProtocolSchemas, ProtocolError, type ProtocolErrorBody, type TurnInput, type TurnOutput } from "./schemas.js";

export interface HealthInfo {
  configVersion: number;
  llmProvider: string;
}

export interface HttpServerOptions extends AdapterOptions {
  /** Solo versión de configuración y proveedor: nunca datos del mandato. */
  health: () => HealthInfo;
  /** Autenticación que exija el ring (desde el entorno, nunca en git): cabecera y valor exactos. */
  auth?: { header: string; value: string };
}

function sameSecret(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Adaptador servidor HTTP JSON genérico: `POST /turn` con el turno canónico y `GET /health`.
 * Un cuerpo malformado recibe un error de protocolo sin invocar al cerebro.
 */
export function createHttpApp(brain: Brain, options: HttpServerOptions): Hono {
  const logger = options.logger ?? silentLogger;
  const handle = createCanonicalHandler(brain, options);
  const app = new Hono();

  app.get("/health", (c) => {
    const info = options.health();
    return c.json({ status: "ok", configVersion: info.configVersion, llmProvider: info.llmProvider });
  });

  app.post("/turn", async (c) => {
    if (options.auth && !sameSecret(c.req.header(options.auth.header) ?? "", options.auth.value)) {
      logger.warn("auth_failed");
      return c.json(new ProtocolError("No autorizado").toBody(), 401);
    }
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      logger.warn("protocol_error", { reason: "json" });
      return c.json(new ProtocolError("Cuerpo JSON inválido").toBody(), 400);
    }
    const result = await handle(body);
    return result.status === "ok" ? c.json(result.output) : c.json(result.error, 400);
  });

  app.onError((error, c) => {
    logger.error("http_error", { error: error.message.slice(0, 200) });
    const body: ProtocolErrorBody = { error: { code: "protocol_error", message: "Error interno" } };
    return c.json(body, 500);
  });

  return app;
}

/** Vista `RingAdapter` del servidor HTTP (para la batería común de contrato). */
export function httpAdapterFromApp(app: Hono): RingAdapter {
  return {
    name: "http-json",
    async handle(raw) {
      const res = await app.request("/turn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(raw),
      });
      const body = (await res.json()) as unknown;
      return res.ok ? { status: "ok", output: body as TurnOutput } : { status: "protocol_error", error: body as ProtocolErrorBody };
    },
  };
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class RemoteAgentError extends Error {
  override name = "RemoteAgentError";
}

export interface HttpClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  fetch?: FetchLike;
  /** Cabeceras extra (p. ej. autenticación del ring, desde el entorno). */
  headers?: Record<string, string>;
}

async function request(options: HttpClientOptions, path: string, init: RequestInit = {}): Promise<Response> {
  const doFetch = options.fetch ?? fetch;
  try {
    return await doFetch(`${options.baseUrl.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...options.headers, ...(init.headers as Record<string, string>) },
      signal: AbortSignal.timeout(options.timeoutMs ?? 5_000),
    });
  } catch (error) {
    throw new RemoteAgentError(`Fallo de red en ${path}: ${(error as Error).message}`);
  }
}

/** Lado cliente del adaptador HTTP JSON: habla con un agente externo (o el nuestro) por `POST /turn`. */
export function createHttpAgentClient(options: HttpClientOptions & { issueNames: readonly string[] }) {
  const schemas = createProtocolSchemas(options.issueNames);
  return {
    async turn(input: TurnInput): Promise<TurnOutput> {
      const res = await request(options, "/turn", { method: "POST", body: JSON.stringify(input) });
      const body = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) throw new RemoteAgentError(`El agente respondió ${res.status}`);
      const parsed = schemas.turnOutput.safeParse(body);
      if (!parsed.success) throw new RemoteAgentError("Respuesta del agente fuera de contrato");
      return parsed.data;
    },
    async health(): Promise<unknown> {
      const res = await request(options, "/health");
      return res.json();
    },
  };
}

/**
 * `RingClient` HTTP por sondeo (nosotros conducimos): `GET /next` devuelve 200 con un turno,
 * 204 si aún no hay turno o 410 si la partida terminó; `POST /respond` y `POST /error`.
 * Rutas provisionales hasta conocer el protocolo real.
 */
export function createHttpRingClient(options: HttpClientOptions): RingClient {
  return {
    async next(): Promise<RingPoll> {
      const res = await request(options, "/next");
      if (res.status === 204) return { kind: "wait" };
      if (res.status === 410) return { kind: "done" };
      if (!res.ok) throw new RemoteAgentError(`El ring respondió ${res.status}`);
      return { kind: "turn", turn: (await res.json().catch(() => null)) as unknown };
    },
    async respond(output) {
      const res = await request(options, "/respond", { method: "POST", body: JSON.stringify(output) });
      if (!res.ok) throw new RemoteAgentError(`El ring rechazó la respuesta (${res.status})`);
    },
    async reportError(error) {
      await request(options, "/error", { method: "POST", body: JSON.stringify(error) });
    },
  };
}
