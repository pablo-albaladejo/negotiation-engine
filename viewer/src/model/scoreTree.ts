/**
 * What each action feeds in the score (RULES.md § Scoring, docs/bazaar/neg-points-formula.md):
 *
 *   ladder_points ─┐
 *   duel_points  ──┼─→ NEGOTIATING (/30) ─┐
 *   neg_points   ──┘                       ├─→ SCORE → rank
 *   bench + organic ─→ MARKET (/30) ───────┘
 *
 * Dealer deal → LADDER (best three negotiated shares per level), duel → DUEL, trade with another team outside our
 * venue → NEG (price − our value on a sale, value − price on a buy), trade between OTHER teams on our venue → MARKET
 * (organic). Packs, the Workshop, the album and gifts feed nothing. Presentation only: every figure comes from the API.
 */
import type { Board, BoardRow } from "./bazaarBoard.js";
import type { ModelLadderLevel } from "./gameModel.js";

export type ScoreComponent = "ladder" | "duel" | "neg" | "market" | "none";

export const COMPONENT_LABEL: Record<ScoreComponent, string> = { ladder: "LADDER", duel: "DUEL", neg: "NEG", market: "MARKET", none: "no score" };
export const COMPONENT_COLOR: Record<ScoreComponent, string> = { ladder: "#E8A33D", duel: "#B061FF", neg: "#4C8DFF", market: "#3DDC97", none: "#9AA4B8" };

/** Venue of a team trade from its counterparty label (`t08 @ v21`, `t07 → t13 @ rastro`). */
const venueOf = (r: BoardRow): string | null => /@\s*(\S+)/.exec(r.counterparty)?.[1] ?? null;

export interface RowComponent {
  comp: ScoreComponent;
  /** Why, or what to watch (ladder level and top three, anomaly on our own venue). */
  note: string | null;
}

export function componentOf(r: BoardRow, board: Board, ladder?: readonly ModelLadderLevel[]): RowComponent {
  const ours = board.market.venue?.venue ?? null;
  if (r.kind.startsWith("dealer")) {
    const lvl = ladder?.find((l) => l.deals.some((d) => d.thread === Number(r.id.replace("thread:", ""))));
    const deal = lvl?.deals.find((d) => d.thread === Number(r.id.replace("thread:", "")));
    if (!lvl || !deal) return { comp: "ladder", note: r.status === "deal" ? "best 3 negotiated deals per level; taking her opening does not count" : null };
    const inTop = lvl.top.includes(deal.share) && deal.share >= lvl.weakest;
    return { comp: "ladder", note: `L${lvl.level} · share ${deal.share.toFixed(2)}${deal.assumed ? "~" : ""} · ${inTop ? "in top 3" : "not in top 3"}` };
  }
  if (r.kind === "duel-buyer" || r.kind === "duel-seller") return { comp: "duel", note: null };
  if (r.kind === "other-trade") {
    const v = venueOf(r);
    return ours && v === ours ? { comp: "market", note: "organic: value between other teams on our venue" } : { comp: "none", note: "other teams' trade, not on our venue" };
  }
  if (r.kind === "team-trade") {
    const v = venueOf(r);
    // RULES.md: the team key cannot trade on its own venue, so this should never happen.
    if (ours && v === ours) return { comp: "neg", note: "anomaly: our own trade on our venue (organic 0)" };
    return { comp: "neg", note: "price − our value (sale) or value − price (buy)" };
  }
  if (r.kind === "team-offer") return { comp: "none", note: "open offer: scores NEG only if someone takes it" };
  return { comp: "none", note: null };
}

export interface TreeNode {
  key: string;
  label: string;
  /** Out of what (NEGOTIATING /30, MARKET /30). */
  of?: number;
  now: number | null;
  dDay: number | null;
  dTick: number | null;
  hint?: string;
  children?: TreeNode[];
}

const round = (x: number) => Math.round(x * 1000) / 1000;

/** The score tree with live values and Δ since the day's first snapshot and since the previous tick. */
export function scoreTree(board: Board): TreeNode {
  const sp = board.score_parts;
  const h = board.header;
  const now = (k: string): number | null => sp?.now[k] ?? ((h as unknown as Record<string, number | null> | null)?.[k] ?? null);
  const delta = (k: string, base: Record<string, number> | undefined) => {
    const n = now(k);
    const b = base?.[k];
    return n !== null && b !== undefined ? round(n - b) : null;
  };
  const node = (key: string, label: string, extra: Partial<TreeNode> = {}): TreeNode => ({ key, label, now: now(key), dDay: delta(key, sp?.day_start?.parts), dTick: delta(key, sp?.prev?.parts), ...extra });
  const market: TreeNode[] = [
    node("bench_points", "bench", { hint: "best venue of ours open in each Market Test session" }),
    node("mm_points", "organic", { hint: "value between OTHER teams on our venue" }),
  ].filter((n) => n.now !== null);
  return node("score", "SCORE", {
    children: [
      node("negotiating", "NEGOTIATING", {
        of: 30,
        children: [
          node("ladder_points", "ladder", { hint: "dealers: best 3 negotiated shares per level" }),
          node("duel_points", "duel", { hint: "duels: share of each pie" }),
          node("neg_points", "neg", { hint: "trades with other teams: value created at our values" }),
        ],
      }),
      node("market", "MARKET", { of: 30, hint: `only our venue${board.market.venue ? ` ${board.market.venue.venue}` : ""}; El Rastro and other venues → NEG`, ...(market.length ? { children: market } : {}) }),
      node("rank", "rank", { hint: "lower is better" }),
    ],
  });
}
