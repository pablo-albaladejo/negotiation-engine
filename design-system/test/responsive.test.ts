import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesPath = resolve(dirname(fileURLToPath(import.meta.url)), "../src/styles.css");

describe("B2: responsive grids collapse below 900px", () => {
  it("styles.css defines .nr-grid and forces a single column under a 900px media query", () => {
    const css = readFileSync(stylesPath, "utf8");
    expect(css).toContain(".nr-grid{display:grid");
    const mediaBlock = css.match(/@media \(max-width:\s*899px\)\s*{([^}]*\.nr-grid[^}]*})/);
    expect(mediaBlock).toBeTruthy();
    expect(mediaBlock![1]).toContain("grid-template-columns:1fr");
  });

  it("tables scroll horizontally inside their own wrapper, not the page", () => {
    const css = readFileSync(stylesPath, "utf8");
    expect(css).toContain(".nr-table-wrap{overflow-x:auto}");
  });
});
