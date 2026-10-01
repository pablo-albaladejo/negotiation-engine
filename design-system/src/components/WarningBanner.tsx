import type { ReactNode } from "react";

export interface WarningBannerProps {
  tone: "warn" | "info";
  title: string;
  children?: ReactNode;
}

export function WarningBanner({ tone, title, children }: WarningBannerProps) {
  return (
    <div className={`nr-warning-banner ${tone}`} role="alert">
      <strong className="nr-warning-title">{title}</strong>
      {children}
    </div>
  );
}
