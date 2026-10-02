import { Pill } from "@negotiation-ring/design-system";
import React from "react";

export interface MatchSelectorProps {
  games: Array<{ gameId: string }>;
  currentGameId: string;
  onSelectGame: (gameId: string) => void;
}

/**
 * Match selector dropdown for replay screens.
 * Shows available games in the run and allows navigating to a selected game.
 */
export function MatchSelector({ games, currentGameId, onSelectGame }: MatchSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSelectGame(e.target.value);
  };

  return (
    <select
      value={currentGameId}
      onChange={handleChange}
      style={{
        padding: "7px 14px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--line)",
        backgroundColor: "var(--bg)",
        color: "var(--ink)",
        font: "500 13px var(--font-body)",
        cursor: "pointer",
      }}
    >
      {games.map((game) => (
        <option key={game.gameId} value={game.gameId}>
          {game.gameId}
        </option>
      ))}
    </select>
  );
}
