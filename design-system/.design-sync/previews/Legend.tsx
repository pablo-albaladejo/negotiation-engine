import { Legend } from "@negotiation-ring/design-system";

export function ArenaLegend() {
  return (
    <Legend
      items={[
        { kind: "us", label: "our offer" },
        { kind: "them", label: "opponent offer" },
        { kind: "target", label: "target curve" },
        { kind: "estimate", label: "estimate of their reserve" },
        { kind: "reserve-us", label: "our reserve" },
        { kind: "reserve-them", label: "their reserve" },
        { kind: "zopa", label: "ZOPA (arena only)" },
      ]}
    />
  );
}

export function TournamentLegend() {
  return (
    <Legend
      items={[
        { kind: "us", label: "our offer" },
        { kind: "them", label: "opponent offer" },
      ]}
    />
  );
}

/** S3: the two-issue plane (Scatter2D) uses its own kinds -- same-round links and the mandate polygon
 * -- neither of which appear in the offer-chart legends above. */
export function TwoIssueLegend() {
  return (
    <Legend
      items={[
        { kind: "us", label: "our offers" },
        { kind: "them", label: "opponent offers" },
        { kind: "same-round", label: "same round" },
        { kind: "mandate", label: "mandate" },
      ]}
    />
  );
}
