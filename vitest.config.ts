import { configDefaults, defineConfig } from "vitest/config";

/**
 * `viewer/` y `design-system/` son paquetes propios, cada uno con sus dependencias, su lockfile y su
 * vitest (`pnpm viewer:test`, `pnpm ds:test`). Si no se excluyen, un clon nuevo con solo
 * `pnpm install` en la raíz falla al importar react/jsdom en sus tests.
 */
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "viewer/**", "design-system/**"],
  },
});
