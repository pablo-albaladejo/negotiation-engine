import type { ReactNode } from "react";

export interface PillProps {
  kind: "verdict" | "rejected" | "sample" | "champion";
  children?: ReactNode;
}

export function Pill({ kind, children }: PillProps) {
  return <span className={`nr-pill ${kind}`}>{children}</span>;
}
