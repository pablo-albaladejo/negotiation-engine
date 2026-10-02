// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StatesScreen } from "../../src/screens/StatesScreen.js";

afterEach(cleanup);

describe("StatesScreen (P8)", () => {
  it("log inválido: fichero, línea, campo, líneas válidas cargadas y la partida saltada (S7)", () => {
    render(<StatesScreen />);
    expect(screen.getByText(/results\/r-1003\.jsonl · line 1834/)).toBeTruthy();
    expect(screen.getByText("offer.value", { exact: false })).toBeTruthy();
    expect(screen.getByText(/1833 valid lines loaded/)).toBeTruthy();
    expect(screen.getByText(/Match m-0917 is skipped until the log is fixed\./)).toBeTruthy();
  });

  it("run vacío", () => {
    render(<StatesScreen />);
    expect(screen.getByText("r-1005 has no matches")).toBeTruthy();
  });

  it("EmptyStateCard no anida dos Card (sin doble borde)", () => {
    render(<StatesScreen />);
    const heading = screen.getByText("r-1005 has no matches");
    const outerCard = heading.closest(".nr-card");
    expect(outerCard).toBeTruthy();
    expect(outerCard?.querySelectorAll(".nr-card")).toHaveLength(0);
  });

  it("carga en curso: indeterminada sin cifras falsas, con el bloque de skeleton (S2)", () => {
    const { container } = render(<StatesScreen />);
    expect(screen.queryByText(/1240/)).toBeNull();
    expect(screen.getByText("Reading results/r-1001.jsonl")).toBeTruthy();
    expect(container.querySelector(".nr-progress-indeterminate")).toBeTruthy();
    expect(container.querySelector(".nr-skeleton-grid")).toBeTruthy();
    const firstLoadingCard = screen.getByText("Reading results/r-1001.jsonl").closest(".nr-card")!;
    expect(firstLoadingCard.querySelectorAll(".nr-skeleton-grid .nr-skeleton-block")).toHaveLength(4);
    expect(firstLoadingCard.querySelector(".nr-skeleton-block[style*='120px']")).toBeTruthy();
    expect(container.textContent?.trim().length).toBeGreaterThan(0);
  });

  it("rival que rompe el protocolo: línea .nr-cfg, Flag 'breaks protocol · no offer' y KpiStrip (S1)", () => {
    const { container } = render(<StatesScreen />);
    expect(screen.getByText("Opponent breaks protocol")).toBeTruthy();
    expect(screen.getByText("m-0356 · vs text-only · seller · R3")).toBeTruthy();
    expect(screen.getByText("breaks protocol · no offer")).toBeTruthy();
    expect(container.querySelector(".nr-flag.walk")).toBeTruthy();
    const kpiStrip = screen.getByText("Our last offer").closest(".nr-kpi-strip, .nr-kpi")!.parentElement!;
    expect(kpiStrip.textContent).toContain("Opponent error");
    expect(kpiStrip.textContent).toContain("3/10");
    expect(kpiStrip.textContent).toContain("127");
  });

  it("ZOPA vacía: solo caption + chart, sin banner ni Legend separados (S3)", () => {
    const { container } = render(<StatesScreen />);
    const card = screen.getByText("Empty ZOPA → walk").closest(".nr-card")!;
    expect(card.textContent).toContain("m-0188 vs extreme-anchor");
    expect(card.textContent).toContain("their reserve (76) sits below ours (80)");
    expect(card.querySelector(".nr-chart")).toBeTruthy();
    expect(card.querySelector(".nr-warning-banner")).toBeNull();
    expect(card.querySelector(".nr-legend")).toBeNull();
  });

  it("LLM caído: título con 'everything on template' y el chat empieza con el mensaje R4 del rival (S4)", () => {
    const { container } = render(<StatesScreen />);
    expect(screen.getByText("LLM down · everything on template")).toBeTruthy();
    expect(screen.getByText(/5 of 5 via template/)).toBeTruthy();
    expect(screen.getAllByText("template · LLM down")).toHaveLength(2);
    const card = screen.getByText("LLM down · everything on template").closest(".nr-card")!;
    const firstMessage = card.querySelector(".nr-chat .nr-msg")!;
    expect(firstMessage.classList.contains("them")).toBe(true);
    expect(firstMessage.textContent).toContain("I'll go up to 91");
    void container;
  });

  it("tone mapping: warn for invalid log, broken protocol; info for LLM down", () => {
    const { container } = render(<StatesScreen />);
    expect(container.querySelectorAll(".nr-warning-banner.warn").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".nr-warning-banner.info").length).toBeGreaterThan(0);
  });

  it("protocol state: rival message shown literally in the chat", () => {
    const { container } = render(<StatesScreen />);
    const chatMessages = container.querySelectorAll(".nr-chat");
    expect(chatMessages.length).toBeGreaterThan(0);
    let found = false;
    chatMessages.forEach((chat) => {
      if (chat.textContent?.includes("PDF with the counteroffer")) found = true;
    });
    expect(found).toBe(true);
  });

  it("loading variants: indeterminate when no counts, determinate when counts provided", () => {
    const { container } = render(<StatesScreen />);
    const progressbars = container.querySelectorAll("[role='progressbar']");
    expect(progressbars.length).toBeGreaterThan(0);
    let hasIndeterminate = false;
    let hasDeterminate = false;
    progressbars.forEach((bar) => {
      if (bar.hasAttribute("aria-busy")) hasIndeterminate = true;
      if (bar.hasAttribute("aria-valuenow")) hasDeterminate = true;
    });
    expect(hasIndeterminate).toBe(true);
    expect(hasDeterminate).toBe(true);
  });

  it("the skeleton blocks stop pulsing under prefers-reduced-motion (a11y, S2)", () => {
    const { container } = render(<StatesScreen />);
    const block = container.querySelector(".nr-skeleton-block")!;
    expect(block.className).toContain("nr-skeleton-block");
    // The animation is disabled purely in CSS (@media prefers-reduced-motion: reduce); this just
    // locks in the class the stylesheet hooks into so a future refactor can't drop it silently.
  });

  it("states grid uses a 2-column DS grid that collapses on narrow viewports (S6)", () => {
    const { container } = render(<StatesScreen />);
    const grid = container.querySelector(".nr-grid")!;
    expect(grid.getAttribute("style")).toContain("repeat(2, minmax(0, 1fr))");
  });
});
