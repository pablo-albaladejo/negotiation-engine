import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Tabs } from "../src/index";

describe("Tabs nav variant", () => {
  it("renders nav element when variant='nav'", () => {
    const html = renderToString(
      <Tabs
        variant="nav"
        aria-label="Test"
        items={[{ id: "a", label: "Tab A" }]}
        selectedId="a"
        onSelect={() => {}}
      />
    );
    expect(html).toContain("<nav");
    expect(html).toContain('aria-label="Test"');
  });

  it("uses aria-current='page' on selected item with variant='nav'", () => {
    const html = renderToString(
      <Tabs
        variant="nav"
        items={[
          { id: "a", label: "Tab A" },
          { id: "b", label: "Tab B" },
        ]}
        selectedId="a"
        onSelect={() => {}}
      />
    );
    expect(html).toContain('aria-current="page"');
    // Verify aria-current is not present for unselected items
    const navContent = html.substring(html.indexOf("<nav"), html.lastIndexOf("</nav>") + 6);
    const currentCount = (navContent.match(/aria-current/g) || []).length;
    expect(currentCount).toBe(1);
  });

  it("does not use aria-pressed with variant='nav'", () => {
    const html = renderToString(
      <Tabs
        variant="nav"
        items={[{ id: "a", label: "Tab A" }]}
        selectedId="a"
        onSelect={() => {}}
      />
    );
    expect(html).not.toContain("aria-pressed");
  });

  it("renders div with role='group' for default variant='group'", () => {
    const html = renderToString(
      <Tabs
        items={[{ id: "a", label: "Tab A" }]}
        selectedId="a"
        onSelect={() => {}}
      />
    );
    expect(html).toContain('role="group"');
    expect(html).not.toContain("<nav");
  });

  it("uses aria-pressed='true' for selected item with variant='group'", () => {
    const html = renderToString(
      <Tabs
        items={[
          { id: "a", label: "Tab A" },
          { id: "b", label: "Tab B" },
        ]}
        selectedId="a"
        onSelect={() => {}}
      />
    );
    expect(html).toContain('aria-pressed="true"');
  });
});
