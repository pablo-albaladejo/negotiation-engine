import { Pill } from "@negotiation-ring/design-system";

export function PillExample() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
      <Pill kind="verdict">challenger-v4 becomes champion</Pill>
      <Pill kind="rejected">challenger-v5 fails: 2 violations</Pill>
      <Pill kind="sample">mockup · sample data</Pill>
    </div>
  );
}
