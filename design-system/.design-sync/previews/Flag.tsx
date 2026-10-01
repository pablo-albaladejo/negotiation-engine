import { Flag } from "@negotiation-ring/design-system";

export function Neutral() {
  return <Flag kind="neutral">extreme anchor</Flag>;
}

export function Injection() {
  return <Flag kind="injection">injection</Flag>;
}

export function Decision() {
  return <Flag kind="decision">AC_time · accepts</Flag>;
}

export function Walk() {
  return <Flag kind="walk">walks away</Flag>;
}

export function Fallback() {
  return <Flag kind="fallback">template · LLM timeout</Flag>;
}
