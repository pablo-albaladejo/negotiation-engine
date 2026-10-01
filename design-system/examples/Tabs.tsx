import { useState } from "react";
import { Tabs } from "@negotiation-ring/design-system";

const items = [
  { id: "replay", label: "Match replay" },
  { id: "compare", label: "Champion vs challenger" },
  { id: "log", label: "Log format" },
  { id: "integration", label: "Technical integration" },
];

export function TabsExample() {
  const [selectedId, setSelectedId] = useState("replay");
  return <Tabs items={items} selectedId={selectedId} onSelect={setSelectedId} />;
}
