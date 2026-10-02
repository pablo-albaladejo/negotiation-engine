// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

  it("marca la fila del champion con Pill y muestra \'Arena run\' en vez del id crudo", () => {
    const rows = runsModel([{ runId: fx.runId, kind: "arena", summary: fx.summary }]);
    render(<RunsScreen rows={rows} errors={[]} onOpenRun={() => {}} championVersion={fx.summary.config.version} />);
    expect(screen.getByText("Arena run")).toBeTruthy();
    expect(screen.getByText("champion")).toBeTruthy();
  });

  it("sin champion.json (championVersion null) no muestra ningún Pill", () => {
    const rows = runsModel([{ runId: fx.runId, kind: "arena", summary: fx.summary }]);
    render(<RunsScreen rows={rows} errors={[]} onOpenRun={() => {}} championVersion={null} />);
    expect(screen.queryByText("champion")).toBeNull();
  });

  it("misma versión pero config de otro fichero: no es el champion (L10)", () => {
    const summary = { ...fx.summary, config: { ...fx.summary.config, path: "config/candidate.json" } };
    const rows = runsModel([{ runId: fx.runId, kind: "arena", summary }]);
    render(<RunsScreen rows={rows} errors={[]} onOpenRun={() => {}} championVersion={summary.config.version} />);
    expect(screen.queryByText("champion")).toBeNull();
  });

  it("\'Open live view\' es un PrimaryButton que llama a onOpenLive", () => {
    const rows = runsModel([{ runId: fx.runId, kind: "arena", summary: fx.summary }]);
    let opened = false;
    render(<RunsScreen rows={rows} errors={[]} onOpenRun={() => {}} onOpenLive={() => (opened = true)} />);
    const button = screen.getByText("Open live view");
    expect(button.className).toContain("nr-btn-primary");
    fireEvent.click(button);
    expect(opened).toBe(true);
  });

  it("la fila entera es clicable (conveniencia de rat\u00f3n) y lleva a la misma partida que el link", () => {
    const rows = runsModel([{ runId: fx.runId, kind: "arena", summary: fx.summary }]);
    let opens = 0;
    render(<RunsScreen rows={rows} errors={[]} onOpenRun={() => opens++} />);
    const row = screen.getByText(fx.runId).closest("tr")!;
    fireEvent.click(row.querySelector("td")!);
    expect(opens).toBe(1);
  });

  it("clicar el TableLink dentro de la fila no duplica la llamada (INBOX A1)", () => {
    const rows = runsModel([{ runId: fx.runId, kind: "arena", summary: fx.summary }]);
    let opens = 0;
    render(<RunsScreen rows={rows} errors={[]} onOpenRun={() => opens++} />);
    fireEvent.click(screen.getAllByText(fx.runId)[0]!);
    expect(opens).toBe(1);
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
