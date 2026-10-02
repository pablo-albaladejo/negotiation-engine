import { PrimaryButton } from "@negotiation-ring/design-system";

export function Default() {
  return <PrimaryButton onClick={() => {}}>Open live view</PrimaryButton>;
}

export function Disabled() {
  return <PrimaryButton disabled>Open live view</PrimaryButton>;
}
