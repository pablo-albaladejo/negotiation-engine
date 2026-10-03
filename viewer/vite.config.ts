import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const designSystem = fileURLToPath(new URL("../design-system/src/", import.meta.url));
const viewerRoot = fileURLToPath(new URL("./", import.meta.url));

/**
 * The design system comes in via alias to its source (no build, no `file:`), and `dedupe` makes
 * its `import "react"` resolve to the viewer's copy: a single React in the app and in the tests.
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
