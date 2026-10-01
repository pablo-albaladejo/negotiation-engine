export interface ModeBadgeProps {
  mode: "arena" | "tournament";
}

export function ModeBadge({ mode }: ModeBadgeProps) {
  return <span className={`nr-mode-badge ${mode}`}>{mode === "arena" ? "ARENA" : "TOURNAMENT"}</span>;
}
