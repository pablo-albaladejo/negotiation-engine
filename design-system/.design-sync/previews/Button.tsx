import { BackLink, PrimaryButton, SecondaryButton, TableLink } from "@negotiation-ring/design-system";

export function Variants() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
      <BackLink onClick={() => {}}>← Runs</BackLink>
      <SecondaryButton onClick={() => {}}>Copy</SecondaryButton>
      <PrimaryButton onClick={() => {}}>Open live view</PrimaryButton>
      <TableLink onClick={() => {}}>R3</TableLink>
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <SecondaryButton disabled>Copy</SecondaryButton>
      <PrimaryButton disabled>Open live view</PrimaryButton>
    </div>
  );
}
