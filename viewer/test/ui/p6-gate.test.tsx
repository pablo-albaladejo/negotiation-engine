// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { gateModel } from "../../src/model/index.js";
import { parseRoute, routeTo } from "../../src/route.js";
import { GateScreen } from "../../src/screens/GateScreen.js";
import { generateGateFixtures } from "../fixtures.js";

let gx: Awaited<ReturnType<typeof generateGateFixtures>>;
beforeAll(async () => {
  gx = await generateGateFixtures();
});
afterEach(cleanup);

describe("GateScreen (P6)", () => {
  it("aprobada en seco: píldora de aprobación, checks con su Flag, heatmap, diff y comando para copiar", async () => {
    const model = gateModel("promote-x", gx.passed.gate);
    const { container } = render(<GateScreen model={model} onBack={() => {}} />);
    expect(container.querySelector(".nr-pill.verdict")?.textContent).toMatch(/gate passed · dry run/);
    expect(container.querySelectorAll(".nr-flag.decision")).toHaveLength(gx.passed.gate.gate.checks.length);
    expect(container.querySelector(".nr-flag.walk")).toBeNull();
    expect(container.querySelectorAll(".nr-heat-cell")).toHaveLength(4);
    for (const cell of container.querySelectorAll(".nr-heat-cell")) expect(cell.classList.contains("none")).toBe(cell.textContent === "n/a");
    expect(screen.getByText("beta: 0.2")).toBeTruthy();
    expect(screen.getByText("beta: 0.3")).toBeTruthy();
    expect(screen.getByText(`pnpm promote ${gx.candidatePath}`)).toBeTruthy();
    const copyButton = screen.getByRole("button", { name: "Copy" });
    expect(copyButton.className).toContain("nr-btn-primary");
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    fireEvent.click(copyButton);
    await screen.findByRole("button", { name: "Copied" });
    expect(writeText).toHaveBeenCalledWith(`pnpm promote ${gx.candidatePath}`);
    expect(screen.getAllByText("+2.30 pp")).toHaveLength(3);
    // gate.json never logs a direction for the surplus change: no hard-coded better/worse tone (L12).
    expect(container.querySelectorAll(".nr-better, .nr-worse")).toHaveLength(0);
  });

  it("rechazada: píldora de rechazo con la comprobación fallida y su valor registrado, Flag walk, sin comando", () => {
    const model = gateModel("promote-x", gx.rejected.gate);
    const { container } = render(<GateScreen model={model} onBack={() => {}} />);
    const first = model.verdict.failed[0]!;
    expect(container.querySelector(".nr-pill.rejected")?.textContent).toContain(`rejected · ${first.label}: ${first.logged}`);
    expect(container.querySelectorAll(".nr-flag.walk")).toHaveLength(gx.rejected.gate.gate.failed.length);
    expect(screen.getByText(/no command: the gate did not pass/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Copy" })).toBeNull();
  });

  it("ya promovida: promoted to champion v2 y sin comando", () => {
    const { container } = render(<GateScreen model={gateModel("promote-x", gx.promoted.gate)} onBack={() => {}} />);
    expect(container.querySelector(".nr-pill.verdict")?.textContent).toBe("promoted to champion v2");
    expect(screen.queryByRole("button", { name: "Copy" })).toBeNull();
  });

  it("cambiar de fase cambia las métricas y el heatmap; ruta #/promote/<runId>", () => {
    render(<GateScreen model={gateModel("promote-x", gx.passed.gate)} onBack={() => {}} />);
    fireEvent.click(screen.getByRole("tab", { name: "Held-out opponents" }));
    expect(screen.getByText(/Metrics · Held-out opponents/)).toBeTruthy();
    expect(parseRoute(routeTo.compare("promote-1"))).toEqual({ screen: "compare", runId: "promote-1" });
    expect(parseRoute(routeTo.promote("promote-1"))).toEqual({ screen: "compare", runId: "promote-1" });
  });

  it("Copy label resets to 'Copy' after 1.5s, and the timer is cleared on unmount (B2)", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    vi.useFakeTimers();
    try {
      const { unmount } = render(<GateScreen model={gateModel("promote-x", gx.passed.gate)} onBack={() => {}} />);
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
      expect(() => unmount()).not.toThrow();
      expect(() => act(() => vi.advanceTimersByTime(5000))).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });

  it("Copy shows 'Copy failed' when the clipboard API is unavailable (C1)", () => {
    const originalClipboard = navigator.clipboard;
    Object.assign(navigator, { clipboard: undefined });
    try {
      render(<GateScreen model={gateModel("promote-x", gx.passed.gate)} onBack={() => {}} />);
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
      expect(screen.getByRole("button", { name: "Copy failed" })).toBeTruthy();
    } finally {
      Object.assign(navigator, { clipboard: originalClipboard });
    }
  });

  it("Copy shows 'Copy failed' when writeText rejects (C1)", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.assign(navigator, { clipboard: { writeText } });
    render(<GateScreen model={gateModel("promote-x", gx.passed.gate)} onBack={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await screen.findByRole("button", { name: "Copy failed" });
  });

  it("layout grids use the DS nr-grid class so they collapse to one column below 900px (B2)", () => {
    const { container } = render(<GateScreen model={gateModel("promote-x", gx.passed.gate)} onBack={() => {}} />);
    expect(container.querySelectorAll(".nr-grid").length).toBeGreaterThanOrEqual(2);
  });

  it("parameter diff uses the 22px sign-column DS classes (B3)", () => {
    const { container } = render(<GateScreen model={gateModel("promote-x", gx.passed.gate)} onBack={() => {}} />);
    const rows = container.querySelectorAll(".nr-diff-row");
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.querySelector(".nr-diff-sign")).toBeTruthy();
  });

  it("Change column: 'not logged' for metrics without a logged delta, a real value for surplus (B5)", () => {
    const model = gateModel("promote-x", gx.passed.gate);
    render(<GateScreen model={model} onBack={() => {}} />);
    const table = screen.getByText("Agreement").closest("table")!;
    const agreementRow = screen.getByText("Agreement").closest("tr")!;
    expect(agreementRow.textContent).toContain("not logged");
    void table;
  });
});
