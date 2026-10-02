// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { TraceLine } from "../../../src/pipeline/trace.js";
import { applyLiveEvent } from "../../src/live.js";
import { emptyLiveFeed, liveModel, type LiveFeed } from "../../src/model/index.js";
import { parseRoute, routeTo } from "../../src/route.js";
import { LiveScreen } from "../../src/screens/LiveScreen.js";
import { generateFixtures, RIVAL_HTML, type ViewerFixtures } from "../fixtures.js";

let fx: ViewerFixtures;
beforeAll(async () => {
  fx = await generateFixtures();
});
afterEach(cleanup);

const box = (round: number, name: string, output: unknown): TraceLine =>
  ({ kind: "box", sessionId: "ring-session-1", round, box: name, input: null, output, result: "ok", latencyMs: 1 }) as TraceLine;

function feedFrom(lines: readonly TraceLine[]): LiveFeed {
  let feed = applyLiveEvent(emptyLiveFeed(), "session", { runId: "agent-x", session: "ring-session-1-abcd" }, 1_000);
  for (const record of lines) feed = applyLiveEvent(feed, "record", { session: "ring-session-1-abcd", record }, 1_000);
  return applyLiveEvent(feed, "record", { session: "other", record: box(9, "parser", {}) }, 1_000);
}

describe("LiveScreen (P7)", () => {
  it("ruta #/live", () => {
    expect(parseRoute(routeTo.live())).toEqual({ screen: "live" });
  });

  it("LIVE: tema oscuro 1920×1080, marcador con Us, ronda/límite, 3 burbujas con el texto del rival literal", () => {
    const { container } = render(<LiveScreen model={liveModel(feedFrom(fx.tournament.trace))} />);
    const root = container.querySelector("[data-screen='p7']") as HTMLElement;
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(root.style.width).toBe("1920px");
    expect(root.style.height).toBe("1080px");
    expect(screen.getByText("LIVE")).toBeTruthy();
    expect(screen.getByText("Us")).toBeTruthy();
    expect(screen.getByText("3/10")).toBeTruthy();
    expect(container.querySelectorAll(".nr-chat > *")).toHaveLength(3);
    expect(container.textContent).toContain(RIVAL_HTML);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".nr-chart")).toBeTruthy();
  });

  it("un registro parser con injectionSuspected sube el contador sin recargar", () => {
    const feed = feedFrom(fx.tournament.trace);
    const { container, rerender } = render(<LiveScreen model={liveModel(feed)} />);
    const attacksCell = () => container.querySelector(".nr-scoreboard-attacks, .nr-scoreboard-attacks-muted");
    const before = Number(attacksCell()?.textContent);
    rerender(<LiveScreen model={liveModel(applyLiveEvent(feed, "record", { session: "ring-session-1-abcd", record: box(4, "parser", { intent: "offer", injectionSuspected: true }) }, 2_000))} />);
    expect(Number(attacksCell()?.textContent)).toBe(before + 1);
  });

  it("FINISHED con último resultado", () => {
    const lines = [...fx.tournament.trace, box(4, "output", { sessionId: "ring-session-1", round: 4, action: "accept", offer: { pct: 3 }, text: "deal" })];
    const feed = feedFrom(lines);
    const { container } = render(<LiveScreen model={liveModel(feed)} />);
    expect(screen.getByText("FINISHED")).toBeTruthy();
    expect(screen.getByText("Deal at 3")).toBeTruthy();
    // Verify outcome stats are shown
    expect(container.textContent).toContain("outcome");
  });

  it("sin sesión todavía: WAITING, nunca pantalla en blanco", () => {
    const { container } = render(<LiveScreen model={liveModel(emptyLiveFeed())} />);
    expect(screen.getByText("WAITING")).toBeTruthy();
    expect(screen.getByText("Waiting for the next match")).toBeTruthy();
    expect(container.textContent?.trim().length).toBeGreaterThan(0);
  });
});
