import { useState } from "react";
import { DirectedOffers } from "./DirectedOffers.js";
import { Card, DataTable } from "@negotiation-ring/design-system";
import {
  teamLabel,
  type Board,
  type BoardBookRow,
  type BoardVenueBook,
} from "../../model/index.js";
import {
  filterVenues,
  markLabel,
  NO_FILTERS,
  summaryOf,
  type Tone,
  type VenueFilters,
} from "./venuesModel.js";

/**
 * «Venues» tab: every open venue's book (as `bazaar:play` read it this tick, no extra GETs) with asks and bids side by
 * side, each offer marked against our hand and values: NEG at our values as the taker (fee included), «dup» on a card
 * we already hold, «our last copy» on a bid we must not fill. Read-only: nothing here sends.
 */

const TONE: Record<Exclude<Tone, null>, string> = {
  ok: "var(--ok)",
  warn: "var(--warn)",
  muted: "var(--muted)",
  us: "var(--us)",
};
const signed = (v: number) => `${v > 0 ? "+" : ""}${v}`;

function who(board: Board, id: string | null): string {
  if (!id) return "?";
  return /^t\d+$/.test(id) ? teamLabel(board, id) : id;
}

function rowsOf(board: Board, rows: BoardBookRow[]) {
  return rows.map((r) => {
    const m = markLabel(r);
    const neg =
      r.neg === null ? (
        <span className="nr-muted">—</span>
      ) : (
        <span
          style={{
            color:
              r.neg > 0 && m.tone === "ok"
                ? "var(--ok)"
                : r.neg > 0
                  ? undefined
                  : "var(--warn)",
            fontWeight: 700,
          }}
        >
          {signed(r.neg)}
        </span>
      );
    const cards = r.refs.join(" + ") || "—";
    return {
      card: (
        <span
          style={r.to_us ? { fontWeight: 800, color: "var(--us)" } : undefined}
          title={r.to_us ? "addressed to us (also in Team desk)" : undefined}
        >
          {r.to_us ? "→ us · " : ""}
          {cards}
        </span>
      ),
      price: `${r.price} P`,
      neg,
      mark: m.text ? (
        <span
          style={{ color: m.tone ? TONE[m.tone] : undefined, fontSize: 12 }}
        >
          {m.text}
        </span>
      ) : (
        ""
      ),
      who: (
        <span className="nr-muted" style={{ fontSize: 12 }}>
          {who(board, r.maker)}
          {r.wanted_by.length ? ` · wanted by ${r.wanted_by.length}` : ""}
          {r.held_by.length ? ` · held by ${r.held_by.length}` : ""}
        </span>
      ),
    };
  });
}

const COLUMNS = [
  { key: "card", label: "Card" },
  { key: "price", label: "Price", numeric: true },
  { key: "neg", label: "NEG (our values)", numeric: true },
  { key: "mark", label: "For us" },
  { key: "who", label: "Maker" },
];

function Venue({ board, v }: { board: Board; v: BoardVenueBook }) {
  const owner = v.house ? "house" : v.owner ? who(board, v.owner) : "?";
  const fee = `${v.fee_bps / 100}%${v.fee_per_card ? ` + ${v.fee_per_card} P/card` : ""}`;
  const badges = [
    v.ours ? "ours: can't trade" : null,
    v.off_limits ? "off-limits" : null,
  ].filter(Boolean) as string[];
  return (
    <Card title={`${v.venue}${v.name ? ` · ${v.name}` : ""}`}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          minWidth: 0,
        }}
      >
        <span className="nr-muted">
          {`owner ${owner} · fee ${fee} · ${v.mechanism ?? "?"}${v.status && v.status !== "open" ? ` · ${v.status}` : ""}`}
          {badges.map((b) => (
            <span
              key={b}
              style={{
                marginLeft: 8,
                padding: "1px 6px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--warn)",
                color: "var(--warn)",
                fontSize: 11,
                fontWeight: 700,
              }}
              title={
                b === "off-limits"
                  ? "we don't operate here: a deal lifts a rival's market score"
                  : undefined
              }
            >
              {b}
            </span>
          ))}
        </span>
        <div
          className="nr-grid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
            gap: "var(--space-3)",
          }}
        >
          <div style={{ minWidth: 0, overflowX: "auto" }}>
            <strong>{`Asks · they sell (${v.asks.length})`}</strong>
            {v.asks.length ? (
              <DataTable columns={COLUMNS} rows={rowsOf(board, v.asks)} />
            ) : (
              <div className="nr-muted">none</div>
            )}
          </div>
          <div style={{ minWidth: 0, overflowX: "auto" }}>
            <strong>{`Bids · they buy (${v.bids.length})`}</strong>
            {v.bids.length ? (
              <DataTable columns={COLUMNS} rows={rowsOf(board, v.bids)} />
            ) : (
              <div className="nr-muted">none</div>
            )}
          </div>
        </div>
        {v.swaps.length ? (
          <div style={{ minWidth: 0, overflowX: "auto" }}>
            <strong>{`Swaps and mixed (${v.swaps.length})`}</strong>
            <DataTable columns={COLUMNS} rows={rowsOf(board, v.swaps)} />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function Toggle({
  label,
  on,
  set,
}: {
  label: string;
  on: boolean;
  set: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "inline-flex",
        gap: 6,
        alignItems: "center",
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => set(e.target.checked)}
      />
      {label}
    </label>
  );
}

export function VenueBooks({ board }: { board: Board }) {
  const [f, setF] = useState<VenueFilters>(NO_FILTERS);
  const books = board.venue_books;
  if (!books) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <Card title="All venues">
          <span className="nr-muted">
            No venue-books.json for today yet: bazaar:play writes it every tick
            (needs a play restart on the commit that adds it).
          </span>
        </Card>
        <DirectedOffers board={board} />
      </div>
    );
  }
  const venues = filterVenues(books, f);
  const s = summaryOf(venues);
  const set = (patch: Partial<VenueFilters>) => setF({ ...f, ...patch });
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}
    >
      <Card
        title={`All venues · ${venues.length} shown · tick ${books.tick ?? "?"}`}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          <span>
            {`${s.offers} offers · `}
            <strong
              style={{ color: s.positive ? "var(--ok)" : undefined }}
            >{`${s.positive} with NEG > 0 we could take`}</strong>
            {s.toUs ? (
              <span
                style={{ color: "var(--us)" }}
              >{` · ${s.toUs} addressed to us`}</span>
            ) : null}
          </span>
          <div
            style={{
              display: "flex",
              gap: "var(--space-3)",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Toggle
              label="only cards we lack"
              on={f.lack}
              set={(v) => set({ lack: v })}
            />
            <Toggle
              label="only bids for our cards"
              on={f.ourBids}
              set={(v) => set({ ourBids: v })}
            />
            <Toggle
              label="only NEG > 0"
              on={f.negPositive}
              set={(v) => set({ negPositive: v })}
            />
            <Toggle
              label="hide off-limits"
              on={f.hideOffLimits}
              set={(v) => set({ hideOffLimits: v })}
            />
            <input
              type="search"
              placeholder="card (SAL-06)"
              value={f.ref}
              onChange={(e) => set({ ref: e.target.value })}
              aria-label="Filter by card"
              style={{ maxWidth: 160 }}
            />
          </div>
          <span className="nr-muted" style={{ fontSize: 11 }}>
            NEG at our values as the taker, fee included: a bid for a card we
            hold = price − value − fee (only a spare is takeable; never our last
            copy); an ask for a card we lack = value − price − fee. An ask for a
            card we already hold is «dup»: a second copy is worth ~3–4, not our
            value, so no figure. A guide, never a price the agent uses.
          </span>
        </div>
      </Card>
      <DirectedOffers board={board} />
      {venues.length === 0 ? (
        <span className="nr-muted">No offer matches these filters.</span>
      ) : (
        venues.map((v) => <Venue key={v.venue} board={board} v={v} />)
      )}
    </div>
  );
}
