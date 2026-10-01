import { ModeBadge } from "@negotiation-ring/design-system";

export function ModeBadgeExample() {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <ModeBadge mode="arena" />
      <ModeBadge mode="tournament" />
    </div>
  );
}
