import { useState } from "react";
import { Tabs } from "@negotiation-ring/design-system";

const items = [
  { id: "replay", label: "Repetición de partida" },
  { id: "compare", label: "Campeón vs candidato" },
  { id: "log", label: "Formato del log" },
  { id: "integration", label: "Integración técnica" },
];

export function TabsExample() {
  const [selectedId, setSelectedId] = useState("replay");
  return <Tabs items={items} selectedId={selectedId} onSelect={setSelectedId} />;
}
