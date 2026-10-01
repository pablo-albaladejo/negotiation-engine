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
    const { container } = render(<TournamentReplayScreen model={model} />);
    expect(screen.getByText("TOURNAMENT")).toBeTruthy();
    expect(screen.getByText("Estimate of their reserve by round")).toBeTruthy();
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain(RIVAL_HTML);
  });

  it("sin escenario local coincidente: our reserve not available, nunca ZOPA ni reserva del rival dibujadas", () => {
    const model = tournamentReplayModel(fx.tournament.trace, null);
    const { container } = render(<TournamentReplayScreen model={model} />);
    expect(screen.getByText("not available")).toBeTruthy();
    expect(container.querySelector("rect.zopa")).toBeNull();
    expect(container.querySelector("line.reserve-them")).toBeNull();
  });
});
