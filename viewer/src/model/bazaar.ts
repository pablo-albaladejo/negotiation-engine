/**
 * Bazaar (the figure we maximize): the viewer never computes, it only shows what the agent already traced
 * in `score.jsonl` (per-tick snapshot, with delta and cause) and what `/api/bazaar/live` serves
 * live. `rarest`/`luck`/`luck_private` never reach here: the server already filters them out.
 */
export interface ScoreCause {
  thread?: number;
  dealer?: string;
  action?: string;
  price?: number;
}

export interface ScoreSnapshot {
  ts?: string;
  tick?: number;
  round?: string;
  score?: number;
  negotiating?: number;
  market?: number;
  neg_points?: number;
  mm_points?: number;
  duel_points?: number;
  ladder_points?: number;
  bench_efficiency?: number;
  bench_points?: number;
  bench_venue?: string;
  level?: number;
  album_filled?: number;
  album_slots?: number;
  pages_complete?: number;
  deals?: number;
  frozen?: boolean;
  venue?: string;
  rank?: number;
  delta?: Record<string, number>;
  cause?: ScoreCause[];
}

export interface BazaarLiveInfo {
  team: string | null;
  round: string | null;
  tick: number | null;
  score: ScoreSnapshot | null;
}

export interface ScorePoint {
  tick: number;
  score: number;
}

export interface MovedRow {
  tick: number;
  component: string;
  delta: number;
  cause: string;
}

export interface BazaarModel {
  latest: ScoreSnapshot | null;
  chart: ScorePoint[];
  moved: MovedRow[];
}

const COMPONENT_LABEL: Record<string, string> = {
  score: "Score",
  negotiating: "Negotiating",
  market: "Market-making",
  neg_points: "Negotiating points",
  mm_points: "Market-making points",
  duel_points: "Duels",
  ladder_points: "Ladder",
  bench_efficiency: "Bench efficiency",
  bench_points: "Bench points",
  level: "Level",
  album_filled: "Album filled",
  album_slots: "Album slots",
  pages_complete: "Pages complete",
  deals: "Deals",
  rank: "Rank",
};

function causeLabel(cause: ScoreCause[] | undefined): string {
  if (!cause || cause.length === 0) return "not logged";
  return cause
    .map((c) => [c.action, c.dealer, c.price !== undefined ? String(c.price) : undefined].filter((v): v is string => v !== undefined).join(" · "))
    .join("; ");
}

export function bazaarModel(snapshots: readonly ScoreSnapshot[]): BazaarModel {
  const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1]! : null;
  const chart: ScorePoint[] = [];
  for (const s of snapshots) if (typeof s.tick === "number" && typeof s.score === "number") chart.push({ tick: s.tick, score: s.score });
  const moved: MovedRow[] = [];
  for (const s of snapshots) {
    if (typeof s.tick !== "number" || !s.delta) continue;
    const cause = causeLabel(s.cause);
    for (const [component, delta] of Object.entries(s.delta)) {
      if (!delta) continue;
      moved.push({ tick: s.tick, component: COMPONENT_LABEL[component] ?? component, delta, cause });
    }
  }
  return { latest, chart, moved };
}
