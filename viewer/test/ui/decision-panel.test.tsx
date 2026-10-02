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

const panelWithExplain = (round: number): RoundPanel => ({
  ...panel(round),
  explain: { t: 0.4, target: 0.5, targetOffer: null, step: 0.1, uOffer: 0.5, uRival: 0.4, acNext: true, acTime: "applies", rivalReserveEstimate: {} },
  parser: { intent: "offer", injectionSuspected: true },
  validator: { ok: true },
  template: true,
});

describe("DecisionPanel (L4/L5/L25/L26)", () => {
  it("round label uses the actual round numbers, not a count (may start above 1 / skip)", () => {
    const { container } = render(<DecisionPanel hasTrace panel={panel(7)} rounds={[3, 5, 7]} selectedRound={7} onSelectRound={() => {}} />);
    const visible = screen.getByText("R7 / 7");
    expect(visible.getAttribute("aria-hidden")).toBe("true");
    // F7: a sr-only "Round N of M" inside the role=status live region, not an aria-label override.
    const liveRegion = container.querySelector("[role='status']")!;
    expect(liveRegion.contains(visible)).toBe(true);
    expect(liveRegion.querySelector(".nr-sr-only")!.textContent).toBe("Round 7 of 7");
  });

  it("Previous is disabled on the first round, Next on the last; onSelectRound gets the neighbouring round number", () => {
    const onSelectRound = vi.fn();
    render(<DecisionPanel hasTrace panel={panel(5)} rounds={[3, 5, 7]} selectedRound={5} onSelectRound={onSelectRound} />);
    const prev = screen.getByText("← Previous round") as HTMLButtonElement;
    const next = screen.getByText("Next round →") as HTMLButtonElement;
    expect(prev.getAttribute("aria-disabled")).toBe("false");
    expect(next.getAttribute("aria-disabled")).toBe("false");
    prev.click();
    expect(onSelectRound).toHaveBeenCalledWith(3);
    next.click();
    expect(onSelectRound).toHaveBeenCalledWith(7);
  });

  it("Previous disabled at the first round, Next disabled at the last", () => {
    const onSelectRound = vi.fn();
    const { rerender } = render(<DecisionPanel hasTrace panel={panel(3)} rounds={[3, 5, 7]} selectedRound={3} onSelectRound={onSelectRound} />);
    expect(screen.getByText("← Previous round").getAttribute("aria-disabled")).toBe("true");
    rerender(<DecisionPanel hasTrace panel={panel(7)} rounds={[3, 5, 7]} selectedRound={7} onSelectRound={onSelectRound} />);
    expect(screen.getByText("Next round →").getAttribute("aria-disabled")).toBe("true");
  });

  it("hasTrace true but no panel for the selected round: 'R{n}: not logged.' instead of an empty table", () => {
    render(<DecisionPanel hasTrace panel={null} rounds={[1, 2, 3]} selectedRound={2} onSelectRound={() => {}} />);
    expect(screen.getByText("R2: not logged.")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("copy: 'Click a point on the chart to switch rounds.'", () => {
    render(<DecisionPanel hasTrace panel={panel(1)} rounds={[1]} selectedRound={1} onSelectRound={() => {}} />);
    expect(screen.getByText(/Click a point on the chart to switch rounds\./)).toBeTruthy();
  });

  it("C6: a selectedRound not present in rounds still enables Previous/Next towards the nearest logged round", () => {
    const onSelectRound = vi.fn();
    render(<DecisionPanel hasTrace panel={null} rounds={[3, 5, 7]} selectedRound={6} onSelectRound={onSelectRound} />);
    const prev = screen.getByText("← Previous round") as HTMLButtonElement;
    const next = screen.getByText("Next round →") as HTMLButtonElement;
    expect(prev.getAttribute("aria-disabled")).toBe("false");
    expect(next.getAttribute("aria-disabled")).toBe("false");
    prev.click();
    expect(onSelectRound).toHaveBeenCalledWith(5);
    next.click();
    expect(onSelectRound).toHaveBeenCalledWith(7);
  });

  it("C6: a selectedRound before the first logged round disables Previous, enables Next towards the first", () => {
    const onSelectRound = vi.fn();
    render(<DecisionPanel hasTrace panel={null} rounds={[3, 5, 7]} selectedRound={1} onSelectRound={onSelectRound} />);
    expect(screen.getByText("← Previous round").getAttribute("aria-disabled")).toBe("true");
    const next = screen.getByText("Next round →") as HTMLButtonElement;
    expect(next.getAttribute("aria-disabled")).toBe("false");
    next.click();
    expect(onSelectRound).toHaveBeenCalledWith(3);
  });

  // Test 7: Status column flags per row, from the logged explain/parser/validator -- no separate "Rule" row (A7).
  it("Status column: accept/applies/injection/template flags from the logged explain/parser/validator; no 'Rule' row", () => {
    render(<DecisionPanel hasTrace panel={panelWithExplain(1)} rounds={[1]} selectedRound={1} onSelectRound={() => {}} />);
    expect(screen.getByText("Turn step")).toBeTruthy();
    expect(screen.queryByText("Rule")).toBeNull();
    expect(screen.getByText("accept")).toBeTruthy();
    expect(screen.getByText("applies")).toBeTruthy();
    expect(screen.getByText("injection")).toBeTruthy();
    expect(screen.getByText("template")).toBeTruthy();
  });

  it("Status column: no-accept/no/clean/ok flags when explain says so and nothing was flagged", () => {
    const clean: RoundPanel = { ...panelWithExplain(1), explain: { ...panelWithExplain(1).explain!, acNext: false, acTime: "no" }, parser: { intent: "offer", injectionSuspected: false }, template: false };
    render(<DecisionPanel hasTrace panel={clean} rounds={[1]} selectedRound={1} onSelectRound={() => {}} />);
    expect(screen.getByText("no accept")).toBeTruthy();
    expect(screen.getByText("no")).toBeTruthy();
    expect(screen.getByText("clean")).toBeTruthy();
    expect(screen.getByText("ok")).toBeTruthy();
  });
});
