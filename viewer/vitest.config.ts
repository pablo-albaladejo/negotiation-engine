import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

/** Entorno `node` por defecto (servidor y adaptadores); los tests de render declaran `jsdom` por fichero. */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "node",
      include: ["test/**/*.test.{ts,tsx}"],
    },
  }),
);
