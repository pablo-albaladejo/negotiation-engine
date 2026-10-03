import type { ReactNode } from "react";
import { formatNumber } from "../../format";

export interface ChatMessageFlag {
  kind: "neutral" | "injection" | "decision" | "walk" | "fallback";
  label: string;
}

export interface ChatMessageProps {
  side: "us" | "them";
  round: number;
  offer?: number;
  flags?: ChatMessageFlag[];
  text: string;
  highlighted?: boolean;
}

function metaLabel(side: "us" | "them", round: number, offer?: number): ReactNode {
  const who = side === "us" ? "us" : "rival";
  const parts = [`R${round}`, who];
  if (offer !== undefined) {
    parts.push(`offer ${formatNumber(offer, { locale: "en" })}`);
  }
  return parts.join(" · ");
}

export function ChatMessage({ side, round, offer, flags, text, highlighted }: ChatMessageProps) {
  const classes = ["nr-msg", side, highlighted ? "is-highlighted" : ""].filter(Boolean).join(" ");
  return (
    <div className={classes} data-round={round}>
      <div className="nr-msg-meta">
        <span>{metaLabel(side, round, offer)}</span>
        {flags?.map((flag, index) => (
          <span
            key={`${flag.kind}-${index}`}
            className={["nr-flag", flag.kind === "neutral" ? "" : flag.kind].filter(Boolean).join(" ")}
          >
            {flag.label}
          </span>
        ))}
      </div>
      <div>{text}</div>
    </div>
  );
}
