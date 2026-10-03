import { Heatmap } from "@negotiation-ring/design-system";

export function HeatmapExample() {
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
