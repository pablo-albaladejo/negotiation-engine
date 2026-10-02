export interface ScoreboardProps {
  badge: string;
  us: string;
  rival: string;
  round: number | null;
  rounds: number;
  attacksBlocked: number | null;
}

export function Scoreboard({ badge, us, rival, round, rounds, attacksBlocked }: ScoreboardProps) {
  const attacksClass = ["nr-scoreboard-value", attacksBlocked !== null && attacksBlocked > 0 ? "nr-scoreboard-attacks" : "nr-scoreboard-attacks-muted"].join(" ");
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
            {round === null ? "—" : round}/{rounds}
          </span>
          <span className="nr-scoreboard-label">round</span>
        </div>
        <div className="nr-scoreboard-stat">
          <span className={attacksClass}>{attacksBlocked === null ? "—" : attacksBlocked}</span>
          <span className="nr-scoreboard-label">attacks blocked</span>
        </div>
      </div>
    </div>
  );
}
