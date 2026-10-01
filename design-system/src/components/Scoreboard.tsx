export interface ScoreboardProps {
  badge: string;
  us: string;
  rival: string;
  round: number;
  rounds: number;
  attacksBlocked: number;
}

export function Scoreboard({ badge, us, rival, round, rounds, attacksBlocked }: ScoreboardProps) {
  return (
    <div className="nr-scoreboard">
      <div className="nr-scoreboard-teams">
        <span className="nr-scoreboard-badge">{badge}</span>
        <span className="nr-scoreboard-match">
          <span className="nr-scoreboard-us">{us}</span>
          <span className="nr-scoreboard-vs">vs</span>
          <span className="nr-scoreboard-rival">{rival}</span>
        </span>
      </div>
      <div className="nr-scoreboard-stats">
        <div className="nr-scoreboard-stat">
          <span className="nr-scoreboard-value">
            {round}/{rounds}
          </span>
          <span className="nr-scoreboard-label">round</span>
        </div>
        <div className="nr-scoreboard-stat">
          <span className="nr-scoreboard-value nr-scoreboard-attacks">{attacksBlocked}</span>
          <span className="nr-scoreboard-label">attacks blocked</span>
        </div>
      </div>
    </div>
  );
}
