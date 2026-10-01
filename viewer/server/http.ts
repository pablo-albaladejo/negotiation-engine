import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { handleApi, rootsFor, type ApiResponse, type Roots } from "./api.js";
import { serveLive } from "./live.js";

/**
 * Servidor local del visor. SOLO escucha en 127.0.0.1 (la dirección no es configurable, solo el
 * puerto con VIEWER_PORT) y NO tiene autenticación: es una decisión deliberada porque nadie fuera
 * de esta máquina puede conectarse. La cabecera Host se comprueba contra DNS rebinding. Solo GET y
 * HEAD; nunca escribe ficheros ni ejecuta o renderiza contenido de los logs en el servidor.
 */
export const LOOPBACK = "127.0.0.1";
export const DEFAULT_PORT = 5199;

export type Middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
export type ApiHandler = (segments: readonly string[], query: URLSearchParams) => Promise<ApiResponse>;

export interface ViewerServerOptions {
  repoRoot: string;
  /** Resto de rutas (Vite en modo middleware o estáticos); sin él, 404. */
  middleware?: Middleware;
  /** Inyectable en tests; por defecto, el router de solo lectura sobre `results/` y `config/`. */
  api?: ApiHandler;
}

function sendJson(req: IncomingMessage, res: ServerResponse, { status, body }: ApiResponse, extra: Record<string, string> = {}): void {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(text),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...extra,
  });
  res.end(req.method === "HEAD" ? undefined : text);
}

const failure = (status: number, message: string): ApiResponse => ({ status, body: { data: null, errors: [{ file: null, line: null, path: "", message }] } });

/** Segmentos de `/api/...` decodificados sobre la ruta cruda (sin normalizar `..`); `null` si no decodifica. */
function apiSegments(rawPath: string): string[] | null {
  try {
    return rawPath.slice("/api/".length).split("/").map((s) => decodeURIComponent(s));
  } catch {
    return null;
  }
}

export function createViewerServer({ repoRoot, middleware, api }: ViewerServerOptions): Server {
  const roots: Roots = rootsFor(repoRoot);
  const handle: ApiHandler = api ?? ((segments, query) => handleApi(roots, segments, query));

  const server = createServer((req, res) => {
    const port = (server.address() as AddressInfo | null)?.port;
    const host = req.headers.host;
    if (port === undefined || (host !== `${LOOPBACK}:${port}` && host !== `localhost:${port}`)) {
      sendJson(req, res, failure(403, "forbidden host"));
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(req, res, failure(405, "method not allowed"), { allow: "GET, HEAD" });
      return;
    }
    const raw = req.url ?? "/";
    const rawPath = raw.split("?", 1)[0] ?? "/";
    if (rawPath === "/api/live") {
      serveLive(req, res, roots.results);
      return;
    }
    if (rawPath === "/api" || rawPath.startsWith("/api/")) {
      const segments = apiSegments(rawPath);
      if (!segments) {
        sendJson(req, res, failure(400, "invalid identifier"));
        return;
      }
      const query = new URL(raw, `http://${LOOPBACK}`).searchParams;
      handle(segments, query).then(
        (response) => sendJson(req, res, response),
        () => sendJson(req, res, failure(500, "internal error")),
      );
      return;
    }
    const notFound = () => sendJson(req, res, failure(404, "not found"));
    if (middleware) middleware(req, res, notFound);
    else notFound();
  });
  return server;
}

function portFrom(env: NodeJS.ProcessEnv): number {
  const raw = env.VIEWER_PORT;
  if (raw === undefined || raw === "") return DEFAULT_PORT;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`VIEWER_PORT inválido: ${raw}`);
  return port;
}

/** Arranca en 127.0.0.1 y el puerto de `VIEWER_PORT` (0 = libre). Ninguna variable cambia la dirección. */
export async function startViewerServer(
  options: ViewerServerOptions & { env?: NodeJS.ProcessEnv },
): Promise<{ server: Server; port: number; url: string }> {
  const server = createViewerServer(options);
  const port = portFrom(options.env ?? process.env);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, LOOPBACK, () => {
      server.off("error", reject);
      resolve();
    });
  });
  const bound = (server.address() as AddressInfo).port;
  return { server, port: bound, url: `http://${LOOPBACK}:${bound}/` };
}
