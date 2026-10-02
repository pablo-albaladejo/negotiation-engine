import { Card, ChatMessage, DataTable, Flag, Legend, OfferChart } from "@negotiation-ring/design-system";
import { useEffect, useId, useState, type ReactNode } from "react";
import { gridCols } from "../ui/grid.js";
import { PageTitle } from "../ui/page-title.js";
import { SecondaryButton, TableLink } from "../ui/buttons.js";
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
  agentLines,
  bookMakerLabel,
  historyGroups,
  liveItems,
  mentionsUs,
  offerCurve,
  ourOfferIds,
  partyOf,
  scheduleLines,
  scoreMovers,
  scoreParts,
  standingOf,
  teamLabel,
  withTeamNames,
  type BoardAlbumPage,
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
      <div className="nr-filter-field">
        <label className="nr-muted nr-filter-label" htmlFor={sortId}>
          Sort by
        </label>
        <select id={sortId} className="nr-filter-select" value={filters.sort} onChange={(e) => set({ sort: e.target.value === "surplus" ? "surplus" : "tick" })}>
          <option value="tick">Tick (newest first)</option>
          <option value="surplus">Margin (best first)</option>
        </select>
      </div>
    </div>
  );
}

function ConversationList({ board, rows, selectedId, onSelect }: { board: Board; rows: BoardRow[]; selectedId: string; onSelect: (id: string) => void }) {
  const selectedIndex = rows.findIndex((r) => r.id === selectedId);
  return (
    <DataTable
      columns={[
        { key: "counterparty", label: "With" },
        { key: "party", label: "Who they are" },
        { key: "kind", label: "Kind" },
        { key: "item", label: "Item" },
        { key: "status", label: "Status" },
        { key: "price", label: "Price", numeric: true },
        { key: "value", label: "Our value", numeric: true },
        { key: "surplus", label: "Margin vs our value", numeric: true },
        { key: "score", label: "Δ score", numeric: true },
        { key: "ticks", label: "Ticks" },
      ]}
      rows={rows.map((r) => ({
        counterparty: (
          <TableLink aria-pressed={r.id === selectedId} aria-label={`Open conversation with ${r.counterparty} (${r.id})`} onClick={() => onSelect(r.id)}>
            {partyOf(board, r).label}
          </TableLink>
        ),
        party: partyOf(board, r).kind,
        kind: KIND_LABEL[r.kind] ?? r.kind,
        item: r.item,
        status: r.closed_reason ? `${r.status} · ${r.closed_reason}` : r.status,
        price: show(r.price, "—"),
        value: r.our_value === null ? (r.value_source === NOT_LOGGED ? NOT_LOGGED : "—") : `${r.our_value}${r.value_source ? ` (${r.value_source})` : ""}`,
        surplus: r.surplus === null ? "—" : toned(r.surplus),
        score: r.d_score === null ? "—" : toned(r.d_score),
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
function ConversationDetail({ board, row }: { board: Board; row: BoardRow }) {
  const steps = boardTimeline(row);
  const party = partyOf(board, row);
  const maker = (m: string) => (m === board.team ? { value: teamLabel(board, m), tone: "better" as const } : withTeamNames(board, m));
  return (
    <Card title={`Conversation · ${party.label} (${party.kind}) · ${KIND_LABEL[row.kind] ?? row.kind}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
          {row.d_score !== null && row.d_score !== 0 ? <Flag kind={row.d_score < 0 ? "walk" : "decision"}>{`Δ score ${row.d_score > 0 ? "+" : ""}${row.d_score}`}</Flag> : null}
          <span>{row.item}</span>
          <span className="nr-muted">
            {row.status}
            {row.closed_reason ? ` · ${row.closed_reason}` : ""} · price {show(row.price, "—")} · our value {show(row.our_value)}
            {row.value_source ? ` (${row.value_source})` : ""} · margin vs our value {show(row.surplus, "—")}
            {row.duel_result !== null ? ` · duel result ${row.duel_result}` : ""}
          </span>
        </div>
        <NegotiationCurve row={row} />
        {steps.length > 0 ? (
          <div className="nr-chat" aria-label="Messages and our decisions by tick">
            {steps.map((s, i) => (
              <div key={`${s.tick ?? "?"}-${i}`} className="nr-grid" style={gridCols("minmax(0, 2fr) minmax(0, 1fr)")}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {s.messages.map((m, j) => (
                    <ChatMessage key={j} side={m.us ? "us" : "them"} round={m.tick ?? 0} {...(m.price !== null ? { offer: m.price } : {})} flags={[{ kind: m.us ? "decision" : "neutral", label: m.us ? teamLabel(board, board.team || m.sender) : withTeamNames(board, m.sender) }]} text={m.text} />
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
            rows={row.offers.map((o) => ({ tick: show(o.tick, "?"), maker: maker(o.maker), give: o.give, want: o.want, final: o.final ? "final" : "", status: o.status }))}
          />
        ) : null}
      </div>
    </Card>
  );
}

/** Curva de la negociación: nuestras ofertas, las suyas, nuestro límite y el final. */
function NegotiationCurve({ row }: { row: BoardRow }) {
  const curve = offerCurve(row);
  if (!curve) return null;
  return (
    <figure aria-label="Negotiation curve" style={{ margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <OfferChart
        rounds={curve.rounds}
        yDomain={curve.yDomain}
        ourOffers={curve.ours}
        theirOffers={curve.theirs}
        {...(curve.limit.length > 0 ? { target: curve.limit } : {})}
        {...(curve.fixedLimit !== null ? { ourReserve: curve.fixedLimit } : {})}
        {...(curve.end ? { end: curve.end } : {})}
      />
      <Legend
        items={[
          { kind: "us", label: "Team 2 (us)" },
          { kind: "them", label: row.counterparty },
          ...(curve.limit.length > 0 ? [{ kind: "target" as const, label: "our limit (reservation) by tick" }] : []),
          ...(curve.fixedLimit !== null ? [{ kind: "reserve-us" as const, label: `our limit ${curve.fixedLimit}` }] : []),
          ...(curve.end ? [{ kind: "end" as const, label: curve.end.label }] : []),
        ]}
      >
        <span className="nr-muted">X axis: ticks since tick {curve.firstTick} (1 = tick {curve.firstTick}).</span>
      </Legend>
    </figure>
  );
}

function MarketPanel({ board }: { board: Board }) {
  const { clock, market } = board;
  const ours = ourOfferIds(board);
  const bookMaker = (o: { id: number; maker: string }) => {
    const who = bookMakerLabel(board, o, ours);
    return who.us ? { value: who.label, tone: "better" as const } : who.label;
  };
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
                {mentionsUs(board, e.text) ? <strong>{withTeamNames(board, e.text)}</strong> : <span>{withTeamNames(board, e.text)}</span>}
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
            rows={market.rastro.map((o) => ({ maker: bookMaker(o), give: o.give, want: o.want, exp: show(o.expires_tick, "—") }))}
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
                rows={market.venue.book.map((o) => ({ maker: bookMaker(o), give: o.give, want: o.want }))}
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


const fmt = (v: number | null | undefined, digits = 2): string => (v === null || v === undefined ? "—" : String(Math.round(v * 10 ** digits) / 10 ** digits));

/** Sección plegable: el historial y el mercado no compiten con lo que hay que decidir ahora. */
function Fold({ title, open = false, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details className="nr-card" open={open} style={{ padding: "var(--space-3) var(--space-4)" }}>
      <summary style={{ cursor: "pointer", fontWeight: 700 }}>{title}</summary>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>{children}</div>
    </details>
  );
}

function Bar({ have, of, complete }: { have: number; of: number; complete: boolean }) {
  const pct = Math.round((100 * have) / Math.max(1, of));
  return (
    <div role="meter" aria-valuemin={0} aria-valuemax={of} aria-valuenow={have} aria-label={`${have} of ${of}`} style={{ height: 8, borderRadius: "var(--radius-pill)", background: "var(--line)", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: complete ? "var(--ok)" : pct >= 70 ? "var(--us)" : "var(--muted)" }} />
    </div>
  );
}

function Scoreboard({ board }: { board: Board }) {
  const st = standingOf(board);
  const h = board.header;
  return (
    <Card title="Score">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {board.team ? (
          <span>
            We are <strong style={{ color: "var(--us)" }}>{teamLabel(board, board.team)}</strong> <span className="nr-muted">· id {board.team} · ours are marked “(us)” everywhere</span>
          </span>
        ) : null}
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <span style={{ font: "800 44px/1 var(--font-display)" }}>{fmt(st.score)}</span>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{st.rank !== null ? `#${st.rank}${st.teams ? ` of ${st.teams}` : ""}` : "rank ?"}</span>
        </div>
        <span className="nr-muted">
          {st.ahead ? `${fmt(st.gapToAhead)} behind ${st.ahead.name} (next place)` : st.rank === 1 ? "We lead" : ""}
          {st.leader && st.leader.name !== st.ahead?.name ? ` · ${fmt(st.gapToLeader)} behind the leader ${st.leader.name}` : ""}
        </span>
        <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
          {scoreParts(board).map((p) => (
            <span key={p.label}>
              <span className="nr-muted">{p.label} </span>
              <strong style={{ color: p.value !== null && p.value < 0 ? "var(--warn)" : undefined }}>{fmt(p.value)}</strong>
            </span>
          ))}
        </div>
        <span>
          Cash <strong>{fmt(h?.cash, 0)} P</strong> · level {fmt(h?.level, 0)}
        </span>
      </div>
    </Card>
  );
}

function Upcoming({ board }: { board: Board }) {
  const lines = scheduleLines(board);
  const clock = board.clock;
  return (
    <Card title="Next up">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <span className="nr-muted" aria-live="polite">
          {clock ? `${clock.round_name ?? "?"} · tick ${clock.tick} · doors ${clock.doors ?? "?"}` : NOT_LOGGED}
          {board.schedule?.now_hours != null ? ` · game hour ${fmt(board.schedule.now_hours)}` : ""}
          {board.source === "snapshot" ? " · from snapshot (Bazaar unreachable)" : ""}
        </span>
        {lines.length > 0 ? (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            {lines.map((l, i) => (
              <li key={i}>
                <strong>{l.when}</strong> <span className="nr-muted">(h {l.at_hours})</span> · {l.action} — <span className="nr-muted">{l.note}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="nr-muted">No schedule.</span>
        )}
      </div>
    </Card>
  );
}

function RightNow({ board, onOpen }: { board: Board; onOpen: (id: string) => void }) {
  const items = liveItems(board);
  return (
    <Card title={`Right now (${items.length} open)`}>
      {items.length > 0 ? (
        <DataTable
          columns={[
            { key: "kind", label: "What" },
            { key: "title", label: "Deal" },
            { key: "who", label: "With" },
            { key: "state", label: "State" },
          ]}
          rows={items.map((it) => ({
            kind: it.kind,
            title: (
              <TableLink aria-label={`Open ${it.id}`} onClick={() => onOpen(it.id)}>
                {it.title}
              </TableLink>
            ),
            who: `${it.counterparty} · ${it.party}`,
            state: it.warning ? { value: `⚠ ${it.warning}${it.state ? ` · ${it.state}` : ""}`, tone: "worse" as const } : it.state || "—",
          }))}
        />
      ) : (
        <span className="nr-muted">Nothing open.</span>
      )}
    </Card>
  );
}

function AlbumPageRow({ page }: { page: BoardAlbumPage }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)" }}>
        <strong>
          {page.name} <span className="nr-muted">({page.set})</span>
        </strong>
        <span>
          {page.have}/{page.of}
          {page.complete ? " ✓" : ""}
        </span>
      </div>
      <Bar have={page.have} of={page.of} complete={page.complete} />
      {page.missing.length > 0 ? (
        <span className="nr-muted">
          Missing:{" "}
          {page.missing
            .map((m) => `${m.ref} ${m.name}${m.rarity && m.rarity !== "common" ? ` [${m.rarity}]` : ""} — ${m.value !== null ? `value ${fmt(m.value, 1)}` : "value ?"}${m.book !== null ? ` · book ${m.book}` : ""}`)
            .join(" · ")}
        </span>
      ) : null}
    </div>
  );
}

function Album({ board }: { board: Board }) {
  const album = board.album;
  return (
    <Card title={album ? `Album ${album.filled ?? "?"}/${album.slots ?? "?"}` : "Album"}>
      {album && album.pages.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {album.pages.map((p) => (
            <AlbumPageRow key={p.set} page={p} />
          ))}
        </div>
      ) : (
        <span className="nr-muted">{NOT_LOGGED}</span>
      )}
    </Card>
  );
}

function ScoreMovers({ board, onOpen }: { board: Board; onOpen: (id: string) => void }) {
  const rows = scoreMovers(board);
  return (
    <Card title="What moved the score">
      {rows.length > 0 ? (
        <DataTable
          columns={[
            { key: "tick", label: "Tick", numeric: true },
            { key: "deal", label: "Deal" },
            { key: "price", label: "Price", numeric: true },
            { key: "value", label: "Our value", numeric: true },
            { key: "delta", label: "Δ score", numeric: true },
          ]}
          rows={rows.map((r) => ({
            tick: show(r.tick_settled, "?"),
            deal: (
              <TableLink aria-label={`Open ${r.id}`} onClick={() => onOpen(r.id)}>
                {`${KIND_LABEL[r.kind] ?? r.kind} · ${r.item} · ${partyOf(board, r).label}`}
              </TableLink>
            ),
            price: show(r.price, "—"),
            value: show(r.our_value, "—"),
            delta: toned(r.d_score),
          }))}
        />
      ) : (
        <span className="nr-muted">No deal has moved the score yet.</span>
      )}
    </Card>
  );
}

function useNow(periodMs = 5_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), periodMs);
    return () => clearInterval(id);
  }, [periodMs]);
  return now;
}

function Agents({ board }: { board: Board }) {
  const lines = agentLines(board, useNow());
  return (
    <Card title="Our agents">
      {lines.length > 0 ? (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          {lines.map((l) => (
            <li key={l.agent}>
              <span style={{ color: l.health === "running" ? "var(--ok)" : "var(--warn)" }}>{l.health === "running" ? "●" : "○"}</span> <strong>{l.agent}</strong> <span className="nr-muted">{l.health} · {l.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <span className="nr-muted">{NOT_LOGGED}</span>
      )}
    </Card>
  );
}

function History({ board, rows, title, filters, onFiltersChange }: { board: Board; rows: BoardRow[]; title: string; filters: BoardFilters; onFiltersChange: (f: BoardFilters) => void }) {
  const shown = filterBoardRows(rows, filters);
  const select = (id: string) => onFiltersChange({ ...filters, row: id });
  return (
    <Fold title={`${title} (${rows.length})`}>
      <FiltersBar rows={rows} filters={filters} onChange={onFiltersChange} />
      {shown.length > 0 ? <ConversationList board={board} rows={shown} selectedId={filters.row} onSelect={select} /> : <span className="nr-muted">Nothing matches these filters.</span>}
    </Fold>
  );
}

/**
 * Panel lateral fijo para la conversación abierta: se lee sin perder el sitio en la página.
 * Se cierra con el botón, con Escape o pulsando fuera.
 */
function Drawer({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <div aria-hidden="true" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.25)", zIndex: 40 }} />
      <aside
        role="dialog"
        aria-label={label}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(860px, 100vw)",
          overflowY: "auto",
          background: "var(--bg)",
          borderLeft: "1px solid var(--line)",
          boxShadow: "-8px 0 24px rgba(0, 0, 0, 0.15)",
          padding: "var(--space-4)",
          zIndex: 41,
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <SecondaryButton onClick={onClose} aria-label="Close conversation">
            Close ✕
          </SecondaryButton>
        </div>
        {children}
      </aside>
    </>
  );
}

/**
 * Cabina del Bazaar: arriba lo que hay que decidir (marcador, próximas citas, lo abierto ahora),
 * luego álbum, qué movió la cifra y si nuestros agentes están vivos; el historial y el mercado,
 * plegados. Todo sale de `/api/bazaar/board`; la UI no calcula la cifra.
 */
export function BazaarScreen({ board, filters, onFiltersChange }: BazaarScreenProps) {
  const selected = board.rows.find((r) => r.id === filters.row) ?? null;
  const open = (id: string) => onFiltersChange({ ...filters, row: id });
  const { trades, duels } = historyGroups(board.rows);
  const duelPoints = board.header?.duel_points;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <PageTitle>Bazaar</PageTitle>
      {!board.live ? <EmptyStateCard title="No live Bazaar data (BAZAAR_KEY not set on the viewer server, or the Bazaar is unreachable)" /> : null}
      <div className="nr-grid" style={gridCols("minmax(0, 1fr) minmax(0, 1fr)")}>
        <Scoreboard board={board} />
        <Upcoming board={board} />
      </div>
      <RightNow board={board} onOpen={open} />
      <div className="nr-grid" style={gridCols("minmax(0, 3fr) minmax(260px, 2fr)")}>
        <Album board={board} />
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", minWidth: 0 }}>
          <ScoreMovers board={board} onOpen={open} />
          <Agents board={board} />
        </div>
      </div>
      <History board={board} rows={trades} title="History · dealers and El Rastro" filters={filters} onFiltersChange={onFiltersChange} />
      <History board={board} rows={duels} title={`History · duels${duelPoints === 0 ? " (practice: 0 duel points so far)" : ""}`} filters={filters} onFiltersChange={onFiltersChange} />
      <Fold title="Market · leaderboard, feed, El Rastro, our venue">
        <MarketPanel board={board} />
      </Fold>
      {selected ? (
        <Drawer label={`Conversation ${selected.id}`} onClose={() => onFiltersChange({ ...filters, row: "" })}>
          <ConversationDetail board={board} row={selected} />
        </Drawer>
      ) : null}
    </section>
  );
}
