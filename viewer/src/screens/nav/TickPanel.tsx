import { DataTable, TableLink } from "@negotiation-ring/design-system";
import type { ReactNode } from "react";
import { KIND_LABEL, type Board, type BoardRow } from "../../model/index.js";
import { SecondaryButton } from "../../ui/buttons.js";
import { TeamName } from "../teams/TeamLink.js";
import { DealerName } from "./Links.js";

/**
 * «Tick N» drawer: everything the board saw within a few ticks of N, oldest first — our conversations (opened,
 * a message, settled), other teams' trades, directed offers, the public feed, eggs found, crafts and grants. Each
 * conversation opens its drawer; teams and dealers link to their tabs. Read-only.
 */

const WINDOW = 2;

interface Event {
  tick: number;
  what: string;
  who: ReactNode;
  detail: ReactNode;
  open?: string;
}

function rowEvents(r: BoardRow, lo: number, hi: number, board: Board, ours: boolean): Event[] {
  const out: Event[] = [];
  const inWin = (t: number | null): t is number => t !== null && t >= lo && t <= hi;
  const who = ours ? <TeamName board={board} team={r.counterparty} /> : <span>{(r.parties ?? [r.counterparty]).map((p, i) => (<span key={p}>{i ? " × " : ""}<TeamName board={board} team={p} /></span>))}</span>;
  const label = KIND_LABEL[r.kind] ?? r.kind;
  if (inWin(r.tick_opened)) out.push({ tick: r.tick_opened, what: `${label} opened`, who, detail: r.item || "—", open: r.id });
  if (ours)
    for (const m of r.messages)
      if (inWin(m.tick) && m.tick !== r.tick_opened && m.tick !== r.tick_settled)
        out.push({ tick: m.tick, what: `${label} · ${m.us ? "we" : "they"} wrote`, who, detail: m.price !== null ? `${m.price} P` : "—", open: r.id });
  if (inWin(r.tick_settled) && r.tick_settled !== r.tick_opened) out.push({ tick: r.tick_settled, what: `${label} ${r.status}`, who, detail: `${r.item || "—"}${r.price !== null ? ` · ${r.price} P` : ""}`, open: r.id });
  else if (inWin(r.tick_settled)) out[out.length - 1] = { ...out[out.length - 1]!, what: `${label} ${r.status}`, detail: `${r.item || "—"}${r.price !== null ? ` · ${r.price} P` : ""}` };
  return out;
}

export function TickPanel({ board, tick, onTick, onOpen }: { board: Board; tick: number; onTick: (t: number) => void; onOpen: (id: string) => void }) {
  const lo = tick - WINDOW;
  const hi = tick + WINDOW;
  const inWin = (t: number | null | undefined): t is number => typeof t === "number" && t >= lo && t <= hi;
  const events: Event[] = [
    ...board.rows.flatMap((r) => rowEvents(r, lo, hi, board, true)),
    ...board.others.flatMap((r) => rowEvents(r, lo, hi, board, false)),
    ...(board.directed ?? [])
      .filter((d) => inWin(d.tick))
      .map((d) => ({
        tick: d.tick!,
        what: `directed offer (${d.side})`,
        who: (
          <span>
            <TeamName board={board} team={d.maker} /> → <TeamName board={board} team={d.to} />
          </span>
        ),
        detail: `${d.refs.join(" + ") || "—"} · ${d.price} P · ${d.status}`,
      })),
    ...board.market.feed.filter((f) => inWin(f.tick)).map((f) => ({ tick: f.tick!, what: `feed · ${f.type}`, who: "—", detail: f.text })),
    ...(board.eggs?.personas ?? []).flatMap((p) =>
      p.found
        .filter((f) => inWin(f.tick))
        .map((f) => ({
          tick: f.tick,
          what: "egg found",
          who: <TeamName board={board} team={f.team} />,
          detail: (
            <span>
              <DealerName id={p.persona}>{p.persona_name ?? p.persona}</DealerName>
              {f.name ? ` · ${f.name}` : ""}
            </span>
          ),
        })),
    ),
    ...(board.workshop?.crafts ?? [])
      .filter((c) => inWin(c.tick))
      .map((c) => ({ tick: c.tick!, what: "workshop craft", who: <TeamName board={board} team={c.team} />, detail: `${c.from ?? "?"} → ${c.card ?? "?"} (${c.to ?? "?"})` })),
    ...(board.grants ?? [])
      .filter((g) => inWin(g.tick))
      .map((g) => ({ tick: g.tick!, what: "grant", who: g.actor ?? "—", detail: [...(g.cash ? [`+${g.cash} P`] : []), ...g.packs.map((x) => `pack ${x}`), ...g.cards].join(" + ") || "—" })),
  ].sort((a, b) => a.tick - b.tick);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SecondaryButton onClick={() => onTick(tick - 1)}>← t{tick - 1}</SecondaryButton>
        <strong style={{ fontSize: 18 }}>{`Tick ${tick}`}</strong>
        <SecondaryButton onClick={() => onTick(tick + 1)}>t{tick + 1} →</SecondaryButton>
        <span className="nr-muted">{`Showing t${lo}–t${hi} · ${events.length} events${board.fetched_tick !== null ? ` · now t${board.fetched_tick}` : ""}`}</span>
      </div>
      {events.length ? (
        <DataTable
          columns={[
            { key: "tick", label: "Tick", numeric: true },
            { key: "what", label: "What" },
            { key: "who", label: "Who" },
            { key: "detail", label: "Detail" },
          ]}
          rows={events.map((e) => ({
            tick: e.tick === tick ? <strong style={{ color: "var(--us)" }}>{e.tick}</strong> : e.tick,
            what: e.open ? (
              <TableLink aria-label={`Open ${e.open}`} onClick={() => onOpen(e.open!)}>
                {e.what}
              </TableLink>
            ) : (
              e.what
            ),
            who: e.who,
            detail: e.detail,
          }))}
        />
      ) : (
        <span className="nr-muted">Nothing seen in these ticks (the board keeps the recent feed and our conversations; older ticks may be thin).</span>
      )}
    </div>
  );
}
