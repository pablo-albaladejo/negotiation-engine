import { Flag } from "@negotiation-ring/design-system";

export function Neutral() {
  return <Flag kind="neutral">ancla extrema</Flag>;
}

export function Injection() {
  return <Flag kind="injection">inyección</Flag>;
}

export function Decision() {
  return <Flag kind="decision">AC_time · acepta</Flag>;
}

export function Walk() {
  return <Flag kind="walk">se retira</Flag>;
}

export function Fallback() {
  return <Flag kind="fallback">plantilla · timeout LLM</Flag>;
}
