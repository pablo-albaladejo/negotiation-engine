import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createVite, type ViteDevServer } from "vite";
import { startViewerServer } from "./http.js";

/**
 * `pnpm viewer`: a single `node:http` process on 127.0.0.1 that serves `/api/*` and delegates the rest
 * to Vite in middleware mode. Local, read-only and unauthenticated (see http.ts).
 */
const viewerRoot = fileURLToPath(new URL("../", import.meta.url));
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

let vite: ViteDevServer | undefined;
const bazaarDir = process.env.VIEWER_BAZAAR_DIR ? resolve(process.env.VIEWER_BAZAAR_DIR) : undefined;
const { server, url } = await startViewerServer({
  repoRoot,
  ...(bazaarDir ? { bazaarDir } : {}),
  middleware: (req, res, next) => (vite ? vite.middlewares(req, res, next) : next()),
});
vite = await createVite({
  configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)),
  root: viewerRoot,
  appType: "spa",
  server: { middlewareMode: true, ws: { server } },
});

console.log(`Viewer at ${url}#bazaar (local only)`);

const stop = () => {
  void vite?.close();
  server.close(() => process.exit(0));
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
