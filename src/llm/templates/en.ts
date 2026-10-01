import type { Offer } from "../../engine/issues.js";
import { formatWith, type TemplatePack } from "./types.js";

const formatNumber = (value: number) => formatWith(value, ".");

function formatIssue(name: string, value: number): string {
  if (name === "pct") return `${formatNumber(value)}%`;
  if (name === "day") return `payment on day ${formatNumber(value)}`;
  return `${name} ${formatNumber(value)}`;
}

const formatOffer = (offer: Offer) =>
  Object.entries(offer)
    .map(([name, value]) => formatIssue(name, value))
    .join(", with ");

/** English template for the "warm-firm" persona. */
export const en: TemplatePack = {
  formatNumber,
  formatOffer,
  accept: [
    (o) => `It's a deal! We accept ${o}. Thank you for the negotiation.`,
    (o) => `We accept ${o}. It was a pleasure negotiating with you.`,
    (o) => `Agreed: ${o}. Thank you.`,
    (o) => `Great, we accept ${o}. Thanks for your flexibility.`,
  ],
  counter: [
    (o) => `Thank you for your proposal. I can offer ${o}. I believe it is fair for both of us.`,
    (o) => `I understand your position. My proposal is ${o}.`,
    (o) => `We can move forward with ${o}. What do you think?`,
    (o) => `Let me put ${o} on the table; I think it gets us close.`,
  ],
  confirmFigures: [
    (o) => `I could not confirm your figures: could you restate them in digits? Meanwhile, I propose ${o}.`,
    (o) => `To confirm your figures, could you write them in digits? On my side, I propose ${o}.`,
    (o) => `I want to confirm your figures before moving on: can you state them in digits? My proposal is ${o}.`,
    (o) => `Help me confirm your figures by writing them in digits. In the meantime, I suggest ${o}.`,
  ],
  confirmAcceptance: [
    (o) => `Can you confirm we close at ${o}? Reply with a yes and we are done.`,
    (o) => `Just to be sure: do you confirm ${o}? A yes closes it.`,
    (o) => `Do you confirm ${o}? With a yes we wrap it up.`,
    (o) => `Shall we close at ${o}? Please confirm with a yes.`,
  ],
  walk: [
    "Thank you for your time, but we cannot continue like this. No deal.",
    "I'm sorry, but we withdraw: we do not see common ground.",
    "Thanks for the conversation; unfortunately there is no deal.",
    "We have to walk away. Thank you anyway.",
  ],
  echo: (e, o) => {
    const unit = e.issue === "pct" ? "%" : "";
    const ask =
      e.kind === "range"
        ? `Is it ${formatNumber(e.bounds[0])}${unit} or ${formatNumber(e.bounds[1])}${unit}?`
        : `Do you mean ${formatNumber(e.value)}${unit}?`;
    return `${ask} I need one concrete figure to continue. Meanwhile, I propose ${o}.`;
  },
  marks: { accept: "Accepted", counter: "Counter-offer", walk: "No deal", confirmFigures: "Please restate your figures in digits", confirmAcceptance: "Please confirm with a yes" },
};
