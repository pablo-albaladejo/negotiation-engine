// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { tournamentReplayModel } from "../../src/model/index.js";
import { TournamentReplayScreen } from "../../src/screens/TournamentReplayScreen.js";
import { generateFixtures, RIVAL_HTML, type ViewerFixtures } from "../fixtures.js";

let fx: ViewerFixtures;
beforeAll(async () => {
  fx = await generateFixtures();
});
afterEach(cleanup);

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

    const agreed = { ...base, outcome: { kind: "agreement" as const, offer: { pct: 5 } } };
    const dealRender = render(<TournamentReplayScreen model={agreed} onBack={() => {}} />);
    expect(screen.getByText("Deal")).toBeTruthy();
    dealRender.unmount();

    const walked = { ...base, outcome: { kind: "walk" as const, offer: null } };
    render(<TournamentReplayScreen model={walked} onBack={() => {}} />);
    expect(screen.getByText("Opponent walked")).toBeTruthy();
  });

  it("sin escenario local coincidente: our reserve not available, nunca ZOPA ni reserva del rival dibujadas", () => {
    const model = tournamentReplayModel(fx.tournament.trace, null);
    const { container } = render(<TournamentReplayScreen model={model} onBack={() => {}} />);
    expect(screen.getByText("not available")).toBeTruthy();
    expect(container.querySelector("rect.zopa")).toBeNull();
    expect(container.querySelector("line.reserve-them")).toBeNull();
  });
});
