import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

/** Default `node` environment (server and adapters); render tests declare `jsdom` per file. */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "node",
      include: ["test/**/*.test.{ts,tsx}"],
    },
  }),
);
