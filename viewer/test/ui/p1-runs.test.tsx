// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { runsModel } from "../../src/model/index.js";
import { RunsScreen } from "../../src/screens/RunsScreen.js";
import { generateFixtures, type ViewerFixtures } from "../fixtures.js";

let fx: ViewerFixtures;
beforeAll(async () => {
  fx = await generateFixtures();
});
afterEach(cleanup);

describe("RunsScreen (P1)", () => {
  it("lista los runs con su summary", () => {
    const rows = runsModel([{ runId: fx.runId, kind: "arena", summary: fx.summary }]);
    render(<RunsScreen rows={rows} errors={[]} onOpenRun={() => {}} />);
    expect(screen.getByText("Runs")).toBeTruthy();
    expect(screen.getByText(fx.runId)).toBeTruthy();
  });

  it("run vacío de la lista: 'No runs yet'", () => {
    render(<RunsScreen rows={[]} errors={[]} onOpenRun={() => {}} />);
    expect(screen.getByText("No runs yet")).toBeTruthy();
  });

  it("muestra el banner de log inválido cuando hay errores", () => {
    const rows = runsModel([{ runId: fx.runId, kind: "arena", summary: fx.summary }]);
    render(
      <RunsScreen
        rows={rows}
        errors={[{ file: "results/r-1003/summary.json", line: null, path: "overall.games", message: "expected number, got string" }]}
        onOpenRun={() => {}}
      />,
    );
    expect(screen.getByText(/results\/r-1003\/summary\.json/)).toBeTruthy();
    expect(screen.getByText(/overall\.games/)).toBeTruthy();
  });
});
