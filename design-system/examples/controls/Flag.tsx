import { Flag } from "@negotiation-ring/design-system";

export function FlagExample() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      <Flag kind="neutral">extreme anchor</Flag>
      <Flag kind="neutral">target 118.4</Flag>
      <Flag kind="injection">injection</Flag>
      <Flag kind="decision">AC_time · accepts</Flag>
      <Flag kind="walk">walks away</Flag>
      <Flag kind="fallback">template · LLM timeout</Flag>
    </div>
  );
}
