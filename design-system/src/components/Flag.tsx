import type { ReactNode } from "react";

export interface FlagProps {
  kind: "neutral" | "injection" | "decision" | "walk" | "fallback";
  children?: ReactNode;
}

export function Flag({ kind, children }: FlagProps) {
  const classes = ["nr-flag", kind === "neutral" ? "" : kind].filter(Boolean).join(" ");
  return <span className={classes}>{children}</span>;
}
