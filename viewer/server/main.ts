import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createVite, type ViteDevServer } from "vite";
import { startViewerServer } from "./http.js";

/**
 * `pnpm viewer`: un solo proceso `node:http` en 127.0.0.1 que atiende `/api/*` y delega el resto
 * en Vite en modo middleware. Local, de solo lectura y sin autenticación (ver http.ts).
 */
const viewerRoot = fileURLToPath(new URL("../", import.meta.url));
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

let vite: ViteDevServer | undefined;
const resultsDir = process.env.VIEWER_RESULTS_DIR ? resolve(process.env.VIEWER_RESULTS_DIR) : undefined;
const bazaarDir = process.env.VIEWER_BAZAAR_DIR ? resolve(process.env.VIEWER_BAZAAR_DIR) : undefined;
const { server, url } = await startViewerServer({
  repoRoot,
  ...(resultsDir ? { resultsDir } : {}),
  ...(bazaarDir ? { bazaarDir } : {}),
  middleware: (req, res, next) => (vite ? vite.middlewares(req, res, next) : next()),
});
vite = await createVite({
  configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)),
  root: viewerRoot,
  appType: "spa",
  server: { middlewareMode: true, ws: { server } },
});

console.log(`Visor en ${url} (solo local, solo lectura)${resultsDir ? ` · resultados de ${resultsDir}` : ""}`);

const stop = () => {
  void vite?.close();
  server.close(() => process.exit(0));
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
