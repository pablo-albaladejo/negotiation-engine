export interface StatFigureProps {
  /** Literal value already formatted by the caller (e.g. with `formatNumber`); never computed here. */
  value: string;
  /** Accent colour: `--us` for our side, `--them` for the rival's (default). */
  tone?: "us" | "them";
  caption?: string;
}

/** Large headline figure (e.g. "final estimate of their reserve"), `font: 800 44px/1 var(--font-display)`. */
export function StatFigure({ value, tone = "them", caption }: StatFigureProps) {
  return (
    <div className="nr-stat-figure-wrap">
      <span className={`nr-stat-figure nr-stat-figure-${tone}`}>{value}</span>
      {caption ? <span className="nr-muted">{caption}</span> : null}
    </div>
  );
}
