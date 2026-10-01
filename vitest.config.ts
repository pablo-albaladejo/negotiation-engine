import { configDefaults, defineConfig } from "vitest/config";

/** `viewer/` es un paquete propio con sus dependencias y su vitest (`pnpm viewer:test`). */
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "viewer/**"],
  },
});
