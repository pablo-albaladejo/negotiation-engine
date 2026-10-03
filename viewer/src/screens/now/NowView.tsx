import { Card, DataTable, Flag, KpiStrip, Pill } from "@negotiation-ring/design-system";
import { useEffect, useMemo, useState } from "react";
import type { Board } from "../../model/bazaarBoard.js";
import type { GameModel } from "../../model/gameModel.js";
import { TableLink } from "../../ui/buttons.js";
import { Fold } from "../../ui/fold.js";
import { Meter } from "../../ui/meter.js";
import { gridCols } from "../../ui/grid.js";
import { useNow } from "../../ui/use-now.js";
import { RadioRastro } from "./RadioRastro.js";
import { ageLabel, diffSnapshots, liveConversations, offerLines, planRows, quotas, rememberSnapshot, snapshotOf, tickHeader, type Change, type LiveConv, type LiveStatus, type PlanRow } from "./nowModel.js";

/**
 * «Now» tab: what is happening right now. Tick header, tick plan (what the coordinator SELECTED
 * in arbitration order, with its figure and its target), live conversations, our published offers and what
 * changed since the previous tick. The board is read every tick; the model is the latest build (without waiting for
 * the next one). Everything is plain text; no private value or limit.
 */

const col = { display: "flex", flexDirection: "column", gap: "var(--space-3)" } as const;
const n = (v: number | null | undefined): string => (v === null || v === undefined ? "—" : String(v));

const STATUS_FLAG: Record<LiveStatus, "decision" | "neutral" | "walk" | "fallback"> = {
  "our move": "decision",
  "accept pending": "decision",
  "waiting for them": "neutral",
  cooloff: "walk",
  "resting offer": "fallback",
  done: "neutral",
};

function Header({ board, model, boardAt }: { board: Board; model: GameModel | null; boardAt: number | null }) {
  const now = useNow(1_000);
  const h = tickHeader(board, model, now, boardAt);
  const closed = h.doors !== null && h.doors !== "open";
  return (
    <div style={col}>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
        <Pill kind="rejected">DRY-RUN · nothing is sent</Pill>
        {h.rebuilding ? (
          <span role="status" className="nr-muted">
            model rebuilding… (showing the last build)
          </span>
        ) : null}
        {model && !model.available ? <span className="nr-muted">model unavailable: {model.reason ?? "?"}</span> : null}
      </div>
      <KpiStrip
        items={[
          { label: "tick", value: n(h.tick) },
          { label: "game hour", value: h.gameHour !== null ? h.gameHour.toFixed(2) : "—" },
          { label: `round${h.weight !== null ? ` · weight ×${h.weight}` : ""}`, value: h.round },
          closed ? { label: `doors ${h.doors}`, value: h.opens ? `opens ${h.opens}` : "closed", tone: "walk" } : { label: "next tick in", value: h.nextTickIn !== null ? `${h.nextTickIn} s` : "—" },
          { label: `model age${h.modelTick !== null ? ` · built at tick ${h.modelTick}` : ""}${h.modelBehind ? ` (${h.modelBehind} behind)` : ""}`, value: model ? ageLabel(h.modelAgeS) : "loading…" },
          { label: "API data age (board, every tick)", value: ageLabel(h.apiAgeS) },
        ]}
      />
    </div>
  );
}

function PlanTable({ rows, onOpen, dropped }: { rows: PlanRow[]; onOpen: (id: string) => void; dropped?: boolean }) {
  return (
    <DataTable
      columns={[
        { key: "k", label: "#", numeric: true },
        { key: "action", label: "Action" },
        { key: "target", label: "Touches" },
        { key: "figure", label: "Figure (code)", numeric: true },
        { key: "goal", label: "Goal" },
        { key: "reason", label: dropped ? "Why dropped" : "Budget" },
      ]}
      rows={rows.map((r, k) => ({
        k: String(k + 1),
        action: `${r.action} · ${r.route}`,
        target: r.open ? (
          <TableLink aria-label={`Open ${r.open}`} onClick={() => onOpen(r.open!)}>
            {r.target}
          </TableLink>
        ) : (
          r.target
        ),
        figure: r.figure !== null ? `${r.figure} P` : "—",
        goal: `${r.goal} → ${r.global}`,
        reason: dropped ? { value: r.reason, tone: "worse" as const } : r.reason,
      }))}
    />
  );
}

function Plan({ model, onOpen }: { model: GameModel | null; onOpen: (id: string) => void }) {
  const { selected, dropped } = planRows(model);
  const q = quotas(model);
  return (
    <Card title={`This tick's plan · ${selected.length} selected${model?.tick != null ? ` (model tick ${model.tick})` : ""}`}>
      <div style={col}>
        {q.length > 0 ? (
          <div className="nr-grid" style={gridCols("repeat(auto-fit, minmax(180px, 1fr))")}>
            {q.map((x) => (
              <Meter key={x.label} label={x.label} used={x.used} of={x.of} />
            ))}
          </div>
        ) : null}
        {!model ? <span className="nr-muted">Waiting for the first model build (14–47 s)…</span> : selected.length > 0 ? <PlanTable rows={selected} onOpen={onOpen} /> : <span className="nr-muted">Nothing selected this tick.</span>}
        <span className="nr-muted">There is no single objective per tick: each row serves its conversation's goal (goal.why → the global goal it feeds). Order = arbitration order (accepts by ACCEPT_PRIORITY and EV, then messages, threads, offers).</span>
        {dropped.length > 0 ? (
          <Fold title={`Dropped (${dropped.length})`}>
            <PlanTable rows={dropped} onOpen={onOpen} dropped />
          </Fold>
        ) : null}
      </div>
    </Card>
  );
}

function ConvTable({ rows, onOpen }: { rows: LiveConv[]; onOpen: (id: string) => void }) {
  return (
    <DataTable
      columns={[
        { key: "who", label: "With" },
        { key: "what", label: "Side · asset" },
        { key: "goal", label: "Goal · phase" },
        { key: "rounds", label: "Rounds (used / ~left)" },
        { key: "last", label: "Last: us / them", numeric: true },
        { key: "next", label: "Our next", numeric: true },
        { key: "herNext", label: "Her next ≈", numeric: true },
        { key: "deadline", label: "Deadline", numeric: true },
        { key: "status", label: "Status" },
      ]}
      rows={rows.map((c) => ({
        who: (
          <TableLink aria-label={`Open conversation ${c.key}`} onClick={() => onOpen(c.open)}>
            {`${c.counterparty} · ${c.kind}`}
          </TableLink>
        ),
        what: `${c.side === "buy" || c.side === "sell" ? `we ${c.side}` : c.side} ${c.asset}`,
        goal: `${c.why} · ${c.phase}`,
        rounds: c.roundsUsed === null ? "—" : `${c.roundsUsed} / ${c.roundsLeft !== null ? `~${c.roundsLeft}` : "?"}`,
        last: `${n(c.lastOurs)} / ${n(c.lastTheirs)}`,
        next: c.next !== null ? `${c.next} P` : "—",
        herNext: c.herNext !== null ? `≈ ${Math.round(c.herNext * 10) / 10} P` : "—",
        deadline: c.deadlineIn !== null ? `${c.deadlineIn} ticks` : "—",
        status: <Flag kind={STATUS_FLAG[c.status]}>{c.status}</Flag>,
      }))}
      onRowClick={(i) => {
        const c = rows[i];
        if (c) onOpen(c.open);
      }}
    />
  );
}

function Conversations({ board, model, onOpen }: { board: Board; model: GameModel | null; onOpen: (id: string) => void }) {
  const { active, done } = liveConversations(board, model);
  const tally = done.reduce<Record<string, number>>((m, c) => {
    const k = (c.outcome ?? "done").split(" @")[0]!;
    m[k] = (m[k] ?? 0) + 1;
    return m;
  }, {});
  return (
    <Card title={`Live conversations · ${active.length} active`}>
      <div style={col}>
        {active.length > 0 ? <ConvTable rows={active} onOpen={onOpen} /> : <span className="nr-muted">Nothing active right now.</span>}
        {done.length > 0 ? (
          <Fold title={`Done today (${done.length}): ${Object.entries(tally).map(([k, v]) => `${v} ${k}`).join(" · ")}`}>
            <DataTable
              columns={[
                { key: "who", label: "With" },
                { key: "what", label: "Side · asset" },
                { key: "goal", label: "Goal" },
                { key: "outcome", label: "Outcome" },
                { key: "last", label: "Last: us / them", numeric: true },
              ]}
              rows={done.map((c) => ({
                who: (
                  <TableLink aria-label={`Open conversation ${c.key}`} onClick={() => onOpen(c.open)}>
                    {`${c.counterparty} · ${c.kind}`}
                  </TableLink>
                ),
                what: `${c.side === "buy" || c.side === "sell" ? `we ${c.side}` : c.side} ${c.asset}`,
                goal: c.why,
                outcome: c.outcome ?? "—",
                last: `${n(c.lastOurs)} / ${n(c.lastTheirs)}`,
              }))}
            />
          </Fold>
        ) : null}
      </div>
    </Card>
  );
}

function Offers({ board, model, onOpen }: { board: Board; model: GameModel | null; onOpen: (id: string) => void }) {
  const { lines, source } = offerLines(board, model);
  const v = model?.now?.venue ?? null;
  const tick = board.clock?.tick ?? model?.tick ?? null;
  return (
    <Card title={`Our published offers · ${lines.length} open`}>
      <div style={col}>
        {lines.length > 0 ? (
          <DataTable
            columns={[
              { key: "id", label: "Offer" },
              { key: "venue", label: "Venue" },
              { key: "what", label: "We give → we want" },
              { key: "price", label: "Price", numeric: true },
              { key: "age", label: "Age / expires", numeric: true },
              { key: "fee", label: "Fee" },
              { key: "cross", label: "Crosses?" },
              { key: "goal", label: "Goal" },
            ]}
            rows={lines.map((o) => ({
              id: board.rows.some((r) => r.id === `offer:${o.id}`) ? (
                <TableLink aria-label={`Open offer ${o.id}`} onClick={() => onOpen(`offer:${o.id}`)}>
                  {`#${o.id} ${o.side}`}
                </TableLink>
              ) : (
                `#${o.id} ${o.side}`
              ),
              venue: o.venue_name ? `${o.venue} · ${o.venue_name}` : o.venue,
              what: `${o.give} → ${o.want}`,
              price: o.price !== null ? `${o.price} P` : "—",
              age: `${o.age !== null ? `${o.age} tick${o.age === 1 ? "" : "s"}` : "—"}${o.expiresIn !== null ? ` / in ${o.expiresIn}` : ""}`,
              fee: o.fee ? `${o.fee.bps / 100}%${o.fee.per_card ? ` + ${o.fee.per_card}/card` : ""}${o.fee.est !== null ? ` ≈ ${o.fee.est} P` : ""}` : "—",
              cross: o.crosses === "unknown" ? "book not read" : o.crosses ? { value: `yes: #${o.crosses.offer} @ ${o.crosses.price}`, tone: "better" as const } : "no",
              goal: o.goal ?? "—",
            }))}
          />
        ) : (
          <span className="nr-muted">No open offers of ours.</span>
        )}
        {source === "board" ? <span className="nr-muted">From the board (the model has not built yet): venue, fee and crossing come with the model.</span> : null}
        <span>
          <strong>Our venue</strong>{" "}
          {v ? (
            <span className="nr-muted">
              {`${v.id} · ${v.name ?? "?"} · ${v.status ?? "?"} · mechanism ${v.mechanism ?? "?"} · fee ${v.fee_bps !== null ? `${v.fee_bps / 100}%` : "?"}${v.fee_per_card ? ` + ${v.fee_per_card}/card` : ""}`}
              {` · opened at tick ${n(v.opened_tick)}${v.opened_tick !== null && tick !== null ? ` (${tick - v.opened_tick} ticks ago)` : ""} · trades ${n(v.trades)} · volume ${n(v.volume)} · fees ${n(v.fees)}`}
              {v.pending_fee ? ` · pending fee ${v.pending_fee.fee_bps !== null ? `${v.pending_fee.fee_bps / 100}%` : "?"} at tick ${n(v.pending_fee.effective_tick)}${v.pending_fee.effective_tick !== null && tick !== null ? ` (in ${v.pending_fee.effective_tick - tick} ticks)` : ""}` : ""}
              {v.suspension_reason ? ` · suspended: ${v.suspension_reason}` : ""}
            </span>
          ) : board.market.venue ? (
            <span className="nr-muted">{`${board.market.venue.venue} · ${board.market.venue.status ?? "?"} · trades ${n(board.market.venue.trades)}`}</span>
          ) : (
            <span className="nr-muted">none</span>
          )}
        </span>
      </div>
    </Card>
  );
}

const CHANGE_FLAG: Record<Change["kind"], "decision" | "neutral" | "walk" | "fallback"> = { message: "neutral", price: "fallback", opened: "decision", closed: "walk", posted: "decision", gone: "walk" };

function Changes({ board, model, onOpen }: { board: Board; model: GameModel | null; onOpen: (id: string) => void }) {
  const snap = useMemo(() => snapshotOf(board, model), [board, model]);
  const [prev, setPrev] = useState<ReturnType<typeof rememberSnapshot>>(null);
  useEffect(() => setPrev(rememberSnapshot(snap)), [snap]);
  const changes = prev ? diffSnapshots(prev, snap, board) : null;
  return (
    <Card title={`What changed since the last tick${prev?.tick != null && snap.tick !== null ? ` (${prev.tick} → ${snap.tick})` : ""}`}>
      {changes === null ? (
        <span className="nr-muted">Keeping a snapshot of this tick; the diff shows from the next tick on (kept in memory, lost on reload).</span>
      ) : changes.length > 0 ? (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          {changes.map((c, k) => (
            <li key={k} style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
              <Flag kind={CHANGE_FLAG[c.kind]}>{c.kind}</Flag>
              {c.open ? (
                <TableLink aria-label={`Open ${c.open}`} onClick={() => onOpen(c.open!)}>
                  {c.text}
                </TableLink>
              ) : (
                <span>{c.text}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <span className="nr-muted">No change between the two ticks.</span>
      )}
    </Card>
  );
}

export function NowView({ board, model, onOpen }: { board: Board; model: GameModel | null; onOpen: (id: string) => void }) {
  const [boardAt, setBoardAt] = useState<number | null>(null);
  useEffect(() => {
    if (board.clock) setBoardAt(Date.now());
  }, [board]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <Header board={board} model={model} boardAt={boardAt} />
      <RadioRastro />
      <Plan model={model} onOpen={onOpen} />
      <Conversations board={board} model={model} onOpen={onOpen} />
      <Offers board={board} model={model} onOpen={onOpen} />
      <Changes board={board} model={model} onOpen={onOpen} />
    </div>
  );
}
