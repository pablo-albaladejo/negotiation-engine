import { useState } from "react";
import { Filters } from "@negotiation-ring/design-system";

const rivalOptions = [
  { value: "all", label: "All opponents" },
  { value: "boulware", label: "Boulware" },
  { value: "conceder", label: "Conceder" },
];
const roleOptions = [
  { value: "seller", label: "Seller" },
  { value: "buyer", label: "Buyer" },
];
const resultOptions = [
  { value: "all", label: "All" },
  { value: "deal", label: "Deal" },
  { value: "walk", label: "Walk away" },
];

export function DefaultFilters() {
  const [rival, setRival] = useState("all");
  const [role, setRole] = useState("seller");
  const [result, setResult] = useState("all");
  const [injection, setInjection] = useState(false);
  const [fallback, setFallback] = useState(false);

  return (
    <Filters
      rivalOptions={rivalOptions}
      rival={rival}
      onRivalChange={setRival}
      roleOptions={roleOptions}
      role={role}
      onRoleChange={setRole}
      resultOptions={resultOptions}
      result={result}
      onResultChange={setResult}
      checkboxes={[
        { key: "injection", label: "with injection", checked: injection },
        { key: "fallback", label: "with fallback", checked: fallback },
      ]}
      onCheckboxChange={(key, checked) => {
        if (key === "injection") setInjection(checked);
        if (key === "fallback") setFallback(checked);
      }}
    />
  );
}

export function NarrowedToOneOpponent() {
  const [rival, setRival] = useState("boulware");
  const [role, setRole] = useState("buyer");
  const [result, setResult] = useState("deal");

  return (
    <Filters
      rivalOptions={rivalOptions}
      rival={rival}
      onRivalChange={setRival}
      roleOptions={roleOptions}
      role={role}
      onRoleChange={setRole}
      resultOptions={resultOptions}
      result={result}
      onResultChange={setResult}
      checkboxes={[
        { key: "injection", label: "with injection", checked: true },
        { key: "fallback", label: "with fallback", checked: true },
      ]}
      onCheckboxChange={() => {}}
    />
  );
}
