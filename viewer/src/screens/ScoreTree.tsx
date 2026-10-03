import { COMPONENT_COLOR, COMPONENT_LABEL, scoreTree, type ScoreComponent, type TreeNode } from "../model/scoreTree.js";
import type { Board } from "../model/index.js";

/**
 * Score tree: ladder/duel/neg → NEGOTIATING /30, bench/organic → MARKET /30 → SCORE → rank, with the live value and
 * the Δ since the day's first snapshot and since the previous tick. Plus the chip that tags each action with the part
 * it feeds (same colors everywhere). Plain text only.
 */

/** Which score part an action feeds, as a colored chip. */
export function ComponentChip({ comp, note }: { comp: ScoreComponent; note?: string | null }) {
  const color = COMPONENT_COLOR[comp];
  return (
    <span title={note ?? undefined} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 6px", borderRadius: "var(--radius-pill)", border: `1px solid ${color}`, color, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {COMPONENT_LABEL[comp]}
    </span>
  );
}

const NODE_COMP: Record<string, ScoreComponent> = { ladder_points: "ladder", duel_points: "duel", neg_points: "neg", market: "market", bench_points: "market", mm_points: "market" };

function signed(v: number | null, rank: boolean): { text: string; color?: string } {
  if (v === null) return { text: "—" };
  if (v === 0) return { text: "0" };
  const good = rank ? v < 0 : v > 0;
  return { text: `${v > 0 ? "+" : ""}${v}`, color: good ? "var(--ok)" : "var(--warn)" };
}

function Row({ n, depth }: { n: TreeNode; depth: number }) {
  const comp = NODE_COMP[n.key];
  const rank = n.key === "rank";
  const day = signed(n.dDay, rank);
  const tick = signed(n.dTick, rank);
  return (
    <>
      <tr>
        <td style={{ paddingLeft: depth * 18 }}>
          {depth > 0 ? <span className="nr-muted">{"└ "}</span> : null}
          {comp ? <span style={{ color: COMPONENT_COLOR[comp], fontWeight: depth === 1 ? 800 : 600 }}>{n.label}</span> : <strong>{n.label}</strong>}
          {n.of ? <span className="nr-muted">{` /${n.of}`}</span> : null}
          {n.hint ? <div className="nr-muted" style={{ fontSize: 11 }}>{n.hint}</div> : null}
        </td>
        <td style={{ textAlign: "right", fontWeight: depth <= 1 ? 800 : 500 }}>{n.now === null ? "—" : rank ? `#${n.now}` : n.now}</td>
        <td style={{ textAlign: "right", color: day.color }}>{day.text}</td>
        <td style={{ textAlign: "right", color: tick.color }}>{tick.text}</td>
      </tr>
      {(n.children ?? []).map((c) => (
        <Row key={c.key} n={c} depth={depth + 1} />
      ))}
    </>
  );
}

export function ScoreTree({ board }: { board: Board }) {
  const tree = scoreTree(board);
  const sp = board.score_parts;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" }} aria-label="Score tree">
        <thead>
          <tr className="nr-muted" style={{ fontSize: 11, textAlign: "right" }}>
            <th style={{ textAlign: "left" }}>Part</th>
            <th>Now</th>
            <th>{`Δ day${sp?.day_start ? ` (since t${sp.day_start.tick})` : ""}`}</th>
            <th>{`Δ tick${sp?.prev ? ` (t${sp.prev.tick})` : ""}`}</th>
          </tr>
        </thead>
        <tbody>
          <Row n={tree} depth={0} />
        </tbody>
      </table>
      <span className="nr-muted" style={{ fontSize: 11 }}>
        Each action in the history carries the part it feeds: <ComponentChip comp="ladder" /> dealers · <ComponentChip comp="duel" /> duels · <ComponentChip comp="neg" /> trades with other teams (El Rastro, rival venues) ·{" "}
        <ComponentChip comp="market" /> other teams on our venue · <ComponentChip comp="none" /> packs, Workshop, album, gifts, open offers.
      </span>
    </div>
  );
}
