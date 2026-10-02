import { useState } from "react";
import { Tabs } from "@negotiation-ring/design-system";

const items = [
  { id: "replay", label: "Match replay" },
  { id: "compare", label: "Champion vs candidate" },
  { id: "log", label: "Log format" },
  { id: "integration", label: "Technical integration" },
];

export function FirstTabActive() {
  const [selectedId, setSelectedId] = useState("replay");
  return <Tabs items={items} selectedId={selectedId} onSelect={setSelectedId} />;
}

export function SecondTabActive() {
  const [selectedId, setSelectedId] = useState("compare");
  return <Tabs items={items} selectedId={selectedId} onSelect={setSelectedId} />;
}

export function Navigation() {
  const [selectedId, setSelectedId] = useState("replay");
  return <Tabs variant="nav" aria-label="Viewer" items={items} selectedId={selectedId} onSelect={setSelectedId} />;
}
