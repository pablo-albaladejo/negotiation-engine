import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const designSystem = fileURLToPath(new URL("../design-system/src/", import.meta.url));
const viewerRoot = fileURLToPath(new URL("./", import.meta.url));

/**
 * El sistema de diseño entra por alias a su código fuente (sin build ni `file:`), y `dedupe` hace
 * que su `import "react"` resuelva a la copia del visor: una sola React en la app y en los tests.
 */
export default defineConfig({
  root: viewerRoot,
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@negotiation-ring\/design-system\/styles\.css$/, replacement: `${designSystem}styles.css` },
      { find: /^@negotiation-ring\/design-system$/, replacement: `${designSystem}index.ts` },
    ],
    dedupe: ["react", "react-dom"],
  },
  server: {
    fs: { strict: true, allow: [viewerRoot, designSystem] },
  },
});
