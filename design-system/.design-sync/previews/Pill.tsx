import { Pill } from "@negotiation-ring/design-system";

export function Verdict() {
  return <Pill kind="verdict">challenger-v4 pasa a campeón</Pill>;
}

export function Rejected() {
  return <Pill kind="rejected">challenger-v5 no pasa: 2 violaciones</Pill>;
}

export function Sample() {
  return <Pill kind="sample">maqueta · datos de ejemplo</Pill>;
}
