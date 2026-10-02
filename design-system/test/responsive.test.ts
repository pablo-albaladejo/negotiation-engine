import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesPath = resolve(dirname(fileURLToPath(import.meta.url)), "../src/styles.css");

describe("B2/D1: responsive grids collapse below 900px", () => {
  it("styles.css defines .nr-grid reading --nr-grid-cols, with no !important", () => {
    const css = readFileSync(stylesPath, "utf8");
    expect(css).toContain(".nr-grid{display:grid");
    expect(css).toContain("grid-template-columns:var(--nr-grid-cols,minmax(0,1fr))");
    const gridRule = css.match(/\.nr-grid\{[^}]*\}/)![0];
    expect(gridRule).not.toContain("!important");
  });

  it("forces minmax(0,1fr) (not plain 1fr) under a 900px media query, so nowrap content can shrink", () => {
    const css = readFileSync(stylesPath, "utf8");
    const mediaBlock = css.match(/@media \(max-width:\s*899px\)\s*{([^}]*\.nr-grid[^}]*})/);
    expect(mediaBlock).toBeTruthy();
    expect(mediaBlock![1]).toContain("grid-template-columns:minmax(0,1fr)");
  });

  it("tables scroll horizontally inside their own wrapper, not the page", () => {
    const css = readFileSync(stylesPath, "utf8");
    expect(css).toContain(".nr-table-wrap{overflow-x:auto}");
  });
});

describe("D2: html/body track the theme tokens and color-scheme", () => {
  it("sets html/body background from the tokens and color-scheme per data-theme", () => {
    const css = readFileSync(stylesPath, "utf8");
    expect(css).toContain("html,body{margin:0;background:var(--bg);color-scheme:light dark}");
    expect(css).toContain('[data-theme="light"]{color-scheme:light}');
    expect(css).toContain('[data-theme="dark"]{color-scheme:dark}');
  });
});

describe("finding 11: .nr-chat-scroll replaces inline maxHeight: 80vh chat panels", () => {
  it("defines .nr-chat-scroll with a 560px cap and an is-tall 820px tournament variant", () => {
    const css = readFileSync(stylesPath, "utf8");
    expect(css).toContain(".nr-chat-scroll{overflow:auto;max-height:560px;margin-top:var(--space-3);padding-right:var(--space-1)}");
    expect(css).toContain(".nr-chat-scroll.is-tall{max-height:820px}");
  });
});

describe("F1 (WCAG 2.4.11): sticky header never hides a keyboard-focused/jumped-to element", () => {
  it("html scroll-padding-top covers the measured header height + a space-2 gap", () => {
    const css = readFileSync(stylesPath, "utf8");
    expect(css).toContain("html{scroll-padding-top:calc(var(--header-height,64px) + var(--space-2))}");
  });
});
