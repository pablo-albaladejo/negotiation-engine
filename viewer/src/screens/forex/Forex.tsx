import type { ReactNode } from "react";
import { Card } from "@negotiation-ring/design-system";
import type { Board, BoardForexChain, BoardForexLeg, BoardForexStep } from "../../model/index.js";

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
}: {
  title: string;
  value: string;
  detail: string;
  tone?: string | undefined;
  state: "current" | "next" | "plain";
}) {
  const border =
    state === "current" ? "2px solid var(--us)" : state === "next" ? "2px dashed var(--us)" : "1px solid var(--line)";
  return (
    <div
      aria-current={state === "current" ? "step" : undefined}
      style={{
        flex: "1 1 auto",
        minWidth: 0,
        padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-md)",
        border,
        background: state === "current" ? "var(--us-soft)" : undefined,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700 }}>
        {title}
        {state === "current" ? <span style={{ color: "var(--us)" }}> · now</span> : null}
        {state === "next" ? <span style={{ color: "var(--us)" }}> · next</span> : null}
      </span>
      <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", color: tone }}>{value}</span>
      <span className="nr-muted" style={{ fontSize: 11 }}>
        {detail}
      </span>
    </div>
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

function Chain({ c }: { c: BoardForexChain }) {
  const idle = c.current < 0;
  const badge = (text: string, color: string, title?: string) => (
    <span
      title={title}
      style={{
        marginLeft: 8,
        padding: "1px 6px",
        borderRadius: "var(--radius-pill)",
        border: `1px solid ${color}`,
        color,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {text}
    </span>
  );
  return (
    <Card title={`${c.card}${c.rarity ? ` · ${c.rarity}` : ""} · ${c.buy.at} → ${c.sell.at}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", minWidth: 0 }}>
        <span className="nr-muted">
          {idle ? "idle" : `step ${c.current + 1}/${c.steps.length}`}
          {c.status ? ` · ${c.status}` : ""}
          {` · done today ${c.done_today}`}
          {c.automated
            ? badge("automated", "var(--ok)", "run by the dealers agent")
            : badge("shown only", "var(--muted)", "not run by any agent")}
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
      </div>
    </Card>
  );
}

export function Forex({ board }: { board: Board }) {
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
            next step. Automated chains are run by the dealers agent within max buy / min sell; the rest are shown only.
          </span>
        </div>
      </Card>
      {fx.chains.length === 0 ? (
        <span className="nr-muted">No chains with margin ≥ 8 P after fees</span>
      ) : (
        fx.chains.map((c) => <Chain key={c.id} c={c} />)
      )}
    </div>
  );
}
