// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { bazaarModel, type BazaarLiveInfo } from "../../src/model/index.js";
import { BazaarScreen } from "../../src/screens/BazaarScreen.js";

afterEach(cleanup);

const SNAPSHOTS = [
  { ts: "t1", tick: 1, score: 1, neg_points: 1, mm_points: 0, duel_points: 0, ladder_points: 0, rank: 10, delta: { score: 1, neg_points: 1 }, cause: [] },
  {
    ts: "t2",
    tick: 2,
    score: 3.2,
    neg_points: 2.1,
    mm_points: 0,
    duel_points: 0,
    ladder_points: 2.1,
    bench_efficiency: 0.8,
    deals: 1,
    rank: 9,
    delta: { score: 2.2, ladder_points: 2.1, neg_points: 1.1 },
    cause: [{ thread: 7, dealer: "abuela", action: "accept", price: 12 }],
  },
];

const LIVE: BazaarLiveInfo = { team: "Team 2", round: "sat", tick: 2, score: SNAPSHOTS[1]! };

describe("BazaarScreen", () => {
  it("muestra los KPI a partir del último snapshot logueado", () => {
    render(<BazaarScreen model={bazaarModel(SNAPSHOTS)} live={LIVE} />);
    expect(screen.getByText("Bazaar")).toBeTruthy();
    expect(screen.getAllByText("3.2").length).toBeGreaterThan(0); // Score
    expect(screen.getAllByText("9").length).toBeGreaterThan(0); // Rank
    expect(screen.getAllByText("2.1").length).toBeGreaterThan(0); // Negotiating (neg_points)
    expect(screen.getAllByText("0.8").length).toBeGreaterThan(0); // Bench efficiency
  });

  it("cabecera: equipo · ronda · tick desde el endpoint en vivo", () => {
    render(<BazaarScreen model={bazaarModel(SNAPSHOTS)} live={LIVE} />);
    expect(screen.getByText("Team 2 · sat · tick 2")).toBeTruthy();
  });

  it('"not logged" cuando no hay datos en vivo ni snapshots', () => {
    render(<BazaarScreen model={bazaarModel([])} live={null} />);
    expect(screen.getAllByText("not logged").length).toBeGreaterThan(0);
  });

  it("tabla de causas: tick, componente, delta y causa (hilo/dealer/precio)", () => {
    render(<BazaarScreen model={bazaarModel(SNAPSHOTS)} live={LIVE} />);
    expect(screen.getByText("What moved the score")).toBeTruthy();
    expect(screen.getAllByText("accept · abuela · 12").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ladder").length).toBeGreaterThan(0);
  });

  it("Judges: not scored yet", () => {
    render(<BazaarScreen model={bazaarModel(SNAPSHOTS)} live={LIVE} />);
    expect(screen.getByText(/Judges: not scored yet/)).toBeTruthy();
  });

  it("sin snapshots logueados aún: usa la cifra de /api/bazaar/live para los KPI", () => {
    const liveOnly: BazaarLiveInfo = { team: "Team 2", round: "Friday · El Rastro", tick: 27, score: { score: 0, neg_points: 0, mm_points: 0, duel_points: 0, ladder_points: 0, rank: 17 } };
    render(<BazaarScreen model={bazaarModel([])} live={liveOnly} />);
    expect(screen.getByText("Team 2 · Friday · El Rastro · tick 27")).toBeTruthy();
    expect(screen.getAllByText("17").length).toBeGreaterThan(0); // Rank
    expect(screen.getAllByText("0").length).toBeGreaterThan(0); // Score
  });

  it("nunca muestra rarest/luck/luck_private aunque vinieran en el snapshot", () => {
    const { container } = render(
      <BazaarScreen
        model={bazaarModel([{ tick: 1, score: 1, ...( { rarest: "x", luck: 1, luck_private: { seed: 1 } } as Record<string, unknown>) }])}
        live={null}
      />,
    );
    expect(container.textContent).not.toMatch(/rarest|luck/);
  });
});
