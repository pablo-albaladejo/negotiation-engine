import { Legend } from "@negotiation-ring/design-system";

export function ArenaLegend() {
  return (
    <Legend>
      <span>
        <i style={{ borderTop: "3px solid var(--us)" }} />
        our offer
      </span>
      <span>
        <i style={{ borderTop: "3px solid var(--them)" }} />
        opponent offer
      </span>
      <span>
        <i style={{ borderTop: "2px dashed var(--us)" }} />
        target curve
      </span>
      <span>
        <i style={{ borderTop: "2px dotted var(--them)" }} />
        estimate of their reserve
      </span>
      <span>
        <i style={{ borderTop: "10px solid var(--zopa)" }} />
        ZOPA (arena only)
      </span>
    </Legend>
  );
}

export function TournamentLegend() {
  return (
    <Legend>
      <span>
        <i style={{ borderTop: "3px solid var(--us)" }} />
        our offer
      </span>
      <span>
        <i style={{ borderTop: "3px solid var(--them)" }} />
        opponent offer
      </span>
    </Legend>
  );
}
