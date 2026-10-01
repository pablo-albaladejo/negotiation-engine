// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StatesScreen } from "../../src/screens/StatesScreen.js";

afterEach(cleanup);

describe("StatesScreen (P8)", () => {
  it("log inválido: fichero, línea, campo y líneas válidas cargadas", () => {
    render(<StatesScreen />);
    expect(screen.getByText(/results\/r-1003\.jsonl · line 1834/)).toBeTruthy();
    expect(screen.getByText("offer.value", { exact: false })).toBeTruthy();
    expect(screen.getByText(/1833 valid lines loaded/)).toBeTruthy();
  });

  it("run vacío", () => {
    render(<StatesScreen />);
    expect(screen.getByText("r-1005 has no matches")).toBeTruthy();
  });

  it("carga en curso con progreso, ninguna pantalla en blanco", () => {
    const { container } = render(<StatesScreen />);
    expect(screen.getByText(/1240 \/ 2646 matches/)).toBeTruthy();
    expect(container.textContent?.trim().length).toBeGreaterThan(0);
  });
});
