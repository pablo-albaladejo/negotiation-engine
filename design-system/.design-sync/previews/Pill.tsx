import { Pill } from "@negotiation-ring/design-system";

export function Verdict() {
  return <Pill kind="verdict">challenger-v4 becomes champion</Pill>;
}

export function Rejected() {
  return <Pill kind="rejected">challenger-v5 fails: 2 violations</Pill>;
}

export function Sample() {
  return <Pill kind="sample">mock-up · sample data</Pill>;
}

export function Champion() {
  return <Pill kind="champion">champion</Pill>;
}
