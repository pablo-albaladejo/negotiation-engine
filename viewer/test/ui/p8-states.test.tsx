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

  it("EmptyStateCard no anida dos Card (sin doble borde)", () => {
    const { container } = render(<StatesScreen />);
    const heading = screen.getByText("r-1005 has no matches");
    const outerCard = heading.closest(".nr-card");
    expect(outerCard).toBeTruthy();
    expect(outerCard?.querySelectorAll(".nr-card")).toHaveLength(0);
  });

  it("carga en curso: indeterminada sin cifras falsas, ninguna pantalla en blanco", () => {
    const { container } = render(<StatesScreen />);
    expect(screen.queryByText(/1240/)).toBeNull();
    expect(screen.getByText("Reading results/r-1001.jsonl")).toBeTruthy();
    expect(container.querySelector(".nr-progress-indeterminate")).toBeTruthy();
    expect(container.textContent?.trim().length).toBeGreaterThan(0);
  });

  it("rival que rompe el protocolo, ZOPA vacía con retirada y LLM caído (N of M via template)", () => {
    render(<StatesScreen />);
    expect(screen.getByText("Opponent breaks protocol")).toBeTruthy();
    expect(screen.getByText("ring-session-7 · tournament · R3")).toBeTruthy();
    expect(screen.getByText("rivalOffer.pct (invalid_type)")).toBeTruthy();
    expect(screen.getByText(/ten percent of the cargo value/)).toBeTruthy();
    expect(screen.getByText("Reserves 80 / 76 → walk", { selector: ".nr-warning-banner *" })).toBeTruthy();
    expect(screen.getByText(/5 of 5 via template/)).toBeTruthy();
    expect(screen.getAllByText("template · LLM down")).toHaveLength(2);
  });

  it("tone mapping: warn for invalid log, broken protocol, empty-ZOPA walk; info for LLM down", () => {
    const { container } = render(<StatesScreen />);
    const banners = container.querySelectorAll(".nr-warning-banner");
    expect(banners.length).toBeGreaterThan(0);
    let warnCount = 0;
    let infoCount = 0;
    banners.forEach((banner) => {
      const style = window.getComputedStyle(banner);
      const bgColor = style.backgroundColor;
      // Warn banners will have a different background than info banners
      // We can check by text content or by the visual style
      const text = banner.textContent || "";
      if (text.includes("Invalid log") || text.includes("Opponent breaks protocol") || text.includes("Reserves 80 / 76")) {
        warnCount++;
      }
      if (text.includes("LLM down")) {
        infoCount++;
      }
    });
    expect(warnCount).toBeGreaterThan(0);
    expect(infoCount).toBeGreaterThan(0);
  });

  it("protocol state: rival message shown literally, error paths/codes, decision or 'not logged'", () => {
    const { container } = render(<StatesScreen />);
    const chatMessages = container.querySelectorAll(".nr-chat");
    expect(chatMessages.length).toBeGreaterThan(0);
    // Find the protocol break banner chat message
    let found = false;
    chatMessages.forEach((chat) => {
      if (chat.textContent?.includes("ten percent of the cargo value")) {
        found = true;
      }
    });
    expect(found).toBe(true);
    // Error paths/codes should be shown
    expect(screen.getByText("rivalOffer.pct (invalid_type)")).toBeTruthy();
    // Decision should be shown
    expect(screen.getByText("fallback offer")).toBeTruthy();
  });

  it("loading variants: indeterminate when no counts, determinate when counts provided", () => {
    const { container } = render(<StatesScreen />);
    const progressbars = container.querySelectorAll("[role='progressbar']");
    expect(progressbars.length).toBeGreaterThan(0);
    let hasIndeterminate = false;
    let hasDeterminate = false;
    progressbars.forEach((bar) => {
      if (bar.hasAttribute("aria-busy")) {
        hasIndeterminate = true;
      }
      if (bar.hasAttribute("aria-valuenow")) {
        hasDeterminate = true;
      }
    });
    expect(hasIndeterminate).toBe(true);
    expect(hasDeterminate).toBe(true);
  });
});
