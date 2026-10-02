import { ModeBadge } from "@negotiation-ring/design-system";
import { BackLink } from "./buttons.js";
import { MatchSelector, type MatchSelectorGame } from "./match-selector.js";

export interface ReplayHeaderProps {
  onBack: () => void;
  backLabel: string;
  gameId: string;
  /** Omitted for modes with no single logged opponent (e.g. a tournament session). */
  rival?: string;
  mode?: "arena" | "tournament";
  games?: Array<MatchSelectorGame>;
  onSelectGame?: (gameId: string) => void;
}

/**
 * Header shared by the arena, two-issue and tournament replay screens: the back link on its own
 * line, then a badge slot with the "id[ · vs rival]" heading, with the match selector below
 * (INBOX finding: ArenaReplayScreen/TwoIssueScreen used to duplicate this row; rival is only
 * shown when logged, never invented).
 */
export function ReplayHeader({ onBack, backLabel, gameId, rival, mode = "arena", games, onSelectGame }: ReplayHeaderProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <BackLink onClick={onBack}>{backLabel}</BackLink>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <ModeBadge mode={mode} />
        <h2 className="nr-heading-lg">{rival ? `${gameId} · vs ${rival}` : gameId}</h2>
      </div>
      {games && onSelectGame ? <MatchSelector games={games} currentGameId={gameId} onSelectGame={onSelectGame} /> : null}
    </div>
  );
}
