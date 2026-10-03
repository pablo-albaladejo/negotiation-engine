import { useState } from "react";
import { Filters } from "@negotiation-ring/design-system";

export function FiltersExample() {
  const [rival, setRival] = useState("all");
  const [role, setRole] = useState("seller");
  const [result, setResult] = useState("all");
  const [injection, setInjection] = useState(false);
  const [template, setTemplate] = useState(true);

  return (
    <Filters
      rivalOptions={[
        { value: "all", label: "All opponents" },
        { value: "boulware", label: "Boulware" },
        { value: "conceder", label: "Conceder" },
      ]}
      rival={rival}
      onRivalChange={setRival}
      roleOptions={[
        { value: "seller", label: "Seller" },
        { value: "buyer", label: "Buyer" },
      ]}
      role={role}
      onRoleChange={setRole}
      resultOptions={[
        { value: "all", label: "All" },
        { value: "deal", label: "Deal" },
        { value: "walk", label: "Walk away" },
      ]}
      result={result}
      onResultChange={setResult}
      checkboxes={[
        { key: "injection", label: "with injection", checked: injection },
        { key: "template", label: "with fallback", checked: template },
      ]}
      onCheckboxChange={(key, checked) => {
        if (key === "injection") setInjection(checked);
        if (key === "template") setTemplate(checked);
      }}
    />
  );
}
