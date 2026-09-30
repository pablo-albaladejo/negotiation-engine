import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = resolve(root, "dist");
mkdirSync(distDir, { recursive: true });

await build({
  entryPoints: [resolve(root, "src/index.ts")],
  outfile: resolve(distDir, "index.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  external: ["react", "react-dom", "react/jsx-runtime"],
  sourcemap: true,
});

await build({
  entryPoints: [resolve(root, "src/index.ts")],
  outfile: resolve(distDir, "index.cjs"),
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "es2020",
  external: ["react", "react-dom", "react/jsx-runtime"],
  sourcemap: true,
});

await build({
  entryPoints: [resolve(root, "src/styles.css")],
  outfile: resolve(distDir, "styles.css"),
  bundle: true,
  loader: { ".css": "css" },
});

// esbuild resolves the @import of the Google Fonts URL relative to the file;
// make sure it survives as a plain URL import at the top of the bundled CSS.
const cssPath = resolve(distDir, "styles.css");
const css = readFileSync(cssPath, "utf8");
if (!css.includes("fonts.googleapis.com")) {
  throw new Error("Google Fonts import was lost while bundling styles.css");
}
writeFileSync(cssPath, css);

console.log("Build complete: dist/index.js, dist/index.cjs, dist/styles.css");
