// @vitest-environment jsdom
import { KpiStrip, Root } from "@negotiation-ring/design-system";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

afterEach(cleanup);

function Counter() {
  const [games, setGames] = useState(0);
  return (
    <Root theme="light">
      <KpiStrip items={[{ label: "Games", value: String(games) }]} />
      <button type="button" onClick={() => setGames((g) => g + 1)}>
        add
      </button>
    </Root>
  );
}

describe("sistema de diseño por alias", () => {
  it("Root + KpiStrip renderizan con un hook del visor (una sola React tras dedupe)", () => {
    render(<Counter />);
    expect(screen.getByText("Games")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy();
    fireEvent.click(screen.getByText("add"));
    expect(screen.getByText("1")).toBeTruthy();
  });
});
