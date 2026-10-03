import { useState, type ReactNode } from "react";
import { Card } from "@negotiation-ring/design-system";
import type { Board, BoardForexChain, BoardForexLeg, BoardForexStep, BoardForexThread } from "../../model/index.js";
import { TableLink } from "../../ui/buttons.js";

/**
 * «Forex» tab: the A → B → C chains `bazaar:play` finds every tick (forex.json): buy a card at one place, hold the
 * copy, sell it at another, net of fees. Each chain is a horizontal flow with its current step highlighted (idle: the
 * next step outlined). Read-only: the dealers agent runs the automated chains; nothing here sends.
 */

const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)} P`;

function range(l: BoardForexLeg): string {
  const span = l.lo === l.hi ? `${l.lo}` : `${l.lo}–${l.hi}`;
  return `${span} P · n ${l.n}${l.fee > 0 ? ` · fee ${l.fee} P` : ""}`;
}

function stepTitle(c: BoardForexChain, s: BoardForexStep): string {
  if (s.kind === "buy") return `Buy at ${s.at || c.buy.at}`;
  if (s.kind === "sell") return `Sell to ${s.at || c.sell.at}`;
  return `Hold ${c.card}`;
}

function stepValue(c: BoardForexChain, s: BoardForexStep): string {
  if (s.kind === "hold") return `${c.buy.price + c.buy.fee} P tied up`;
  return signed(s.expected);
}

function stepDetail(c: BoardForexChain, s: BoardForexStep): string {
  if (s.kind === "buy") return `${range(c.buy)}${c.max_buy !== null ? ` · max ${c.max_buy}` : ""}`;
  if (s.kind === "sell") return `${range(c.sell)}${c.min_sell !== null ? ` · min ${c.min_sell}` : ""}`;
  return c.rarity ? `${c.rarity} · ours until sold` : "ours until sold";
}

function Node({
  title,
  value,
  detail,
  tone,
  state,
  count,
  selected,
  onClick,
}: {
  title: string;
  value: string;
  detail: string;
  tone?: string | undefined;
  state: "current" | "next" | "plain";
  /** Badge text (threads or copies behind the step); null for the margin node. */
  count?: string | null;
  selected?: boolean;
  onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const border =
    state === "current" ? "2px solid var(--us)" : state === "next" ? "2px dashed var(--us)" : "1px solid var(--line)";
  const body = (
    <>
      <span style={{ fontSize: 12, fontWeight: 700 }}>
        {title}
        {state === "current" ? <span style={{ color: "var(--us)" }}> · now</span> : null}
        {state === "next" ? <span style={{ color: "var(--us)" }}> · next</span> : null}
        {count ? (
          <span
            style={{
              marginLeft: 6,
              padding: "0 6px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--line)",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {count}
          </span>
        ) : null}
      </span>
      <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", color: tone }}>{value}</span>
      <span className="nr-muted" style={{ fontSize: 11 }}>
        {detail}
      </span>
    </>
  );
  const style = {
    flex: "1 1 auto",
    minWidth: 0,
    padding: "var(--space-2) var(--space-3)",
    borderRadius: "var(--radius-md)",
    border,
    background: state === "current" ? "var(--us-soft)" : undefined,
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
    textAlign: "left" as const,
    font: "inherit",
    color: "inherit",
    boxShadow: selected ? "0 0 0 2px var(--ink)" : hover && onClick ? "0 0 0 1px var(--ink)" : undefined,
  };
  if (!onClick) {
    return (
      <div aria-current={state === "current" ? "step" : undefined} style={style}>
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      aria-current={state === "current" ? "step" : undefined}
      aria-expanded={selected ?? false}
      title="Show the conversations behind this step"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...style, cursor: "pointer" }}
    >
      {body}
    </button>
  );
}

/** One slot of the flow: an arrow (except the first) and its node; wraps under the previous one at narrow width. */
function Slot({ arrow, children }: { arrow: string | null; children: ReactNode }) {
  return (
    <div style={{ flex: "1 1 190px", minWidth: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
      {arrow ? (
        <span aria-hidden="true" className="nr-muted" style={{ fontSize: 18, fontWeight: 700 }}>
          {arrow}
        </span>
      ) : null}
      {children}
    </div>
  );
}

const pill = (text: string, color: string, title?: string) => (
  <span
    key={text}
    title={title}
    style={{
      marginLeft: 8,
      padding: "1px 6px",
      borderRadius: "var(--radius-pill)",
      border: `1px solid ${color}`,
      color,
      fontSize: 11,
      fontWeight: 700,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </span>
);

const STATUS_COLOR: Record<BoardForexThread["status"], string> = {
  open: "var(--us)",
  deal: "var(--ok)",
  closed: "var(--muted)",
};

/** Her and our prices interleaved as she opened: her → ours → her… */
function priceLadder(t: BoardForexThread): string {
  const out: string[] = [];
  for (let i = 0; i < Math.max(t.her_prices.length, t.our_prices.length); i++) {
    if (i < t.her_prices.length) out.push(`her ${t.her_prices[i]}`);
    if (i < t.our_prices.length) out.push(`ours ${t.our_prices[i]}`);
  }
  return out.join(" → ") || "no prices";
}

function ThreadLine({ t, onOpen }: { t: BoardForexThread; onOpen: (() => void) | null }) {
  const ticks = `tick ${t.opened_tick ?? "?"}${t.closed_tick !== null ? `–${t.closed_tick}` : " → open"}`;
  return (
    <li style={{ display: "flex", flexDirection: "column", gap: 2, padding: "var(--space-2) 0", borderTop: "1px solid var(--line)" }}>
      <span>
        {onOpen ? (
          <TableLink aria-label={`Open conversation ${t.id}`} onClick={onOpen}>
            {`#${t.id}`}
          </TableLink>
        ) : (
          <strong>{`#${t.id}`}</strong>
        )}
        <span className="nr-muted">{` · ${t.dealer} · ${t.side} ${t.card ?? "?"} · ${ticks}`}</span>
        {pill(t.status === "deal" ? `deal${t.price !== null ? ` ${t.price} P` : ""}` : t.status, STATUS_COLOR[t.status])}
        {t.flags.length ? pill(`flag ×${t.flags.length}`, "var(--warn)", "bad-faith flag raised on this thread") : null}
      </span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{priceLadder(t)}</span>
      <span className="nr-muted" style={{ fontSize: 11 }}>
        {[t.outcome, t.rule ? `rule ${t.rule}` : null, `last her ${t.her_last ?? "—"} / ours ${t.our_last ?? "—"}`].filter(Boolean).join(" · ")}
      </span>
      {t.flags.map((f, i) => (
        <span key={`${f.message_id ?? i}`} style={{ fontSize: 11, color: "var(--warn)" }}>
          {`flag${f.message_id !== null ? ` on message ${f.message_id}` : ""}${f.tick !== null ? ` (tick ${f.tick})` : ""}: ${f.reason}`}
        </span>
      ))}
    </li>
  );
}

function StepPanel({
  c,
  step,
  openThread,
}: {
  c: BoardForexChain;
  step: number;
  openThread: (id: number) => (() => void) | null;
}) {
  const s = c.steps[step];
  const st = c.step_threads?.[step];
  if (!s) return null;
  const threads = st?.threads ?? [];
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)" }}>
      <strong>{stepTitle(c, s)}</strong>
      {s.kind === "hold" ? (
        <div className="nr-muted" style={{ fontSize: 12 }}>
          {st?.assets.length
            ? `Spare copies of ${c.card} we hold (beyond the first): asset ${st.assets.join(", ")}`
            : `No spare copy of ${c.card} held right now (the first copy stays in the album).`}
        </div>
      ) : threads.length === 0 ? (
        <div className="nr-muted" style={{ fontSize: 12 }}>
          No conversations for this step today
        </div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {threads.map((t) => (
            <ThreadLine key={t.id} t={t} onOpen={openThread(t.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function countOf(c: BoardForexChain, i: number): string | null {
  const st = c.step_threads?.[i];
  const s = c.steps[i];
  if (!st || !s) return null;
  if (s.kind === "hold") return `${st.assets.length} spare`;
  return `${st.threads.length} thread${st.threads.length === 1 ? "" : "s"}`;
}

function Chain({ c, openThread }: { c: BoardForexChain; openThread: (id: number) => (() => void) | null }) {
  const [picked, setPicked] = useState<number | null>(null);
  const idle = c.current < 0;
  return (
    <Card title={`${c.card}${c.rarity ? ` · ${c.rarity}` : ""} · ${c.buy.at} → ${c.sell.at}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", minWidth: 0 }}>
        <span className="nr-muted">
          {idle ? "idle" : `step ${c.current + 1}/${c.steps.length}`}
          {c.status ? ` · ${c.status}` : ""}
          {` · done today ${c.done_today}`}
          {c.automated
            ? pill("automated", "var(--ok)", "run by the dealers agent")
            : pill("shown only", "var(--muted)", "not run by any agent")}
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "stretch" }}>
          {c.steps.map((s, i) => (
            <Slot key={`${s.kind}-${i}`} arrow={i > 0 ? "→" : null}>
              <Node
                title={stepTitle(c, s)}
                value={stepValue(c, s)}
                detail={stepDetail(c, s)}
                tone={s.kind === "sell" ? "var(--ok)" : s.kind === "buy" ? "var(--warn)" : undefined}
                state={i === c.current ? "current" : idle && i === 0 ? "next" : "plain"}
                count={countOf(c, i)}
                selected={picked === i}
                onClick={() => setPicked(picked === i ? null : i)}
              />
            </Slot>
          ))}
          <Slot arrow="=">
            <Node
              title="Net margin"
              value={signed(c.margin)}
              detail={`worst case ${signed(c.worst)}`}
              tone={c.margin > 0 ? "var(--ok)" : "var(--warn)"}
              state="plain"
            />
          </Slot>
        </div>
        {picked !== null ? <StepPanel c={c} step={picked} openThread={openThread} /> : null}
      </div>
    </Card>
  );
}

export function Forex({ board, onOpen }: { board: Board; onOpen: (rowId: string) => void }) {
  /** A thread opens the existing conversation drawer (board row `thread:<id>`); null when the board lacks that row. */
  const rows = new Set(board.rows.map((r) => r.id));
  const openThread = (id: number) => (rows.has(`thread:${id}`) ? () => onOpen(`dealer:${id}`) : null);
  const fx = board.forex;
  if (!fx) {
    return (
      <Card title="Forex">
        <span className="nr-muted">
          No forex.json for today yet: bazaar:play writes it every tick (needs a play restart on the commit that adds it).
        </span>
      </Card>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <Card title={`Forex · ${fx.chains.length} chains · tick ${fx.tick ?? "?"}`}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <span>
            {`updated ${fx.updated ? new Date(fx.updated).toLocaleTimeString() : "?"} · ${fx.trades} deals in window · ${fx.scanned} cards scanned`}
          </span>
          <span className="nr-muted" style={{ fontSize: 11 }}>
            Buy a card at A, hold the copy, sell it at B, net of fees (dealers 0, El Rastro ~2 P + 4 %). Ranges are the
            public deals of the day (lo–hi, n samples). The highlighted step is where we are; an idle chain outlines its
            next step. Click a step to see the conversations behind it. Automated chains are run by the dealers agent within max buy / min sell; the rest are shown only.
          </span>
        </div>
      </Card>
      {fx.chains.length === 0 ? (
        <span className="nr-muted">No chains with margin ≥ 8 P after fees</span>
      ) : (
        fx.chains.map((c) => <Chain key={c.id} c={c} openThread={openThread} />)
      )}
    </div>
  );
}
