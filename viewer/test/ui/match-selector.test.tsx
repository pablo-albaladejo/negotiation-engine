// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MatchSelector } from "../../src/ui/match-selector.js";

afterEach(cleanup);

describe("MatchSelector protocol-violation attribution (C7)", () => {
  it("uses metrics.protocolViolation when protocolViolation.by is not logged, like the table/KpiStrip", () => {
    render(
      <MatchSelector
        games={[{ gameId: "g-1", rival: "bob", endReason: "protocol-violation", metrics: { protocolViolation: "rival" } }]}
        currentGameId="g-1"
        onSelectGame={() => {}}
      />,
    );
    expect(screen.getByText("Opponent protocol violation")).toBeTruthy();
  });

  it("prefers protocolViolation.by over metrics.protocolViolation when both are logged", () => {
    render(
      <MatchSelector
        games={[
          {
            gameId: "g-1",
            rival: "bob",
            endReason: "protocol-violation",
            protocolViolation: { by: "agent" },
            metrics: { protocolViolation: "rival" },
          },
        ]}
        currentGameId="g-1"
        onSelectGame={() => {}}
      />,
    );
    expect(screen.getByText("Our protocol violation")).toBeTruthy();
  });

  it("falls back to the generic label when neither source logs who broke the protocol", () => {
    render(
      <MatchSelector
        games={[{ gameId: "g-1", rival: "bob", endReason: "protocol-violation" }]}
        currentGameId="g-1"
        onSelectGame={() => {}}
      />,
    );
    expect(screen.getByText("Protocol violation")).toBeTruthy();
  });

  it("selecting a game calls onSelectGame with its id", () => {
    const onSelectGame = vi.fn();
    render(
      <MatchSelector games={[{ gameId: "g-1" }, { gameId: "g-2" }]} currentGameId="g-1" onSelectGame={onSelectGame} />,
    );
    screen.getByText("g-2").click();
    expect(onSelectGame).toHaveBeenCalledWith("g-2");
  });
});
