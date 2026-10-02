// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RoundPanel } from "../../src/model/index.js";
import { DecisionPanel } from "../../src/ui/DecisionPanel.js";

afterEach(cleanup);

const panel = (round: number): RoundPanel => ({
  round,
  decision: { action: "counter", rule: "boulware", offer: { pct: 5 } },
  explain: null,
  parser: null,
  validator: null,
  leak: null,
  template: false,
  rivalText: null,
  ourText: null,
  ourOffer: null,
  rivalOffer: null,
  outcome: null,
  boxes: [],
});

describe("DecisionPanel (L4/L5/L25/L26)", () => {
  it("round label uses the actual round numbers, not a count (may start above 1 / skip)", () => {
    render(<DecisionPanel hasTrace panel={panel(7)} rounds={[3, 5, 7]} selectedRound={7} onSelectRound={() => {}} />);
    expect(screen.getByText("Round 7 of 7")).toBeTruthy();
  });

  it("Previous is disabled on the first round, Next on the last; onSelectRound gets the neighbouring round number", () => {
    const onSelectRound = vi.fn();
    render(<DecisionPanel hasTrace panel={panel(5)} rounds={[3, 5, 7]} selectedRound={5} onSelectRound={onSelectRound} />);
    const prev = screen.getByText("← Previous round") as HTMLButtonElement;
    const next = screen.getByText("Next round →") as HTMLButtonElement;
    expect(prev.disabled).toBe(false);
    expect(next.disabled).toBe(false);
    prev.click();
    expect(onSelectRound).toHaveBeenCalledWith(3);
    next.click();
    expect(onSelectRound).toHaveBeenCalledWith(7);
  });

  it("Previous disabled at the first round, Next disabled at the last", () => {
    const onSelectRound = vi.fn();
    const { rerender } = render(<DecisionPanel hasTrace panel={panel(3)} rounds={[3, 5, 7]} selectedRound={3} onSelectRound={onSelectRound} />);
    expect((screen.getByText("← Previous round") as HTMLButtonElement).disabled).toBe(true);
    rerender(<DecisionPanel hasTrace panel={panel(7)} rounds={[3, 5, 7]} selectedRound={7} onSelectRound={onSelectRound} />);
    expect((screen.getByText("Next round →") as HTMLButtonElement).disabled).toBe(true);
  });

  it("hasTrace true but no panel for the selected round: 'R{n}: not logged.' instead of an empty table", () => {
    render(<DecisionPanel hasTrace panel={null} rounds={[1, 2, 3]} selectedRound={2} onSelectRound={() => {}} />);
    expect(screen.getByText("R2: not logged.")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("copy: 'Select a point on the chart, or use Previous / Next round, to switch rounds.'", () => {
    render(<DecisionPanel hasTrace panel={panel(1)} rounds={[1]} selectedRound={1} onSelectRound={() => {}} />);
    expect(screen.getByText(/Select a point on the chart, or use Previous \/ Next round, to switch rounds\./)).toBeTruthy();
  });
});
