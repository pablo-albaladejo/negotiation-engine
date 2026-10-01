// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { twoIssueModel } from "../../src/model/index.js";
import { TwoIssueScreen } from "../../src/screens/TwoIssueScreen.js";
import { asV1Trace, generateFixtures, type ViewerFixtures } from "../fixtures.js";

let fx: ViewerFixtures;
beforeAll(async () => {
  fx = await generateFixtures();
});
afterEach(cleanup);

const pctDay = () => fx.games.find((g) => g.scenarioId === "pct-day-buyer-wide")!;

describe("TwoIssueScreen (P5)", () => {
  it("un punto por oferta en el plano día × pct, mandato, utilidades registradas y tabla; sin isoutilidades", () => {
    const line = pctDay();
    const model = twoIssueModel(line, fx.traces.get(line.gameId)!);
    const { container } = render(<TwoIssueScreen runId={fx.runId} model={model} onBack={() => {}} />);
    const plane = screen.getByRole("img", { name: /two issues/i });
    expect(plane.querySelectorAll("circle.dot-us")).toHaveLength(model.offers.ours.length);
    expect(plane.querySelectorAll("circle.dot-them")).toHaveLength(model.offers.rival.length);
    expect(plane.querySelector("polygon.mandate")).toBeTruthy();
    expect(plane.querySelector("polyline.iso")).toBeNull();
    expect(screen.getByText("Utility by round")).toBeTruthy();
    expect(screen.getAllByText(model.rows![0]!.uOffer!.toFixed(2)).length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/iso-utility|NaN/);
  });

  it("traza sin explain: utilidades not logged", () => {
    const line = pctDay();
    render(<TwoIssueScreen runId={fx.runId} model={twoIssueModel(line, asV1Trace(fx.traces.get(line.gameId)!))} onBack={() => {}} />);
    expect(screen.getByText(/utilities not logged/i)).toBeTruthy();
    expect(screen.getAllByText("not logged").length).toBeGreaterThan(0);
  });

  it("sin traza: plano con las ofertas del transcript y aviso de que no hay traza", () => {
    const line = pctDay();
    render(<TwoIssueScreen runId={fx.runId} model={twoIssueModel(line, null)} onBack={() => {}} />);
    expect(screen.getByText(/no trace recorded/i)).toBeTruthy();
    expect(screen.getByText("mandate: not logged")).toBeTruthy();
  });
});
