// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { TraceLine } from "../../../src/pipeline/trace.js";
import { arenaReplayModel, tournamentReplayModel } from "../../src/model/index.js";
import { ArenaReplayScreen } from "../../src/screens/ArenaReplayScreen.js";
import { TournamentReplayScreen } from "../../src/screens/TournamentReplayScreen.js";
import { generateFixtures, type ViewerFixtures } from "../fixtures.js";

let fx: ViewerFixtures;
beforeAll(async () => {
  fx = await generateFixtures();
});
afterEach(cleanup);

const box = (round: number, name: string, output: unknown, result: "ok" | "fallback" | "error"): TraceLine =>
  ({ kind: "box", sessionId: "ring-session-1", round, box: name, input: null, output, result, latencyMs: 1, provider: "claude-cli" }) as TraceLine;

describe("P8 sobre datos reales: P4 (torneo) y P3 (arena)", () => {
  it("P4: registro protocol ⇒ banner con rutas y códigos; todo por plantilla ⇒ 'N of M via template' y bandera en cada burbuja nuestra", () => {
    const trace = [
      ...fx.tournament.trace,
      ...[1, 2, 3].map((r) => box(r, "template", { text: "t" }, "fallback")),
      box(4, "protocol", { issues: [{ path: "rivalOffer.pct", code: "invalid_type" }] }, "error"),
    ];
    const model = tournamentReplayModel(trace, fx.tournament.ref);
    expect(model.protocol).toEqual([{ round: 4, issues: [{ path: "rivalOffer.pct", code: "invalid_type" }] }]);
    const { container } = render(<TournamentReplayScreen model={model} />);
    expect(screen.getByText("Opponent breaks protocol · R4")).toBeTruthy();
    expect(screen.getByText("rivalOffer.pct (invalid_type)")).toBeTruthy();
    expect(screen.getByText(/LLM down · LLM_PROVIDER claude-cli · everything on template/)).toBeTruthy();
    expect(screen.getByText(/3 of 3 via template/)).toBeTruthy();
    expect(container.querySelectorAll(".nr-chat .nr-flag.fallback")).toHaveLength(3);
  });

  it("P4 sin protocol ni plantilla: sin banners", () => {
    const { container } = render(<TournamentReplayScreen model={tournamentReplayModel(fx.tournament.trace, fx.tournament.ref)} />);
    expect(container.querySelector(".nr-warning-banner")).toBeNull();
  });

  it("P3: ZOPA vacía con retirada ⇒ banner con ambas reservas registradas", () => {
    const line = fx.games.find((g) => g.metrics.zopaEmpty && g.endReason === "agent-walk")!;
    render(<ArenaReplayScreen runId={fx.runId} model={arenaReplayModel(line, fx.traces.get(line.gameId)!)} onBack={() => {}} />);
    expect(screen.getByText(/^Reserves .* → walk$/)).toBeTruthy();
    expect(screen.getByText(/do not overlap: no deal is possible/)).toBeTruthy();
  });

  it("P3: rival-error ⇒ banner de protocolo con el error registrado", () => {
    const base = fx.games.find((g) => !g.metrics.zopaEmpty)!;
    const line = { ...base, endReason: "rival-error" as const, error: "Turno inválido: offer" };
    render(<ArenaReplayScreen runId={fx.runId} model={arenaReplayModel(line, null)} onBack={() => {}} />);
    expect(screen.getByText(`Opponent breaks protocol · R${base.rounds}`)).toBeTruthy();
    expect(screen.getByText("Turno inválido: offer")).toBeTruthy();
  });
});
