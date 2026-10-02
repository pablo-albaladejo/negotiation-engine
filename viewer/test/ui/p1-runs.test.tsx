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

  it("H4: el texto vacío menciona el pickup automático de logs JSONL", () => {
    const { container } = render(<RunsScreen rows={[]} errors={[]} onOpenRun={() => {}} />);
    expect(container.textContent).toContain("Run pnpm arena and the viewer will pick up the JSONL logs automatically.");
  });

  it("marca la fila del champion con un Pill en la columna Status", () => {
    const rows = runsModel([{ runId: fx.runId, kind: "arena", summary: fx.summary }]);
    render(<RunsScreen rows={rows} errors={[]} onOpenRun={() => {}} championVersion={fx.summary.config.version} />);
    expect(screen.getByText("champion")).toBeTruthy();
  });

  it("fecha en ingles, hora local, p. ej. 'Oct 1, 2026 09:42'", () => {
    const summary = { ...fx.summary, createdAt: "2026-10-01T09:42:00.000Z" };
    const rows = runsModel([{ runId: fx.runId, kind: "arena", summary }]);
    render(<RunsScreen rows={rows} errors={[]} onOpenRun={() => {}} />);
    const expected = (() => {
      const d = new Date(summary.createdAt);
      const month = d.toLocaleString("en-US", { month: "short" });
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${month} ${d.getDate()}, ${d.getFullYear()} ${hh}:${mm}`;
    })();
    expect(screen.getByText(expected)).toBeTruthy();
  });

  it("Leaks > 0 se muestra en tono warn (var(--warn))", () => {
    const summary = { ...fx.summary, overall: { ...fx.summary.overall, leaks: 3 } };
    const rows = runsModel([{ runId: fx.runId, kind: "arena", summary }]);
    render(<RunsScreen rows={rows} errors={[]} onOpenRun={() => {}} />);
    expect(screen.getByText("3").className).toContain("nr-worse");
  });

  it("Leaks = 0 no lleva tono warn", () => {
    const rows = runsModel([{ runId: fx.runId, kind: "arena", summary: { ...fx.summary, overall: { ...fx.summary.overall, leaks: 0 } } }]);
    render(<RunsScreen rows={rows} errors={[]} onOpenRun={() => {}} />);
    for (const cell of screen.getAllByText("0")) expect(cell.className).not.toContain("nr-worse");
  });

  it("el boton 'Compare with champion' solo aparece cuando el run tiene gate.json (kind: promotion)", () => {
    const rows = runsModel([{ runId: fx.runId, kind: "promotion", summary: fx.summary }]);
    render(<RunsScreen rows={rows} errors={[]} onOpenRun={() => {}} onCompareRun={() => {}} />);
    expect(screen.getByText("Compare with champion")).toBeTruthy();
  });

  it("sin gate.json (kind: arena) no se ofrece 'Compare with champion'", () => {
    const rows = runsModel([{ runId: fx.runId, kind: "arena", summary: fx.summary }]);
    render(<RunsScreen rows={rows} errors={[]} onOpenRun={() => {}} onCompareRun={() => {}} />);
    expect(screen.queryByText("Compare with champion")).toBeNull();
  });

  it("'Compare with champion' llama a onCompareRun con el runId", () => {
    const rows = runsModel([{ runId: fx.runId, kind: "promotion", summary: fx.summary }]);
    let compared = "";
    render(<RunsScreen rows={rows} errors={[]} onOpenRun={() => {}} onCompareRun={(id) => (compared = id)} />);
    fireEvent.click(screen.getByText("Compare with champion"));
    expect(compared).toBe(fx.runId);
  });

  it("el boton 'Open' de la fila llama a onOpenRun", () => {
    const rows = runsModel([{ runId: fx.runId, kind: "arena", summary: fx.summary }]);
    let opened = "";
    render(<RunsScreen rows={rows} errors={[]} onOpenRun={(id) => (opened = id)} />);
    fireEvent.click(screen.getByText("Open"));
    expect(opened).toBe(fx.runId);
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
