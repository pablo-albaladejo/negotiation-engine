import { Flag } from "@negotiation-ring/design-system";

export function FlagExample() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      <Flag kind="neutral">ancla extrema</Flag>
      <Flag kind="neutral">objetivo 118,4</Flag>
      <Flag kind="injection">inyección</Flag>
      <Flag kind="decision">AC_time · acepta</Flag>
      <Flag kind="walk">se retira</Flag>
      <Flag kind="fallback">plantilla · timeout LLM</Flag>
    </div>
  );
}
