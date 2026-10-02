// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
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

  it("la línea de estimación de la reserva del rival se dibuja: serie no vacía y polyline con puntos", () => {
    const line = fx.games.find((g) => g.scenarioId === "price-buyer-wide")!;
    const model = arenaReplayModel(line, fx.traces.get(line.gameId)!);
    const series = model.explain.filter((e) => e.rivalReserveEstimate !== null);
    expect(series.length).toBeGreaterThan(0);
    expect(series.length).toBe(model.explain.length);
    const { container } = render(<ArenaReplayScreen runId={fx.runId} model={model} onBack={() => {}} />);
    const estimate = container.querySelector("polyline.estimate");
    expect(estimate).toBeTruthy();
    expect(estimate!.getAttribute("points")!.trim().split(/\s+/).length).toBe(series.length);
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

  it("grid layout tiene las proporciones correctas: minmax(0,1.35fr) minmax(0,1fr)", () => {
    const line = fx.games.find((g) => g.scenarioId === "price-buyer-wide")!;
    const model = arenaReplayModel(line, fx.traces.get(line.gameId)!);
    const { container } = render(<ArenaReplayScreen runId={fx.runId} model={model} onBack={() => {}} />);
    const gridParent = container.querySelector("[style*='minmax(0, 1.35fr)']");
    expect(gridParent).toBeTruthy();
  });

  it("cuando cambia la ronda, el contenedor de mensajes puede hacer scroll usando data-round", () => {
    const line = fx.games.find((g) => g.scenarioId === "price-buyer-wide")!;
    const model = arenaReplayModel(line, fx.traces.get(line.gameId)!);
    const { container } = render(<ArenaReplayScreen runId={fx.runId} model={model} onBack={() => {}} />);
    const messagesContainer = container.querySelector(".nr-chat") as HTMLElement;
    expect(messagesContainer).toBeTruthy();
    // Los mensajes deben tener el atributo data-round
    const messages = messagesContainer.querySelectorAll("[data-round]");
    expect(messages.length).toBeGreaterThan(0);
    // Cada mensaje debe tener un data-round con un número
    messages.forEach((msg) => {
      const round = msg.getAttribute("data-round");
      expect(round).toBeTruthy();
      expect(!isNaN(Number(round))).toBe(true);
    });
  });

  it("un mensaje con números como '9,3' no tiene código ni mark tags", () => {
    const line = fx.games[0]!;
    const base = arenaReplayModel(line, null);
    const model: ArenaReplayModel = { ...base, chat: [{ round: 1, from: "rival", action: "offer", text: "Te ofrezco 9,3", offer: null }] };
    const { container } = render(<ArenaReplayScreen runId={fx.runId} model={model} onBack={() => {}} />);
    const codeElements = container.querySelectorAll("code");
    const markElements = container.querySelectorAll("mark");
    expect(codeElements.length).toBe(0);
    expect(markElements.length).toBe(0);
    expect(screen.getByText("Te ofrezco 9,3")).toBeTruthy();
  });

  it("muestra selector de partidas cuando se pasan games y onSelectGame", () => {
    const line = fx.games.find((g) => g.scenarioId === "price-buyer-wide")!;
    const model = arenaReplayModel(line, fx.traces.get(line.gameId)!);
    const mockSelectGame = vi.fn();
    render(
      <ArenaReplayScreen
        runId={fx.runId}
        model={model}
        onBack={() => {}}
        games={fx.games}
        onSelectGame={mockSelectGame}
      />
    );
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(select.value).toBe(model.game.gameId);
  });
});
