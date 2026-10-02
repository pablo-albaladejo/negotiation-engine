import { SecondaryButton } from "@negotiation-ring/design-system";

export function Default() {
  return <SecondaryButton onClick={() => {}}>Copy</SecondaryButton>;
}

export function Disabled() {
  return <SecondaryButton disabled>Copy</SecondaryButton>;
}
