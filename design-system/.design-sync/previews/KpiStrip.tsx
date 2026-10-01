import { KpiStrip } from "@negotiation-ring/design-system";

export function MatchWithDeal() {
  return (
    <KpiStrip
      items={[
        { label: "Result", value: "Deal", tone: "deal" },
        { label: "Price", value: "112" },
        { label: "Surplus / ZOPA", value: "0.97" },
        { label: "Rounds", value: "7 / 10" },
        { label: "Role · reserve", value: "seller · 80" },
        { label: "Injections detected", value: "0" },
      ]}
    />
  );
}

export function MatchWithWalkAway() {
  return (
    <KpiStrip
      items={[
        { label: "Result", value: "Walk away", tone: "walk" },
        { label: "Surplus / ZOPA", value: "0" },
        { label: "Rounds", value: "10 / 10" },
        { label: "Role · reserve", value: "buyer · 95" },
      ]}
    />
  );
}
