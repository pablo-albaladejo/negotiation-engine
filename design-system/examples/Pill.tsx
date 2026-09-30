import { Pill } from "@negotiation-ring/design-system";

export function PillExample() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
      <Pill kind="verdict">challenger-v4 pasa a campeón</Pill>
      <Pill kind="rejected">challenger-v5 no pasa: 2 violaciones</Pill>
      <Pill kind="sample">maqueta · datos de ejemplo</Pill>
    </div>
  );
}
