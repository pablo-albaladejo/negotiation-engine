import { Card, ChatMessage, DataTable, Flag, KpiStrip } from "@negotiation-ring/design-system";
import { useId } from "react";
import { gridCols } from "../ui/grid.js";
import { PageTitle } from "../ui/page-title.js";
import { TableLink } from "../ui/buttons.js";
import { EmptyStateCard } from "../ui/states.js";
import {
  ALL,
  boardFilterOptions,
  boardTimeline,
  filterBoardRows,
  KIND_LABEL,
  type Board,
  type BazaarModel,
  type BoardFilters,
  type BoardRow,
  type BoardRowKind,
  type BoardVerdict,
} from "../model/index.js";

export interface BazaarScreenProps {
  board: Board;
  /** Snapshots locales de `score.jsonl` (historia de la cifra y qué la movió). */
  model: BazaarModel;
  filters: BoardFilters;
  onFiltersChange: (filters: BoardFilters) => void;
}

const NOT_LOGGED = "not logged";

const show = (v: number | string | null | undefined, empty = NOT_LOGGED): string => (v === null || v === undefined ? empty : String(v));

function toned(v: number | null): { value: string; tone?: "better" | "worse" } {
  if (v === null) return { value: NOT_LOGGED };
  return v > 0 ? { value: `+${v}`, tone: "better" } : v < 0 ? { value: String(v), tone: "worse" } : { value: String(v) };
}

function verdictCell(v: BoardVerdict): { value: string; tone?: "better" | "worse" } {
  if (v === "good") return { value: v, tone: "better" };
  if (v === "bad") return { value: v, tone: "worse" };
  return { value: v };
}

function SelectField({ label, value, options, onChange, format }: { label: string; value: string; options: string[]; onChange: (v: string) => void; format?: (v: string) => string }) {
  const id = useId();
  return (
    <div className="nr-filter-field">
      <label className="nr-muted nr-filter-label" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="nr-filter-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value={ALL}>All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {format ? format(o) : o}
          </option>
        ))}
      </select>
    </div>
  );
}

function FiltersBar({ rows, filters, onChange }: { rows: BoardRow[]; filters: BoardFilters; onChange: (f: BoardFilters) => void }) {
  const opts = boardFilterOptions(rows);
  const sortId = useId();
  const set = (patch: Partial<BoardFilters>) => onChange({ ...filters, ...patch });
  return (
    <div className="nr-filters" role="group" aria-label="Conversation filters">
      <SelectField label="Kind" value={filters.kind} options={opts.kind} onChange={(kind) => set({ kind })} format={(k) => KIND_LABEL[k as BoardRowKind] ?? k} />
      <SelectField label="Counterparty" value={filters.counterparty} options={opts.counterparty} onChange={(counterparty) => set({ counterparty })} />
      <SelectField label="Status" value={filters.status} options={opts.status} onChange={(status) => set({ status })} />
      <SelectField label="Verdict" value={filters.verdict} options={opts.verdict} onChange={(verdict) => set({ verdict })} />
      <div className="nr-filter-field">
        <label className="nr-muted nr-filter-label" htmlFor={sortId}>
          Sort by
        </label>
        <select id={sortId} className="nr-filter-select" value={filters.sort} onChange={(e) => set({ sort: e.target.value === "surplus" ? "surplus" : "tick" })}>
          <option value="tick">Tick (newest first)</option>
          <option value="surplus">Surplus (best first)</option>
        </select>
      </div>
    </div>
  );
}

function ConversationList({ rows, selectedId, onSelect }: { rows: BoardRow[]; selectedId: string; onSelect: (id: string) => void }) {
  const selectedIndex = rows.findIndex((r) => r.id === selectedId);
  return (
    <DataTable
      columns={[
        { key: "counterparty", label: "Counterparty" },
        { key: "kind", label: "Kind" },
        { key: "item", label: "Item" },
        { key: "status", label: "Status" },
        { key: "price", label: "Price", numeric: true },
        { key: "value", label: "Our value", numeric: true },
        { key: "surplus", label: "Surplus", numeric: true },
        { key: "verdict", label: "Verdict" },
        { key: "neg", label: "Δ neg", numeric: true },
        { key: "ladder", label: "Δ ladder", numeric: true },
        { key: "score", label: "Δ score", numeric: true },
        { key: "ticks", label: "Ticks" },
      ]}
      rows={rows.map((r) => ({
        counterparty: (
          <TableLink aria-pressed={r.id === selectedId} aria-label={`Open conversation with ${r.counterparty} (${r.id})`} onClick={() => onSelect(r.id)}>
            {r.counterparty}
          </TableLink>
        ),
        kind: KIND_LABEL[r.kind] ?? r.kind,
        item: r.item,
        status: r.closed_reason ? `${r.status} · ${r.closed_reason}` : r.status,
        price: show(r.price, "—"),
        value: r.our_value === null ? (r.value_source === NOT_LOGGED ? NOT_LOGGED : "—") : `${r.our_value}${r.value_source ? ` (${r.value_source})` : ""}`,
        surplus: r.surplus === null ? "—" : toned(r.surplus),
        verdict: verdictCell(r.verdict),
        neg: toned(r.d_neg_points),
        ladder: toned(r.d_ladder_points),
        score: toned(r.d_score),
        ticks: `${show(r.tick_opened, "?")} → ${show(r.tick_settled, "…")}`,
      }))}
      onRowClick={(i) => {
        const row = rows[i];
        if (row) onSelect(row.id);
      }}
      {...(selectedIndex >= 0 ? { selectedRowIndex: selectedIndex } : {})}
    />
  );
}

/** Conversación completa: mensajes literales (nunca interpretados) alineados por tick con nuestras
 * decisiones (`decisions.jsonl`), y la línea de tiempo de ofertas. */
function ConversationDetail({ row }: { row: BoardRow }) {
  const steps = boardTimeline(row);
  return (
    <Card title={`Conversation · ${row.counterparty} · ${KIND_LABEL[row.kind] ?? row.kind}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
          <Flag kind={row.verdict === "bad" ? "walk" : row.verdict === "good" ? "decision" : "neutral"}>{row.verdict}</Flag>
          <span>{row.item}</span>
          <span className="nr-muted">
            {row.status}
            {row.closed_reason ? ` · ${row.closed_reason}` : ""} · price {show(row.price, "—")} · our value {show(row.our_value)}
            {row.value_source ? ` (${row.value_source})` : ""} · surplus {show(row.surplus, "—")}
            {row.duel_result !== null ? ` · duel result ${row.duel_result}` : ""}
          </span>
        </div>
        {steps.length > 0 ? (
          <div className="nr-chat" aria-label="Messages and our decisions by tick">
            {steps.map((s, i) => (
              <div key={`${s.tick ?? "?"}-${i}`} className="nr-grid" style={gridCols("minmax(0, 2fr) minmax(0, 1fr)")}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {s.messages.map((m, j) => (
                    <ChatMessage key={j} side={m.us ? "us" : "them"} round={m.tick ?? 0} {...(m.price !== null ? { offer: m.price } : {})} flags={[{ kind: "neutral", label: m.sender }]} text={m.text} />
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  {s.decisions.map((d, j) => (
                    <span key={j} className="nr-muted">
                      {[`tick ${show(d.tick, "?")}`, d.action, d.rule ? `rule ${d.rule}` : null, d.reservation !== null ? `reservation ${d.reservation}` : null, d.ourPrice !== null ? `our price ${d.ourPrice}` : null, d.herPrice !== null ? `their price ${d.herPrice}` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <span className="nr-muted">No messages for this entry.</span>
        )}
        {row.offers.length > 0 ? (
          <DataTable
            columns={[
              { key: "tick", label: "Tick", numeric: true },
              { key: "maker", label: "Maker" },
              { key: "give", label: "Gives" },
              { key: "want", label: "Wants" },
              { key: "final", label: "Final" },
              { key: "status", label: "Status" },
            ]}
            rows={row.offers.map((o) => ({ tick: show(o.tick, "?"), maker: o.maker, give: o.give, want: o.want, final: o.final ? "final" : "", status: o.status }))}
          />
        ) : null}
      </div>
    </Card>
  );
}

function MarketPanel({ board }: { board: Board }) {
  const { clock, market } = board;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <Card title="Clock">
        {clock ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span>Tick {clock.tick}</span>
            <span className="nr-muted">{show(clock.round_name ?? clock.round, "round ?")}</span>
            <span className="nr-muted">
              Next tick in {clock.next_tick_in !== null ? `${Math.round(clock.next_tick_in)} s` : "?"} · doors {show(clock.doors, "?")}
            </span>
            {board.source === "snapshot" ? <span className="nr-muted">From the monitor snapshot (Bazaar unreachable).</span> : null}
          </div>
        ) : (
          <span className="nr-muted">{NOT_LOGGED}</span>
        )}
      </Card>
      <Card title="Leaderboard">
        {market.leaderboard.length > 0 ? (
          <DataTable
            columns={[
              { key: "rank", label: "Rank", numeric: true },
              { key: "team", label: "Team" },
              { key: "score", label: "Score", numeric: true },
            ]}
            rows={market.leaderboard.map((t) => ({ rank: show(t.rank, "?"), team: t.us ? { value: `${t.name} (us)`, tone: "better" as const } : t.name, score: show(t.score, "?") }))}
            {...(market.leaderboard.findIndex((t) => t.us) >= 0 ? { selectedRowIndex: market.leaderboard.findIndex((t) => t.us) } : {})}
          />
        ) : (
          <span className="nr-muted">{NOT_LOGGED}</span>
        )}
      </Card>
      <Card title="Recent feed">
        {market.feed.length > 0 ? (
          <ul className="nr-list" aria-label="Recent feed events" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            {market.feed.map((e) => (
              <li key={e.id}>
                <span className="nr-muted">
                  {show(e.tick, "?")} · {e.type}
                </span>{" "}
                <span>{e.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="nr-muted">{NOT_LOGGED}</span>
        )}
      </Card>
      <Card title="El Rastro book">
        {market.rastro.length > 0 ? (
          <DataTable
            columns={[
              { key: "maker", label: "Maker" },
              { key: "give", label: "Gives" },
              { key: "want", label: "Wants" },
              { key: "exp", label: "Expires", numeric: true },
            ]}
            rows={market.rastro.map((o) => ({ maker: o.maker === board.team ? { value: `${o.maker} (us)`, tone: "better" as const } : o.maker, give: o.give, want: o.want, exp: show(o.expires_tick, "—") }))}
          />
        ) : (
          <span className="nr-muted">{NOT_LOGGED}</span>
        )}
      </Card>
      {market.venue ? (
        <Card title={`Our venue · ${market.venue.venue}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <span>{show(market.venue.name, market.venue.venue)}</span>
            <span className="nr-muted">
              {show(market.venue.status, "?")} · trades {show(market.venue.trades, "?")} · volume {show(market.venue.volume, "?")}
            </span>
            {market.venue.book.length > 0 ? (
              <DataTable
                columns={[
                  { key: "maker", label: "Maker" },
                  { key: "give", label: "Gives" },
                  { key: "want", label: "Wants" },
                ]}
                rows={market.venue.book.map((o) => ({ maker: o.maker, give: o.give, want: o.want }))}
              />
            ) : (
              <span className="nr-muted">No offers on our venue.</span>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

/**
 * Bazaar: UNA lista de todas nuestras conversaciones (dealers, duelos, tratos y ofertas entre
 * equipos) con precio, valor, excedente, veredicto y deltas ya calculados por el servidor
 * (`/api/bazaar/board`); la UI nunca calcula métricas. Clic en una fila → conversación completa.
 * Filtros en la query del hash. Panel de mercado: reloj, clasificación, feed, El Rastro y nuestro venue.
 */
export function BazaarScreen({ board, model, filters, onFiltersChange }: BazaarScreenProps) {
  const h = board.header;
  const latest = model.latest;
  const rows = filterBoardRows(board.rows, filters);
  const selected = board.rows.find((r) => r.id === filters.row) ?? null;
  const select = (id: string) => onFiltersChange({ ...filters, row: id });
  const clock = board.clock;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <PageTitle>Bazaar</PageTitle>
        <span className="nr-muted" aria-live="polite">
          {clock ? `${h?.team ?? board.team ?? "?"} · ${clock.round_name ?? "?"} · tick ${clock.tick}` : NOT_LOGGED}
        </span>
      </div>
      <KpiStrip
        items={[
          { label: "Score", value: show(h?.score ?? latest?.score) },
          { label: "Negotiating", value: show(h?.negotiating ?? latest?.negotiating) },
          { label: "Neg points", value: show(h?.neg_points ?? latest?.neg_points) },
          { label: "Ladder", value: show(h?.ladder_points ?? latest?.ladder_points) },
          { label: "Market", value: show(h?.market ?? latest?.market) },
          { label: "Duel points", value: show(h?.duel_points ?? latest?.duel_points) },
          { label: "Rank", value: show(h?.rank ?? latest?.rank) },
          { label: "Cash", value: show(h?.cash) },
          { label: "Level", value: show(h?.level ?? latest?.level) },
        ]}
      />
      <div className="nr-grid" style={gridCols("minmax(0, 3fr) minmax(260px, 1fr)")}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", minWidth: 0 }}>
          {board.rows.length === 0 ? (
            <EmptyStateCard title={board.live ? "No Bazaar conversations yet" : "No live Bazaar data (BAZAAR_KEY not set on the viewer server, or the Bazaar is unreachable)"} />
          ) : (
            <Card title={`Conversations (${rows.length} of ${board.rows.length})`}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <FiltersBar rows={board.rows} filters={filters} onChange={onFiltersChange} />
                {rows.length > 0 ? <ConversationList rows={rows} selectedId={filters.row} onSelect={select} /> : <span className="nr-muted">No conversations match these filters.</span>}
              </div>
            </Card>
          )}
          {selected ? <ConversationDetail row={selected} /> : board.rows.length > 0 ? <span className="nr-muted">Select a conversation to see every message.</span> : null}
          <Card title="What moved the score">
            {model.moved.length > 0 ? (
              <DataTable
                columns={[
                  { key: "tick", label: "Tick", numeric: true },
                  { key: "component", label: "Component" },
                  { key: "delta", label: "Delta", numeric: true },
                  { key: "cause", label: "Cause" },
                ]}
                rows={model.moved.map((m) => ({ tick: m.tick, component: m.component, delta: toned(m.delta), cause: m.cause }))}
              />
            ) : (
              <span className="nr-muted">No logged score changes yet.</span>
            )}
          </Card>
        </div>
        <MarketPanel board={board} />
      </div>
    </section>
  );
}
