import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { ChatMessage, Legend, Scoreboard } from "../src/index";

describe("ChatMessage highlighted", () => {
  it("uses the us side class when highlighted on our side", () => {
    const html = renderToString(<ChatMessage side="us" round={3} text="112" highlighted />);
    expect(html).toContain("nr-msg us is-highlighted");
  });

  it("uses the them side class when highlighted on the rival side", () => {
    const html = renderToString(<ChatMessage side="them" round={3} text="104" highlighted />);
    expect(html).toContain("nr-msg them is-highlighted");
  });
});

describe("Legend items", () => {
  it("renders a swatch per item kind", () => {
    const html = renderToString(
      <Legend
        items={[
          { kind: "us", label: "Our offers" },
          { kind: "them", label: "Opponent offers" },
          { kind: "zopa", label: "ZOPA" },
        ]}
      />,
    );
    expect(html).toContain("nr-legend-swatch us");
    expect(html).toContain("nr-legend-swatch them");
    expect(html).toContain("nr-legend-swatch zopa");
    expect(html).toContain("Our offers");
  });

  it("still renders children", () => {
    const html = renderToString(<Legend>plain text</Legend>);
    expect(html).toContain("plain text");
  });
});

describe("Scoreboard with null round/attacksBlocked", () => {
  it("renders an em dash for a null round", () => {
    const html = renderToString(<Scoreboard badge="WAITING" us="us" rival="next opponent" round={null} rounds={10} attacksBlocked={null} />);
    expect(html).toContain("—");
    expect(html).not.toContain("nr-scoreboard-attacks\"");
  });

  it("uses the warn color only when attacksBlocked is greater than zero", () => {
    const zero = renderToString(<Scoreboard badge="LIVE" us="us" rival="them" round={3} rounds={10} attacksBlocked={0} />);
    expect(zero).toContain("nr-scoreboard-attacks-muted");
    const some = renderToString(<Scoreboard badge="LIVE" us="us" rival="them" round={3} rounds={10} attacksBlocked={2} />);
    expect(some).toContain("nr-scoreboard-attacks\"");
  });

  it("renders an em dash for a null rounds limit (no logged horizon yet)", () => {
    const html = renderToString(<Scoreboard badge="WAITING" us="us" rival="next opponent" round={null} rounds={null} attacksBlocked={null} />);
    const stat = /<span class="nr-scoreboard-value">(.*?)<\/span>/.exec(html)?.[1];
    expect(stat).toBe("—<!-- -->/<!-- -->—");
  });
});
