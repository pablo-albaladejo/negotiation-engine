import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import type { ApiResponse } from "./api.js";
import { BazaarDuels, BazaarLive, bazaarScore, BazaarThreads, type BazaarDuelsDeps, type BazaarLiveDeps, type BazaarThreadsDeps } from "./bazaar.js";
import { BazaarBoard, type BazaarBoardDeps } from "./bazaar-board.js";
import { BazaarModel, type BazaarModelDeps } from "./bazaar-model.js";

/**
 * Servidor local del visor. SOLO escucha en 127.0.0.1 (la dirección no es configurable, solo el
 * puerto con VIEWER_PORT) y NO tiene autenticación: es una decisión deliberada porque nadie fuera
 * de esta máquina puede conectarse. La cabecera Host se comprueba contra DNS rebinding. Solo GET y
 * HEAD; solo sirve la pestaña del Bazaar (`/api/bazaar/*`) y el resto lo delega en Vite.
 */
export const LOOPBACK = "127.0.0.1";
export const DEFAULT_PORT = 5199;

export type Middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

export interface ViewerServerOptions {
  repoRoot: string;
  /** Resto de rutas (Vite en modo middleware o estáticos); sin él, 404. */
  middleware?: Middleware;
  /** Directorio de `score.jsonl` distinto de `<repoRoot>/results/bazaar-live` (`VIEWER_BAZAAR_DIR`). */
  bazaarDir?: string;
  /** Inyectable en tests (clase `BazaarLive`); por defecto, usa `BAZAAR_KEY`/`BAZAAR_URL` del entorno. */
  bazaarLiveDeps?: BazaarLiveDeps;
  /** Inyectable en tests (clase `BazaarThreads`). */
  bazaarThreadsDeps?: BazaarThreadsDeps;
  /** Inyectable en tests (clase `BazaarDuels`). */
  bazaarDuelsDeps?: BazaarDuelsDeps;
  /** Inyectable en tests (clase `BazaarBoard`, `/api/bazaar/board`). */
  bazaarBoardDeps?: BazaarBoardDeps;
  /** Inyectable en tests (clase `BazaarModel`, `/api/bazaar/model`). */
  bazaarModelDeps?: BazaarModelDeps;
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

export function createViewerServer({ repoRoot, bazaarDir, bazaarLiveDeps, bazaarThreadsDeps, bazaarDuelsDeps, bazaarBoardDeps, bazaarModelDeps, middleware }: ViewerServerOptions): Server {
  const bazaarRoot = bazaarDir ?? join(repoRoot, "results", "bazaar-live");
  const bazaarLive = new BazaarLive(bazaarLiveDeps);
  const bazaarThreads = new BazaarThreads(bazaarRoot, bazaarThreadsDeps);
  const bazaarDuels = new BazaarDuels(bazaarDuelsDeps);
  const bazaarBoard = new BazaarBoard(bazaarRoot, {
    lessonsFile: join(repoRoot, "docs", "bazaar", "lessons.json"),
    snapshotsFile: process.env.VIEWER_BAZAAR_SNAPSHOTS ?? join(repoRoot, "..", "causa-prima", "bazaar-sim", "monitor", "data", "snapshots.jsonl"),
    ...bazaarBoardDeps,
  });
  // El modelo reutiliza el feed, el catálogo y el libro de El Rastro que ya lee el tablero (no repite los GET).
  const bazaarModel = new BazaarModel(bazaarRoot, { feed: () => bazaarBoard.recentFeed(), market: () => bazaarBoard.marketInputs(), ...bazaarModelDeps });

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
    if (rawPath === "/api/bazaar/score") {
      bazaarScore(bazaarRoot).then(
        (response) => sendJson(req, res, response),
        () => sendJson(req, res, failure(500, "internal error")),
      );
      return;
    }
    if (rawPath === "/api/bazaar/live") {
      bazaarLive.get().then(
        (response) => sendJson(req, res, response),
        () => sendJson(req, res, failure(500, "internal error")),
      );
      return;
    }
    if (rawPath === "/api/bazaar/threads") {
      bazaarThreads.get().then(
        (response) => sendJson(req, res, response),
        () => sendJson(req, res, failure(500, "internal error")),
      );
      return;
    }
    if (rawPath === "/api/bazaar/board") {
      bazaarBoard.get().then(
        (response) => sendJson(req, res, response),
        () => sendJson(req, res, failure(500, "internal error")),
      );
      return;
    }
    if (rawPath === "/api/bazaar/model") {
      bazaarModel.get().then(
        (response) => sendJson(req, res, response),
        () => sendJson(req, res, failure(500, "internal error")),
      );
      return;
    }
    if (rawPath === "/api/bazaar/duels") {
      bazaarDuels.get().then(
        (response) => sendJson(req, res, response),
        () => sendJson(req, res, failure(500, "internal error")),
      );
      return;
    }
    if (rawPath === "/api" || rawPath.startsWith("/api/")) {
      sendJson(req, res, failure(404, "not found"));
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
