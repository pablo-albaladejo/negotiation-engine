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
