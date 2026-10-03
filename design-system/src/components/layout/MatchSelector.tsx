export interface Match {
  id: string;
  rival: string;
  result: "deal" | "walk";
  label: string;
}

export interface MatchSelectorProps {
  matches: Match[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function MatchSelector({ matches, selectedId, onSelect }: MatchSelectorProps) {
  return (
    <div className="nr-matches">
      {matches.map((match) => (
        <button
          key={match.id}
          type="button"
          className="nr-match"
          aria-pressed={match.id === selectedId}
          onClick={() => onSelect(match.id)}
        >
          <span>
            <b>{match.id}</b> · vs {match.rival}
          </span>
          <span className={`nr-result ${match.result === "deal" ? "nr-deal" : "nr-walk"}`}>
            {match.label}
          </span>
        </button>
      ))}
    </div>
  );
}
