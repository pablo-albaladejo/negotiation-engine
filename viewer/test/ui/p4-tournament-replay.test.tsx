// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { tournamentReplayModel } from "../../src/model/index.js";
import type { TraceLine } from "../../../src/pipeline/trace.js";
import { TournamentReplayScreen } from "../../src/screens/TournamentReplayScreen.js";
import { generateFixtures, RIVAL_HTML, type ViewerFixtures } from "../fixtures.js";

let fx: ViewerFixtures;
beforeAll(async () => {
  fx = await generateFixtures();
});
afterEach(cleanup);

/** C2: minimal hand-built tournament trace so the session ends on OUR engine's decision (accept or
 * walk), which `binding` never records (it only captures the rival's move). */
function tournamentTrace(records: Array<{ round: number; box: string; output: unknown; result?: "ok" | "retry" | "fallback" | "error" }>): TraceLine[] {
  const header: TraceLine = {
    kind: "header",
    mode: "tournament",
    sessionId: "s-c2",
    configVersion: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    scenario: { id: "sc-1", hash: "0123456789abcdef" },
  };
  return [
    header,
    ...records.map((r) => ({
      kind: "box" as const,
      sessionId: "s-c2",
      round: r.round,
      box: r.box,
      input: null,
      output: r.output,
      result: r.result ?? ("ok" as const),
      latencyMs: 0,
    })),
  ];
}

describe("tournamentReplayModel outcome: our own accept/walk (C2)", () => {
  it("our engine accepting the rival's last offer is reported as an agreement with their offer, with no binding recorded", () => {
    const trace = tournamentTrace([
      { round: 1, box: "binding", output: { kind: "offer", offer: { pct: 20 } } },
      { round: 1, box: "engine", output: { action: "counter", rule: "r1", offer: { pct: 15 } } },
      { round: 2, box: "binding", output: { kind: "offer", offer: { pct: 18 } } },
      { round: 2, box: "engine", output: { action: "accept", rule: "r2", offer: { pct: 18 } } },
    ]);
    const model = tournamentReplayModel(trace, null);
    expect(model.outcome).toEqual({ kind: "agreement", by: "agent", offer: { pct: 18 } });
  });

  it("our engine walking is reported as a walk by us, with no binding recorded", () => {
    const trace = tournamentTrace([
      { round: 1, box: "binding", output: { kind: "offer", offer: { pct: 50 } } },
      { round: 1, box: "engine", output: { action: "walk", rule: "r1", offer: null } },
    ]);
    const model = tournamentReplayModel(trace, null);
    expect(model.outcome).toEqual({ kind: "walk", by: "agent", offer: null });
  });

  it("the rival's logged binding still wins over our own last decision", () => {
    const trace = tournamentTrace([
      { round: 1, box: "engine", output: { action: "counter", rule: "r1", offer: { pct: 15 } } },
      { round: 1, box: "binding", output: { kind: "agreement", offer: { pct: 15 } } },
    ]);
    const model = tournamentReplayModel(trace, null);
    expect(model.outcome).toEqual({ kind: "agreement", by: "rival", offer: { pct: 15 } });
  });
});

describe("TournamentReplayScreen result label distinguishes who ended the session (C2)", () => {
  it('shows "We walked" when our own decision walked (no rival binding)', () => {
    const trace = tournamentTrace([
      { round: 1, box: "binding", output: { kind: "offer", offer: { pct: 50 } } },
      { round: 1, box: "engine", output: { action: "walk", rule: "r1", offer: null } },
    ]);
    const model = tournamentReplayModel(trace, null);
    render(<TournamentReplayScreen model={model} onBack={() => {}} />);
    expect(screen.getByText("We walked")).toBeTruthy();
    expect(screen.queryByText("Opponent walked")).toBeNull();
  });

  it('shows "Opponent walked" when the rival\'s own binding recorded the walk', () => {
    const trace = tournamentTrace([{ round: 1, box: "binding", output: { kind: "walk" } }]);
    const model = tournamentReplayModel(trace, null);
    render(<TournamentReplayScreen model={model} onBack={() => {}} />);
    expect(screen.getByText("Opponent walked")).toBeTruthy();
  });
});

describe("TournamentReplayScreen 'Our offer' column never invents data (C3)", () => {
  it("shows the logged decision (accept/walk) instead of a hardcoded 'accept' when we made no counter-offer", () => {
    const trace = tournamentTrace([
      { round: 1, box: "binding", output: { kind: "offer", offer: { pct: 20 } } },
      { round: 1, box: "engine", output: { action: "accept", rule: "r1", offer: { pct: 20 } } },
    ]);
    const model = tournamentReplayModel(trace, null);
    const { container } = render(<TournamentReplayScreen model={model} onBack={() => {}} />);
    const estTable = screen.getByText("Estimate of their reserve by round").closest(".nr-card")!;
    expect(estTable.textContent).toContain("accept");
    void container;
  });

  it("shows 'not logged' rather than inventing a value when there is no engine decision at all for that round", () => {
    const trace = tournamentTrace([{ round: 1, box: "binding", output: { kind: "offer", offer: { pct: 20 } } }]);
    const model = tournamentReplayModel(trace, null);
    render(<TournamentReplayScreen model={model} onBack={() => {}} />);
    const estTable = screen.getByText("Estimate of their reserve by round").closest(".nr-card")!;
    expect(estTable.textContent).toContain("not logged");
  });
});

describe("TournamentReplayScreen KPIs/injections/end marker (R1, R2, R6)", () => {
  function traceWithExplain() {
    return tournamentTrace([
      { round: 1, box: "binding", output: { kind: "offer", offer: { pct: 30 } } },
      { round: 1, box: "parser", output: { intent: "counter", injectionSuspected: true } },
      {
        round: 1,
        box: "engine",
        output: { action: "counter", rule: "r1", offer: { pct: 15 }, explain: { target: 12, targetOffer: { pct: 15 }, uOffer: 0.4, uRival: null, rivalReserveEstimate: { pct: 28 }, step: 2, t: 0.5, acNext: false, acTime: "n/a" } },
      },
      { round: 2, box: "binding", output: { kind: "agreement", offer: { pct: 18 } } },
      {
        round: 2,
        box: "engine",
        // X1: when we accept the rival's current offer, the deal utility is this round's uRival (what the accepted offer is worth to us), not uOffer (our hypothetical next counter).
        output: { action: "accept", rule: "r2", offer: { pct: 18 }, explain: { target: 10, targetOffer: null, uOffer: 0.5, uRival: 0.63, rivalReserveEstimate: { pct: 20 }, step: 1, t: 0.9, acNext: true, acTime: "applies" } },
      },
    ]);
  }

  it("shows Utility and Estimated opponent reserve KPIs from the last logged explain, and counts injections with walk tone", () => {
    const model = tournamentReplayModel(traceWithExplain(), null);
    const { container } = render(<TournamentReplayScreen model={model} onBack={() => {}} />);
    expect(screen.getByText("Utility")).toBeTruthy();
    expect(screen.getByText("0.63")).toBeTruthy();
    const estimateKpi = screen.getByText("Estimated opponent reserve").closest(".nr-kpi")!;
    expect(estimateKpi.querySelector(".nr-kpi-value")!.textContent).toBe("20");
    const injectionsKpi = screen.getByText("Injections").closest(".nr-kpi")!;
    expect(injectionsKpi.textContent).toContain("1");
    expect(injectionsKpi.querySelector(".nr-kpi-value")!.className).toContain("walk");
    void container;
  });

  it("draws an injection marker and an end marker on the offers chart, with Injection in the Legend (R1)", () => {
    const model = tournamentReplayModel(traceWithExplain(), null);
    const { container } = render(<TournamentReplayScreen model={model} onBack={() => {}} />);
    expect(container.querySelector("circle.injection, .injection")).toBeTruthy();
    expect(screen.getByText("Injection")).toBeTruthy();
  });

  it("final-estimate caption names the closing price only when the session actually closed (R6)", () => {
    const model = tournamentReplayModel(traceWithExplain(), null);
    render(<TournamentReplayScreen model={model} onBack={() => {}} />);
    expect(screen.getByText(/final estimate · the opponent closed at 18/)).toBeTruthy();
  });

  it("no back link in the header: the Tabs already cover navigation (R3)", () => {
    const model = tournamentReplayModel(fx.tournament.trace, fx.tournament.ref);
    const { container } = render(<TournamentReplayScreen model={model} onBack={() => {}} />);
    expect(container.querySelector(".nr-link-back")).toBeNull();
  });

  it("config line: full logged params + 'tournament mode', falling back to 'not logged' without a summary (R4)", () => {
    const model = tournamentReplayModel(fx.tournament.trace, fx.tournament.ref);
    const { container } = render(<TournamentReplayScreen model={model} onBack={() => {}} />);
    expect(container.querySelector(".nr-cfg")!.textContent).toBe("config v1 · not logged · tournament mode");
  });
});

describe("TournamentReplayScreen (P4)", () => {
  it("ModeBadge TOURNAMENT, nuestra reserva presente, estimate y mensajes del rival como texto", () => {
    const model = tournamentReplayModel(fx.tournament.trace, fx.tournament.ref);
    const { container } = render(<TournamentReplayScreen model={model} onBack={() => {}} />);
    expect(screen.getByText("TOURNAMENT")).toBeTruthy();
    expect(screen.getByText("Estimate of their reserve by round")).toBeTruthy();
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain(RIVAL_HTML);
  });

  it("estimación de la reserva del rival registrada: polyline con puntos y ninguna ronda con explain dice not logged", () => {
    const model = tournamentReplayModel(fx.tournament.trace, fx.tournament.ref);
    expect(model.explain.length).toBeGreaterThan(0);
    expect(model.explain.every((e) => e.rivalReserveEstimate !== null)).toBe(true);
    const { container } = render(<TournamentReplayScreen model={model} onBack={() => {}} />);
    const estimate = container.querySelector("polyline.estimate");
    expect(estimate!.getAttribute("points")!.trim().split(/\s+/).length).toBe(model.explain.length);
    const estimateCard = screen.getByText("Estimate of their reserve by round").closest(".nr-card")!;
    expect(estimateCard.textContent).not.toContain("not logged");
  });

  it("Result/Final offer vienen del binding registrado (agreement/walk), no de la última acción del motor (L3)", () => {
    const base = tournamentReplayModel(fx.tournament.trace, fx.tournament.ref);
    expect(base.outcome).toBeNull();
    const notLogged = render(<TournamentReplayScreen model={base} onBack={() => {}} />);
    expect(notLogged.container.textContent).toContain("not logged");
    notLogged.unmount();

    const agreed = { ...base, outcome: { kind: "agreement" as const, by: "rival" as const, offer: { pct: 5 } } };
    const dealRender = render(<TournamentReplayScreen model={agreed} onBack={() => {}} />);
    expect(screen.getByText("Deal")).toBeTruthy();
    dealRender.unmount();

    const walked = { ...base, outcome: { kind: "walk" as const, by: "rival" as const, offer: null } };
    render(<TournamentReplayScreen model={walked} onBack={() => {}} />);
    expect(screen.getByText("Opponent walked")).toBeTruthy();
  });

  it("sin escenario local coincidente: role · reserve dice 'not logged' (R5), nunca ZOPA ni reserva del rival dibujadas", () => {
    const model = tournamentReplayModel(fx.tournament.trace, null);
    const { container } = render(<TournamentReplayScreen model={model} onBack={() => {}} />);
    expect(screen.queryByText("not available")).toBeNull();
    expect(container.textContent).toContain("Role · reserve");
    expect(container.querySelector("rect.zopa")).toBeNull();
    expect(container.querySelector("line.reserve-them")).toBeNull();
  });
});
