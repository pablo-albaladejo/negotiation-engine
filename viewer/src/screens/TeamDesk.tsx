import { Card } from "@negotiation-ring/design-system";
import { teamLabel, type Board, type BoardDeskChain } from "../model/index.js";
import { ComponentChip } from "./ScoreTree.js";

/**
 * «Team desk»: offers other teams make to us (to-me), the counter we answer with (sell only: the requested card or a
 * spare the team asked for) and how it ended, grouped by team (`team-desk.jsonl`, written by `bazaar:play`). Structure
 * only: card, price, venue, team. Our floor and server value are local and kept visually secondary. Read-only.
 */

const STATUS_COLOR: Record<string, string> = { would: "var(--muted)", sent: "var(--us)", filled: "var(--ok)", failed: "var(--warn)", expired: "var(--warn)", cancelled: "var(--muted)" };
const statusChip = (s: string | null) => (
  <span style={{ color: STATUS_COLOR[s ?? ""] ?? "var(--muted)", fontWeight: 700, fontSize: 12 }}>{s ?? "?"}</span>
);
const signed = (v: number) => `${v > 0 ? "+" : ""}${v}`;

function Chain({ c }: { c: BoardDeskChain }) {
  const last = [...c.steps].reverse().find((s) => s.price !== null);
  const neg = c.outcome?.status === "filled" ? c.outcome.negDelta : (last?.negIfFilled ?? null);
  const secondary = last && (last.floor !== null || last.serverValue !== null) ? [last.floor !== null ? `floor ${last.floor}` : null, last.serverValue !== null ? `value ${last.serverValue}` : null].filter(Boolean).join(" · ") : null;
  return (
    <li style={{ borderTop: "1px solid var(--line)", paddingTop: "var(--space-1)", display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
        {c.incoming ? (
          <span>
            <span className="nr-muted">{`t${c.incomingTick ?? "?"} they offer `}</span>
            {`${c.incoming.weGet ?? "?"} for ${c.incoming.weGive ?? "?"}`}
            {c.incoming.verdict ? <span className="nr-muted">{` (${c.incoming.verdict})`}</span> : null}
          </span>
        ) : (
          <span className="nr-muted">no incoming offer logged</span>
        )}
        {c.venue ? <span className="nr-muted">{`@ ${c.venue}`}</span> : null}
        {neg !== null ? (
          <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
            <ComponentChip comp="neg" note={c.outcome?.status === "filled" ? "neg won (filled)" : "neg if our counter fills"} />
            <span style={{ color: neg >= 0 ? "var(--ok)" : "var(--warn)" }}>{`${signed(neg)}${c.outcome?.status === "filled" ? "" : " if filled"}`}</span>
          </span>
        ) : null}
        {statusChip(c.outcome?.status ?? c.status)}
      </div>
      {c.steps.length > 0 ? (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span className="nr-muted">we answer:</span>
          {c.steps.map((s, i) => (
            <span key={i} title={s.reason ?? undefined}>
              {i > 0 ? <span className="nr-muted">{" → "}</span> : null}
              {s.event === "cancel" ? <span className="nr-muted">cancel</span> : `${s.ref ?? "?"} @ ${s.price ?? "?"} P`}
              <span className="nr-muted">{` t${s.tick ?? "?"} `}</span>
              {statusChip(s.status)}
            </span>
          ))}
          {c.outcome ? <span className="nr-muted">{` → ${c.outcome.status ?? "?"}${c.outcome.tick !== null ? ` t${c.outcome.tick}` : ""}`}</span> : null}
        </div>
      ) : null}
      {secondary ? <span className="nr-muted" style={{ fontSize: 11 }}>{`${secondary} (local only)`}</span> : null}
      {last?.reason ? <span className="nr-muted" style={{ fontSize: 11 }}>{last.reason}</span> : null}
    </li>
  );
}

export function TeamDesk({ board }: { board: Board }) {
  const teams = board.team_desk;
  if (!teams) return null;
  const won = Math.round(teams.reduce((s, t) => s + t.negWon, 0) * 10) / 10;
  const open = Math.round(teams.reduce((s, t) => s + t.negOpen, 0) * 10) / 10;
  return (
    <Card title={`Team desk · offers to us and our counters${teams.length ? ` · neg won ${signed(won)}${open ? ` · ${signed(open)} pending` : ""}` : ""}`}>
      {teams.length === 0 ? (
        <span className="nr-muted">No team-desk activity today (bazaar:play writes team-desk.jsonl once its flag is on; dry-run lines show as «would»).</span>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {teams.map((t) => (
            <div key={t.team} style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "baseline", flexWrap: "wrap" }}>
                <strong>{teamLabel(board, t.team)}</strong>
                <span className="nr-muted">{`${t.chains.length} offer${t.chains.length === 1 ? "" : "s"}`}</span>
                <span style={{ color: t.negWon > 0 ? "var(--ok)" : undefined }}>{`neg won ${signed(t.negWon)}`}</span>
                {t.negOpen ? <span className="nr-muted">{`${signed(t.negOpen)} if pending counters fill`}</span> : null}
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                {t.chains.map((c) => (
                  <Chain key={c.key} c={c} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
