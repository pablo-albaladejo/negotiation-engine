import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import type { ApiResponse } from "./api.js";
import { BazaarDuels, BazaarLive, bazaarScore, BazaarThreads, type BazaarDuelsDeps, type BazaarLiveDeps, type BazaarThreadsDeps } from "./bazaar/bazaar.js";
import { BazaarBoard, type BazaarBoardDeps } from "./bazaar/bazaar-board.js";
import { BazaarModel, type BazaarModelDeps } from "./bazaar/bazaar-model.js";
import { bazaarNews } from "./bazaar/bazaar-news.js";

/**
 * Local viewer server. It ONLY listens on 127.0.0.1 (the address is not configurable, only the
 * port via VIEWER_PORT) and has NO authentication: a deliberate decision because nobody outside
 * this machine can connect. The Host header is checked against DNS rebinding. GET and HEAD only;
 * it only serves the Bazaar tab (`/api/bazaar/*`) and delegates the rest to Vite.
 */
export const LOOPBACK = "127.0.0.1";
export const DEFAULT_PORT = 5199;

export type Middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

export interface ViewerServerOptions {
  repoRoot: string;
  /** Remaining routes (Vite in middleware mode or static files); without it, 404. */
  middleware?: Middleware;
  /** `score.jsonl` directory other than `<repoRoot>/results/bazaar-live` (`VIEWER_BAZAAR_DIR`). */
  bazaarDir?: string;
  /** Injectable in tests (`BazaarLive` class); by default, uses `BAZAAR_KEY`/`BAZAAR_URL` from the environment. */
  bazaarLiveDeps?: BazaarLiveDeps;
  /** Injectable in tests (`BazaarThreads` class). */
  bazaarThreadsDeps?: BazaarThreadsDeps;
  /** Injectable in tests (`BazaarDuels` class). */
  bazaarDuelsDeps?: BazaarDuelsDeps;
  /** Injectable in tests (`BazaarBoard` class, `/api/bazaar/board`). */
  bazaarBoardDeps?: BazaarBoardDeps;
  /** Injectable in tests (`BazaarModel` class, `/api/bazaar/model`). */
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
  // The model reuses the feed, catalog and El Rastro book the board already reads (no repeated GETs).
  const bazaarModel = new BazaarModel(bazaarRoot, { feed: () => bazaarBoard.recentFeed(), market: () => bazaarBoard.marketInputs(), lessonsFile: join(repoRoot, "docs", "bazaar", "lessons.json"), ...bazaarModelDeps });

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
    if (rawPath === "/api/bazaar/news") {
      bazaarNews(bazaarRoot).then(
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
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`Invalid VIEWER_PORT: ${raw}`);
  return port;
}

/** Starts on 127.0.0.1 and the `VIEWER_PORT` port (0 = any free port). No variable changes the address. */
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
