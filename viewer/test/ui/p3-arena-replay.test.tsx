// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { arenaReplayModel, type ArenaReplayModel } from "../../src/model/index.js";
import { ArenaReplayScreen } from "../../src/screens/ArenaReplayScreen.js";
import { generateFixtures, type ViewerFixtures } from "../fixtures.js";

let fx: ViewerFixtures;
beforeAll(async () => {
  fx = await generateFixtures();
});
afterEach(cleanup);

describe("ArenaReplayScreen (P3)", () => {
  it("gráfico, chat y panel de decisión con ZOPA y ambas reservas", () => {
    const line = fx.games.find((g) => g.scenarioId === "price-buyer-wide")!;
    const model = arenaReplayModel(line, fx.traces.get(line.gameId)!);
    render(<ArenaReplayScreen runId={fx.runId} model={model} onBack={() => {}} />);
    expect(screen.getByText("Engine decision this round")).toBeTruthy();
    expect(screen.getByRole("img", { name: /offers from both sides/i })).toBeTruthy();
  });

  it("partida sin traza: indica que no hay traza, sin panel de decisión", () => {
    const line = fx.games[0]!;
    const model = arenaReplayModel(line, null);
    render(<ArenaReplayScreen runId={fx.runId} model={model} onBack={() => {}} />);
    expect(screen.getByText(/no trace recorded/i)).toBeTruthy();
  });

  it("clicar un punto de una ronda resalta el mensaje de esa ronda", () => {
    const line = fx.games.find((g) => g.scenarioId === "price-buyer-wide")!;
    const model = arenaReplayModel(line, fx.traces.get(line.gameId)!);
    const { container } = render(<ArenaReplayScreen runId={fx.runId} model={model} onBack={() => {}} />);
    const firstDot = container.querySelector("circle.dot-us, circle.dot-them")!;
    fireEvent.click(firstDot);
    expect(container.querySelector(".nr-msg.is-highlighted")).toBeTruthy();
  });

  it("el texto del rival con HTML se muestra como texto, nunca como markup", () => {
    const line = fx.games[0]!;
    const base = arenaReplayModel(line, null);
    const model: ArenaReplayModel = { ...base, chat: [{ round: 1, from: "rival", action: "counter", text: "<script>alert(1)</script>", offer: null }] };
    const { container } = render(<ArenaReplayScreen runId={fx.runId} model={model} onBack={() => {}} />);
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText("<script>alert(1)</script>")).toBeTruthy();
  });
});
