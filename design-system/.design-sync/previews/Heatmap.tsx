import { Heatmap } from "@negotiation-ring/design-system";

export function ComparisonByOpponent() {
  return (
    <Heatmap
      columns={["as seller", "as buyer"]}
      rows={[
        { rival: "Boulware", cells: [{ label: "0.71", value: 0.71 }, { label: "0.52", value: 0.52 }] },
        { rival: "Conceder", cells: [{ label: "0.83", value: 0.83 }, { label: "0.77", value: 0.77 }] },
        { rival: "Inject+Voss", cells: [{ label: "0.69", value: 0.69 }, { label: "0.55", value: 0.55 }] },
        { rival: "Extreme anchor", cells: [{ label: "0.54", value: 0.54 }, { label: "0.38", value: 0.38 }] },
      ]}
    />
  );
}

export function CustomRowHeader() {
  return (
    <Heatmap
      rowHeader="Opponent"
      columns={["as seller", "as buyer"]}
      rows={[
        { rival: "Boulware", cells: [{ label: "0.71", value: 0.71 }, { label: "0.52", value: 0.52 }] },
        { rival: "Conceder", cells: [{ label: "0.83", value: 0.83 }, { label: "0.77", value: 0.77 }] },
      ]}
    />
  );
}

export function GoodBand() {
  return (
    <Heatmap
      columns={["as seller", "as buyer"]}
      rows={[{ rival: "Conceder", cells: [{ label: "0.83", value: 0.83 }, { label: "0.77", value: 0.77 }] }]}
    />
  );
}

export function MidBand() {
  return (
    <Heatmap
      columns={["as seller", "as buyer"]}
      rows={[{ rival: "Boulware", cells: [{ label: "0.52", value: 0.52 }, { label: "0.48", value: 0.48 }] }]}
    />
  );
}

export function LowBand() {
  return (
    <Heatmap
      columns={["as seller", "as buyer"]}
      rows={[{ rival: "Extreme anchor", cells: [{ label: "0.38", value: 0.38 }, { label: "0.29", value: 0.29 }] }]}
    />
  );
}

export function MissingData() {
  return (
    <Heatmap
      columns={["as seller", "as buyer"]}
      rows={[
        { rival: "Tit-for-tat", cells: [{ label: "0.62", value: 0.62 }, { label: "n/a", value: null }] },
        { rival: "Liar", cells: [{ label: "n/a", value: null }, { label: "0.44", value: 0.44 }] },
      ]}
    />
  );
}
