import { ModeBadge } from "@negotiation-ring/design-system";
import { BackLink } from "./buttons.js";
import { MatchSelector, type MatchSelectorGame } from "./match-selector.js";

export interface ReplayHeaderProps {
  onBack: () => void;
  backLabel: string;
  gameId: string;
  rival: string;
  mode?: "arena" | "tournament";
  games?: Array<MatchSelectorGame>;
  onSelectGame?: (gameId: string) => void;
}

/**
 * Single header row shared by the arena and two-issue replay screens: one back link, one
 * ModeBadge and one "id · vs rival" heading, with the match selector below (INBOX finding:
 * ArenaReplayScreen/TwoIssueScreen used to duplicate this row).
 */
export function ReplayHeader({ onBack, backLabel, gameId, rival, mode = "arena", games, onSelectGame }: ReplayHeaderProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <BackLink onClick={onBack}>{backLabel}</BackLink>
        <ModeBadge mode={mode} />
        <h2 className="nr-heading">
          {gameId} · vs {rival}
        </h2>
      </div>
      {games && onSelectGame ? <MatchSelector games={games} currentGameId={gameId} onSelectGame={onSelectGame} /> : null}
    </div>
  );
}
