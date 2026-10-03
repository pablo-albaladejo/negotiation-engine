import { configDefaults, defineConfig } from "vitest/config";

/**
 * `viewer/` and `design-system/` are separate packages, each with its own dependencies, lockfile and
 * vitest (`pnpm ds:test`). If they are not excluded, a fresh clone with only
 * `pnpm install` at the root fails to import react/jsdom in their tests.
 */
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "viewer/**", "design-system/**", "handoff/**"],
  },
});
