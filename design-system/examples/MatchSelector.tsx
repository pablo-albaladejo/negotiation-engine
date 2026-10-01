import { useState } from "react";
import { MatchSelector, type Match } from "@negotiation-ring/design-system";

const matches: Match[] = [
  { id: "m-0107", rival: "Boulware", result: "deal", label: "trato a 112 · excedente 0,97" },
  { id: "m-0142", rival: "Inject+Voss", result: "deal", label: "trato a 104 · excedente 0,80" },
  { id: "m-0188", rival: "Ancla extrema", result: "walk", label: "retirada · 0" },
];

export function MatchSelectorExample() {
  const [selectedId, setSelectedId] = useState("m-0107");
  return <MatchSelector matches={matches} selectedId={selectedId} onSelect={setSelectedId} />;
}
