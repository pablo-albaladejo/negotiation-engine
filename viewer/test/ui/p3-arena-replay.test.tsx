// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { arenaReplayModel, type ArenaReplayModel } from "../../src/model/index.js";
import { ArenaReplayScreen } from "../../src/screens/ArenaReplayScreen.js";
import { matchWindow } from "../../src/ui/match-selector.js";
import { resultLabel, resultTone } from "../../src/ui/labels.js";
import { generateFixtures, type ViewerFixtures } from "../fixtures.js";

let fx: ViewerFixtures;
beforeAll(async () => {
  fx = await generateFixtures();
});
afterEach(cleanup);

describe("ArenaReplayScreen (P3)", () => {
  it("KPI \"Surplus / ZOPA\" se muestra como decimal, nunca como porcentaje", () => {
    const line = fx.games.find((g) => g.scenarioId === "price-buyer-wide")!;
    const model = arenaReplayModel(line, fx.traces.get(line.gameId)!);
    render(<ArenaReplayScreen runId={fx.runId} model={model} onBack={() => {}} />);
    expect(screen.getByText("Surplus / ZOPA")).toBeTruthy();
    expect(screen.queryByText(/%$/)).toBeNull();
  });

  it("la nota bajo la tabla de decisión explica cómo cambiar de ronda", () => {
    const line = fx.games.find((g) => g.scenarioId === "price-buyer-wide")!;
    const model = arenaReplayModel(line, fx.traces.get(line.gameId)!);
    render(<ArenaReplayScreen runId={fx.runId} model={model} onBack={() => {}} />);
    expect(screen.getByText("Select a point on the chart, or use Previous / Next round, to switch rounds. Values exactly as logged by the engine.")).toBeTruthy();
  });

  it("el validador se muestra legible (ok / rejected · motivo), nunca JSON.stringify", () => {
    const line = fx.games.find((g) => g.scenarioId === "price-buyer-wide")!;
    const model = arenaReplayModel(line, fx.traces.get(line.gameId)!);
    const { container } = render(<ArenaReplayScreen runId={fx.runId} model={model} onBack={() => {}} />);
    expect(container.textContent).not.toContain("{\"ok\"");
    expect(container.textContent).toMatch(/ok \(\d+ attempt/);
  });

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

  it("grid layout tiene las proporciones correctas: minmax(0,1.55fr) minmax(320px,1fr) via --nr-grid-cols", () => {
    const line = fx.games.find((g) => g.scenarioId === "price-buyer-wide")!;
    const model = arenaReplayModel(line, fx.traces.get(line.gameId)!);
    const { container } = render(<ArenaReplayScreen runId={fx.runId} model={model} onBack={() => {}} />);
    const gridParent = container.querySelector(".nr-grid") as HTMLElement | null;
    expect(gridParent).toBeTruthy();
    expect(gridParent!.style.getPropertyValue("--nr-grid-cols")).toBe("minmax(0, 1.55fr) minmax(320px, 1fr)");
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
    // MatchSelector del design system: botones con aria-pressed, no un <select> propio.
    expect(screen.queryByRole("combobox")).toBeNull();
    const pressed = screen.getAllByRole("button").filter((b) => b.getAttribute("aria-pressed") === "true");
    expect(pressed).toHaveLength(1);
    expect(pressed[0]!.textContent).toContain(model.game.gameId);
    const other = screen.getAllByRole("button").find((b) => b.getAttribute("aria-pressed") === "false");
    other!.click();
    expect(mockSelectGame).toHaveBeenCalledTimes(1);
    expect(mockSelectGame.mock.calls[0]![0]).not.toBe(model.game.gameId);
  });

  it("header único: un solo back link y un solo ModeBadge aunque haya selector de partidas", () => {
    const line = fx.games.find((g) => g.scenarioId === "price-buyer-wide")!;
    const model = arenaReplayModel(line, fx.traces.get(line.gameId)!);
    const { container } = render(
      <ArenaReplayScreen runId={fx.runId} model={model} onBack={() => {}} games={fx.games} onSelectGame={() => {}} />,
    );
    expect(container.querySelectorAll(".nr-link-back")).toHaveLength(1);
    expect(container.querySelectorAll(".nr-mode-badge")).toHaveLength(1);
  });

  it("el selector muestra solo una ventana de partidas vecinas", () => {
    const games = Array.from({ length: 50 }, (_, i) => ({ gameId: `g-${i}`, rival: "boulware", endReason: "agreement" }));
    expect(matchWindow(games, "g-25").map((g) => g.gameId)).toEqual(["g-22", "g-23", "g-24", "g-25", "g-26", "g-27", "g-28"]);
    expect(matchWindow(games, "g-0")).toHaveLength(4);
    expect(resultTone("agent-walk")).toBe("walk");
    expect(resultLabel("agent-walk").label).toBe("We walked");
    expect(resultLabel(undefined).label).toBe("not logged");
  });

  it("protocol-violation: label depends on who broke it (line.protocolViolation?.by ?? metrics.protocolViolation)", () => {
    expect(resultLabel("protocol-violation", "rival").label).toBe("Opponent protocol violation");
    expect(resultLabel("protocol-violation", "agent").label).toBe("Our protocol violation");
    expect(resultLabel("protocol-violation").label).toBe("Protocol violation");
    expect(resultLabel("rival-error").label).toBe("Opponent error");
    // Distinct raw ids never collide on the same label, so the Filters dropdown never shows two identical options.
    expect(resultLabel("rival-error").label).not.toBe(resultLabel("protocol-violation").label);
  });
});
