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
  accept: (offer) => `It's a deal! We accept ${formatOffer(offer)}. Thank you for the negotiation.`,
  counter: (offer) => `Thank you for your proposal. I can offer ${formatOffer(offer)}. I believe it is fair for both of us.`,
  confirmFigures: (offer) => `I could not confirm your figures: could you restate them in digits? Meanwhile, I propose ${formatOffer(offer)}.`,
  confirmAcceptance: (offer) => `Can you confirm we close at ${formatOffer(offer)}? Reply with a yes and we are done.`,
  walk: () => "Thank you for your time, but we cannot continue like this. No deal.",
  marks: { accept: "Accepted", counter: "Counter-offer", walk: "No deal", confirmFigures: "Please restate your figures in digits", confirmAcceptance: "Please confirm with a yes" },
};
