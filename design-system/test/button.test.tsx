import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { BackLink, PrimaryButton, SecondaryButton, TableLink } from "../src/index";

describe("Button variants", () => {
  it("renders BackLink with the nr-link-back class and type=button", () => {
    const html = renderToString(<BackLink>← Runs</BackLink>);
    expect(html).toContain("nr-link-back");
    expect(html).toContain('type="button"');
  });

  it("renders SecondaryButton with the nr-btn-secondary class", () => {
    const html = renderToString(<SecondaryButton>Copy</SecondaryButton>);
    expect(html).toContain("nr-btn-secondary");
  });

  it("renders PrimaryButton with the nr-btn-primary class", () => {
    const html = renderToString(<PrimaryButton>Open live view</PrimaryButton>);
    expect(html).toContain("nr-btn-primary");
  });

  it("renders TableLink with the nr-link-table class", () => {
    const html = renderToString(<TableLink>R3</TableLink>);
    expect(html).toContain("nr-link-table");
  });

  it("appends a caller-supplied className instead of replacing the base class", () => {
    const html = renderToString(<PrimaryButton className="extra">go</PrimaryButton>);
    expect(html).toContain('class="nr-btn-primary extra"');
  });
});

describe("link hit targets (D6)", () => {
  it("gives .nr-link-back and .nr-link-table a 24px min-height tap target", async () => {
    const { readFileSync } = await import("node:fs");
    const { dirname, resolve } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../src/styles.css"), "utf8");
    expect(css).toContain(".nr-link-back,.nr-link-table{min-height:24px;padding:2px 0}");
  });
});

describe("deprecated button aliases", () => {
  it("keeps .nr-btn as an alias of .nr-btn-secondary in styles.css", async () => {
    const { readFileSync } = await import("node:fs");
    const { dirname, resolve } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../src/styles.css"), "utf8");
    expect(css).toMatch(/\.nr-btn-secondary,\.nr-btn\{/);
  });

  it("keeps .nr-btn-back as an alias of .nr-link-back in styles.css", async () => {
    const { readFileSync } = await import("node:fs");
    const { dirname, resolve } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../src/styles.css"), "utf8");
    expect(css).toMatch(/\.nr-link-back,\.nr-btn-back\{/);
  });
});
