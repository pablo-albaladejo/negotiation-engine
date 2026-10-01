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

  it("rival que rompe el protocolo, ZOPA vacía con retirada y LLM caído (N of M via template)", () => {
    render(<StatesScreen />);
    expect(screen.getByText("Opponent breaks protocol · R3")).toBeTruthy();
    expect(screen.getByText("rivalOffer.pct (invalid_type)")).toBeTruthy();
    expect(screen.getByText("Empty ZOPA → walk", { selector: ".nr-warning-banner *" })).toBeTruthy();
    expect(screen.getByText(/5 of 5 via template/)).toBeTruthy();
    expect(screen.getAllByText("template · LLM down")).toHaveLength(2);
  });
});
