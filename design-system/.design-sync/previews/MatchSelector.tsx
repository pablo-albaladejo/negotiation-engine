import { useState } from "react";
import { MatchSelector, type Match } from "@negotiation-ring/design-system";

const matches: Match[] = [
  { id: "m-0107", rival: "Boulware", result: "deal", label: "deal at 112 · surplus 0.97" },
  { id: "m-0142", rival: "Inject+Voss", result: "deal", label: "deal at 104 · surplus 0.80" },
  { id: "m-0188", rival: "Extreme anchor", result: "walk", label: "walk away · 0" },
];

export function DealSelected() {
  const [selectedId, setSelectedId] = useState("m-0107");
  return <MatchSelector matches={matches} selectedId={selectedId} onSelect={setSelectedId} />;
}

export function WalkAwaySelected() {
  const [selectedId, setSelectedId] = useState("m-0188");
  return <MatchSelector matches={matches} selectedId={selectedId} onSelect={setSelectedId} />;
}
