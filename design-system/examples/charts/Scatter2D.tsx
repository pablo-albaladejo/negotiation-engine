import { Scatter2D } from "@negotiation-ring/design-system";

export function Scatter2DExample() {
  return (
    <Scatter2D
      xDomain={[0, 60]}
      yDomain={[0, 10]}
      xLabel="payment day"
      yLabel="discount %"
      ourOffers={[
        { round: 1, x: 10, y: 1 },
        { round: 2, x: 20, y: 2 },
        { round: 3, x: 30, y: 2.8 },
        { round: 4, x: 40, y: 3.5 },
      ]}
      theirOffers={[
        { round: 1, x: 55, y: 8 },
        { round: 2, x: 48, y: 6.5 },
        { round: 3, x: 42, y: 5 },
        { round: 4, x: 40, y: 3.5 },
      ]}
      isoLines={[
        { points: [{ x: 0, y: 5.5 }, { x: 60, y: 2 }], label: "u = 0.85" },
        { points: [{ x: 0, y: 8 }, { x: 60, y: 4 }], label: "u = 0.75" },
      ]}
      mandate={{ points: [{ x: 0, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 6 }, { x: 0, y: 6 }], label: "region allowed by our mandate" }}
      deal={{ x: 40, y: 3.5, label: "AC_next → deal at 3.5% · day 40" }}
    />
  );
}
