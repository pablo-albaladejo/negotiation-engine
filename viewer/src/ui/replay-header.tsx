import { ModeBadge } from "@negotiation-ring/design-system";
import type { ReactNode } from "react";
import { BackLink } from "./buttons.js";
import { PageTitle } from "./page-title.js";

export interface ReplayHeaderProps {
  onBack: () => void;
  backLabel: string;
  gameId: string;
  /** Omitted for modes with no single logged opponent (e.g. a tournament session). */
  rival?: string;
  mode?: "arena" | "tournament";
  /** `.nr-muted` text next to the heading, baseline-aligned (A2, d:91): "Seller · price · T=10 · run r-1001". */
  sub?: ReactNode;
  /** `.nr-cfg` config line below the heading row (A2, d:93). */
  cfg?: ReactNode;
}

/**
 * Header shared by the arena, two-issue and tournament replay screens: the back link, then the
 * "id[ · vs rival]" heading with its `sub` text on the same baseline, then the `cfg` config line
 * (INBOX finding: ArenaReplayScreen/TwoIssueScreen used to duplicate this row; rival is only shown
 * when logged, never invented). The match selector is rendered by the caller as its own section
 * item, not nested in here (A2). `ModeBadge` only shows for `mode="tournament"` -- the design has
 * no badge on the arena/two-issue header (A2).
 */
export function ReplayHeader({ onBack, backLabel, gameId, rival, mode = "arena", sub, cfg }: ReplayHeaderProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <BackLink onClick={onBack}>{backLabel}</BackLink>
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
        {mode === "tournament" ? <ModeBadge mode={mode} /> : null}
        <PageTitle>{rival ? `${gameId} · vs ${rival}` : gameId}</PageTitle>
        {sub ? <span className="nr-muted">{sub}</span> : null}
      </div>
      {cfg ? <span className="nr-cfg">{cfg}</span> : null}
    </div>
  );
}
