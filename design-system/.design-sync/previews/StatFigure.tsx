import { StatFigure } from "@negotiation-ring/design-system";

export function FinalEstimateWithComparison() {
  return <StatFigure value="104" tone="them" caption="vs. final offer 112" />;
}

export function OurFinalClose() {
  return <StatFigure value="7.1" tone="us" caption="vs final close" />;
}

export function NoComparisonLogged() {
  return <StatFigure value="not logged" tone="them" />;
}
