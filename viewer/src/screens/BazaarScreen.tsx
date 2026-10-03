import { Card, ChatMessage, DataTable, Flag, Legend, OfferChart, Tabs } from "@negotiation-ring/design-system";
import { useEffect, useId, useState, type ReactNode } from "react";
import { gridCols } from "../ui/grid.js";
import { PageTitle } from "../ui/page-title.js";
import { Workshop } from "./Workshop.js";
import { TeamDesk } from "./TeamDesk.js";
import { VenueBooks } from "./venues/VenueBooks.js";
import { AlbumCards } from "./album/AlbumCards.js";
import { ComponentChip, ScoreTree } from "./ScoreTree.js";
import { componentOf } from "../model/scoreTree.js";
import type { ModelLadderLevel } from "../model/gameModel.js";
import { SecondaryButton, TableLink } from "../ui/buttons.js";
import { EmptyStateCard } from "../ui/states.js";
import { Fold } from "../ui/fold.js";
import { useNow } from "../ui/use-now.js";
import {
  ALL,
  boardFilterOptions,
  boardTimeline,
  filterBoardRows,
  KIND_LABEL,
  SCOPE_LABEL,
  outcomeOf,
  pointsLabel,
  statusLabel,
  type Board,
  type BazaarModel,
  type BoardFilters,
  type BoardScope,
  type BoardRow,
  type BoardRowKind,
  agentLines,
  bookMakerLabel,
  curveRoundLines,
  historyGroups,
  liveItems,
  mentionsUs,
  offerCurve,
  PARTY_LABEL,
  ourOfferIds,
  partyOf,
  scheduleLines,
  scoreMovers,
  standingOf,
  teamLabel,
  withTeamNames,
  type OfferCurve,
} from "../model/index.js";
import { useBazaarModel } from "../bazaarModelLive.js";
import { boardRowIdFor, modelConversationFor, modelCurve, withPlannedPath, type GameModel, type ModelConversation } from "../model/gameModel.js";
import { predictionCaption, predictionLines, withPrediction, type PredictionOverlay } from "../model/dealerFit.js";
import { currentPrediction, isWelcome, sideLabel } from "../model/personaModel.js";
import { ConversationModelPanel, ModelView } from "./ModelView.js";
import { DealerFitStrip } from "./DealerFitStrip.js";
import { NowView } from "./now/NowView.js";

export interface BazaarScreenProps {
  board: Board;
  /** Local snapshots from `score.jsonl` (history of the figure and what moved it). */
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

function FiltersBar({ board, rows, filters, onChange }: { board: Board; rows: BoardRow[]; filters: BoardFilters; onChange: (f: BoardFilters) => void }) {
  const opts = boardFilterOptions(rows);
  const sortId = useId();
  const set = (patch: Partial<BoardFilters>) => onChange({ ...filters, ...patch });
  const withOthers = rows.some((r) => r.kind === "other-trade");
  return (
    <div className="nr-filters" role="group" aria-label="Conversation filters">
      {withOthers ? (
        <SelectField
          label="Whose"
          value={filters.scope}
          options={["ours", "others"]}
          onChange={(scope) => set({ scope: scope as BoardScope })}
          format={(s) => SCOPE_LABEL[s as BoardScope] ?? s}
        />
      ) : null}
      <SelectField label="Kind" value={filters.kind} options={opts.kind} onChange={(kind) => set({ kind })} format={(k) => KIND_LABEL[k as BoardRowKind] ?? k} />
      <SelectField label="Counterparty" value={filters.counterparty} options={opts.counterparty} onChange={(counterparty) => set({ counterparty })} format={(c) => withTeamNames(board, c)} />
      <SelectField label="Status" value={filters.status} options={opts.status} onChange={(status) => set({ status })} />
      {opts.side.length ? <SelectField label="Side" value={filters.side} options={opts.side} onChange={(side) => set({ side })} format={(s) => (s === "buy" ? "we buy" : "we sell")} /> : null}
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

/** Why a row has no chat: book fills and public offers never carry text in the API. */
function emptyChatNote(row: BoardRow): string {
  if (row.kind === "other-trade") return `Trade between other parties${row.tick_settled !== null ? ` at tick ${row.tick_settled}` : ""}: only the public settlement is visible (no chat, no offers, no private values).`;
  if (row.id.startsWith("settlement:")) return `Order-book fill${row.tick_settled !== null ? ` at tick ${row.tick_settled}` : ""}: the other team took a public offer, so there is no chat. Only direct team threads carry messages.`;
  if (row.kind === "team-offer") return "Public offer on the book: no chat until someone takes it.";
  return "No messages for this entry.";
}

function ConversationList({ board, rows, selectedId, onSelect, ladder }: { board: Board; rows: BoardRow[]; selectedId: string; onSelect: (id: string) => void; ladder?: ModelLadderLevel[] }) {
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
        { key: "feeds", label: "Feeds" },
        { key: "score", label: "Points (Δ on its tick)", numeric: true },
        { key: "ticks", label: "Ticks" },
      ]}
      rows={rows.map((r) => ({
        counterparty: (
          <TableLink aria-pressed={r.id === selectedId} aria-label={`Open conversation with ${r.counterparty} (${r.id})`} onClick={() => onSelect(r.id)}>
            {partyOf(board, r).label}
          </TableLink>
        ),
        party: PARTY_LABEL[partyOf(board, r).kind],
        kind: KIND_LABEL[r.kind] ?? r.kind,
        item: r.item,
        status: statusLabel(r),
        price: show(r.price, "—"),
        value: r.our_value === null ? (r.value_source === NOT_LOGGED ? NOT_LOGGED : "—") : `${r.our_value}${r.value_source ? ` (${r.value_source})` : ""}`,
        surplus: r.surplus === null ? "—" : toned(r.surplus),
        // Per-deal Δ from score-audit.jsonl; a dealer deal scores through the ladder, never neg_points.
        feeds: (() => {
          const c = componentOf(r, board, ladder);
          return (
            <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
              <ComponentChip comp={c.comp} note={c.note} />
              {c.note && c.comp === "ladder" && c.note.startsWith("L") ? <span className="nr-muted" style={{ fontSize: 11 }}>{c.note}</span> : null}
            </span>
          );
        })(),
        score: pointsLabel(r) ?? (outcomeOf(r) !== "deal" ? "—" : r.d_score !== null ? toned(r.d_score) : "not audited"),
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

/** Full conversation: verbatim messages (never interpreted) aligned by tick with our
 * decisions (`decisions.jsonl`), and the offers timeline. */
function ConversationDetail({ board, row, conv, model }: { board: Board; row: BoardRow; conv: ModelConversation | null; model: GameModel | null }) {
  const steps = boardTimeline(row);
  const party = partyOf(board, row);
  const maker = (m: string) => (m === board.team ? { value: teamLabel(board, m), tone: "better" as const } : withTeamNames(board, m));
  return (
    <Card title={`Conversation · ${party.label} (${party.kind}) · ${KIND_LABEL[row.kind] ?? row.kind}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
          {(() => {
            const c = componentOf(row, board, model?.ladder);
            return (
              <>
                <ComponentChip comp={c.comp} note={c.note} />
                {c.note ? <span className="nr-muted">{c.note}</span> : null}
              </>
            );
          })()}
          {(() => {
            const pts = pointsLabel(row);
            if (pts) return <Flag kind={pts.tone === "worse" ? "walk" : "decision"}>{`Points ${pts.value}`}</Flag>;
            if (row.d_score !== null && row.d_score !== 0) return <Flag kind={row.d_score < 0 ? "walk" : "decision"}>{`Δ score ${row.d_score > 0 ? "+" : ""}${row.d_score}`}</Flag>;
            return outcomeOf(row) === "deal" ? <span className="nr-muted">Points: not audited</span> : null;
          })()}
          <span>{row.item}</span>
          <span className="nr-muted">
            {statusLabel(row)} · price {show(row.price, "—")} · our value {show(row.our_value)}
            {row.value_source ? ` (${row.value_source})` : ""} · margin vs our value {show(row.surplus, "—")}
            {row.duel_result !== null ? ` · duel result ${row.duel_result}` : ""}
          </span>
        </div>
        {conv ? <ConversationModelPanel conv={conv} model={model} /> : null}
        <NegotiationCurve row={row} conv={conv} model={model} />
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
          <span className="nr-muted">{emptyChatNote(row)}</span>
        )}
        <div className="nr-grid" style={gridCols("minmax(0, 2fr) minmax(220px, 1fr)")}>
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
          ) : (
            <span />
          )}
          <DealerFitStrip model={model} conv={conv} />
        </div>
      </div>
    </Card>
  );
}

/** Negotiation curve: our offers, theirs, our limit per tick, our value, the end and, if
 * the model has it, the predicted path (dashed) over the following ticks. */
function NegotiationCurve({ row, conv, model }: { row: BoardRow; conv: ModelConversation | null; model: GameModel | null }) {
  const base = offerCurve(row);
  if (!base) return conv ? <ModelCurve conv={conv} model={model} /> : null;
  const withPlan = withPlannedPath(base, conv);
  const { planned } = withPlan;
  const pred = currentPrediction(model, conv);
  const herXs = withPlan.curve.theirs.slice(0, conv?.history.herPrices.length ?? withPlan.curve.theirs.length).map((p) => p.round);
  const fitted = pred ? withPrediction(withPlan.curve, pred, herXs, planned.map((p) => p.value), (x) => `tick ${withPlan.curve.firstTick + x - 1}`) : null;
  const curve = fitted?.curve ?? withPlan.curve;
  const overlay = fitted?.overlay ?? null;
  const tickOf = (round: number) => (round === 0 ? "" : String(curve.firstTick + round - 1));
  return (
    <figure aria-label="Negotiation curve" style={{ margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <OfferChart
        rounds={curve.rounds}
        yDomain={curve.yDomain}
        yTicks={curve.yTicks}
        xLabel="tick"
        xTickLabel={tickOf}
        describeRound={(round) => withPredictionLines(overlay, plannedLines(curve, planned, curveRoundLines(curve, row.counterparty, round), round), round, `tick ${curve.firstTick + round - 1}`)}
        ourOffers={curve.ours}
        theirOffers={curve.theirs}
        {...(planned.length > 0 ? { planned } : {})}
        {...predictionProps(overlay)}
        {...(curve.limit.length > 0 ? { target: curve.limit } : {})}
        {...(curve.reference ? { ourReserve: curve.reference.value } : {})}
        {...(curve.end ? { end: curve.end } : {})}
      />
      <Legend
        items={[
          { kind: "us", label: "Team 2 (us)" },
          { kind: "them", label: row.counterparty },
          ...(curve.limit.length > 0 ? [{ kind: "target" as const, label: "our limit (reservation) by tick" }] : []),
          ...(planned.length > 0 ? [{ kind: "planned" as const, label: "planned path (our model, next ticks)" }] : []),
          ...predictionLegend(overlay),
          ...(curve.reference ? [{ kind: "reserve-us" as const, label: curve.reference.label }] : []),
          ...(curve.end ? [{ kind: "end" as const, label: curve.end.label }] : []),
        ]}
      />
      {pred ? <span className="nr-muted">{`${predictionCaption(pred)} · today's model`}{conv && isWelcome(model, conv) ? " · welcome: counts only towards her limit, not the curve" : ""}</span> : null}
      {curve.capped ? (
        <span className="nr-muted">
          Our limit dropped from {curve.capped.from} to {curve.capped.to} during the turns. The agent lowers it when our cash or the spending budget runs short, or reprices it when the dealer reveals which card it is; the log does not say which.
        </span>
      ) : null}
    </figure>
  );
}

/** Chart props with the dealer's prediction (its path with band, its limit, the walk-away); nothing if absent. */
function predictionProps(o: PredictionOverlay | null) {
  if (!o) return {};
  return { predicted: o.predicted, theirLimit: o.theirLimit, ...(o.walkMarker ? { walkMarker: o.walkMarker } : {}) };
}

function predictionLegend(o: PredictionOverlay | null) {
  if (!o) return [];
  return [
    { kind: "predicted" as const, label: "her predicted path (lo–hi)" },
    { kind: "their-limit" as const, label: "her estimated limit (lo–hi)" },
    ...(o.walkMarker ? [{ kind: "walk-marker" as const, label: "predicted walk round" }] : []),
  ];
}

/** Adds to the cursor box what is predicted for the dealer at that round. */
function withPredictionLines(o: PredictionOverlay | null, lines: string[] | null, round: number, head: string): string[] | null {
  const extra = o ? predictionLines(o, round) : [];
  if (extra.length === 0) return lines;
  return [...(lines ?? [head]), ...extra];
}

/** Cursor box with the predicted step, if it falls on that round. */
function plannedLines(curve: OfferCurve, planned: { round: number; value: number }[], lines: string[] | null, round: number): string[] | null {
  const p = planned.find((x, k) => k > 0 && x.round === round) ?? (planned.length === 1 ? planned.find((x) => x.round === round) : undefined);
  if (!p) return lines;
  return [...(lines ?? [`tick ${curve.firstTick + round - 1}`]), `planned ${p.value}`];
}

/** Model-only curve (duel or conversation without prices recorded on the board): X axis = step. */
function ModelCurve({ conv, model }: { conv: ModelConversation; model: GameModel | null }) {
  const out = modelCurve(conv);
  if (!out) return null;
  const { planned } = out;
  const pred = currentPrediction(model, conv);
  const fitted = pred ? withPrediction(out.curve, pred, out.curve.theirs.map((p) => p.round), planned.map((p) => p.value), (x) => `step ${x}`) : null;
  const curve = fitted?.curve ?? out.curve;
  const overlay = fitted?.overlay ?? null;
  return (
    <figure aria-label="Negotiation curve (our model)" style={{ margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <OfferChart
        rounds={curve.rounds}
        yDomain={curve.yDomain}
        yTicks={curve.yTicks}
        xLabel="step"
        ourOffers={curve.ours}
        theirOffers={curve.theirs}
        {...(planned.length > 0 ? { planned } : {})}
        {...predictionProps(overlay)}
        {...(overlay ? { describeRound: (round: number) => withPredictionLines(overlay, null, round, `step ${round}`) } : {})}
        {...(curve.reference ? { ourReserve: curve.reference.value } : {})}
      />
      <Legend
        items={[
          { kind: "us", label: "Team 2 (us)" },
          { kind: "them", label: conv.counterparty },
          ...(planned.length > 0 ? [{ kind: "planned" as const, label: "planned path (our model)" }] : []),
          ...predictionLegend(overlay),
          ...(curve.reference ? [{ kind: "reserve-us" as const, label: `${curve.reference.label} (private, local only)` }] : []),
        ]}
      />
      {pred ? <span className="nr-muted">{`${predictionCaption(pred)} · today's model`}{conv && isWelcome(model, conv) ? " · welcome: counts only towards her limit, not the curve" : ""}</span> : null}
    </figure>
  );
}

/** Drawer for a conversation that is only in the model (no board row). */
function ModelOnlyDetail({ conv, model }: { conv: ModelConversation; model: GameModel | null }) {
  return (
    <Card title={`Conversation · ${conv.counterparty} (${conv.kind}) · ${sideLabel(conv)} · ${conv.id}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <ConversationModelPanel conv={conv} model={model} />
        <ModelCurve conv={conv} model={model} />
        <DealerFitStrip model={model} conv={conv} />
        <span className="nr-muted">
          ours [{conv.history.ourPrices.join(", ")}] · theirs [{conv.history.herPrices.join(", ")}]
          {conv.history.herCurrent ? ` · their current ${conv.history.herCurrent.price}${conv.history.herCurrent.final ? " (final)" : ""}` : ""}
        </span>
      </div>
    </Card>
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
              { key: "neg", label: "Negotiation", numeric: true },
              { key: "market", label: "Market", numeric: true },
              { key: "level", label: "Level", numeric: true },
              { key: "album", label: "Album" },
              { key: "deals", label: "Deals", numeric: true },
            ]}
            rows={market.leaderboard.map((t) => ({
              rank: show(t.rank, "?"),
              team: t.us ? { value: `${t.name} (us)`, tone: "better" as const } : t.name,
              score: show(t.score, "?"),
              neg: show(t.negotiating, "—"),
              market: show(t.market, "—"),
              level: show(t.level, "—"),
              album: t.album_filled != null ? `${t.album_filled}/${show(t.album_slots, "?")}${t.pages_complete ? ` ★ ${t.pages_complete}` : ""}` : "—",
              deals: show(t.deals, "—"),
            }))}
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
          <span style={{ fontSize: 20, fontWeight: 700 }}>
            {fmt(h?.cash, 0)} P <span className="nr-muted" style={{ fontSize: 13, fontWeight: 500 }}>{`cash · level ${fmt(h?.level, 0)}`}</span>
          </span>
        </div>
        <span className="nr-muted">
          {st.ahead ? `${fmt(st.gapToAhead)} behind ${st.ahead.name} (next place)` : st.rank === 1 ? "We lead" : ""}
          {st.leader && st.leader.name !== st.ahead?.name ? ` · ${fmt(st.gapToLeader)} behind the leader ${st.leader.name}` : ""}
        </span>
        <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <ScoreTree board={board} />
        </div>
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
            who: `${it.counterparty} · ${PARTY_LABEL[it.party]}`,
            state: it.warning ? { value: `⚠ ${it.warning}${it.state ? ` · ${it.state}` : ""}`, tone: "worse" as const } : it.state || "—",
          }))}
          onRowClick={(i) => {
            const it = items[i];
            if (it) onOpen(it.id);
          }}
        />
      ) : (
        <span className="nr-muted">Nothing open.</span>
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
          onRowClick={(i) => {
            const r = rows[i];
            if (r) onOpen(r.id);
          }}
        />
      ) : (
        <span className="nr-muted">No deal has moved the score yet.</span>
      )}
    </Card>
  );
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

function History({ board, rows, title, filters, onFiltersChange, ladder }: { board: Board; rows: BoardRow[]; title: string; filters: BoardFilters; onFiltersChange: (f: BoardFilters) => void; ladder?: ModelLadderLevel[] }) {
  // "Whose" only applies where other teams' trades are listed (duels are always ours).
  const shown = filterBoardRows(rows, rows.some((r) => r.kind === "other-trade") ? filters : { ...filters, scope: "all" });
  const select = (id: string) => onFiltersChange({ ...filters, row: id });
  return (
    <Fold title={`${title} (${rows.length})`}>
      <FiltersBar board={board} rows={rows} filters={filters} onChange={onFiltersChange} />
      {shown.length > 0 ? <ConversationList board={board} rows={shown} selectedId={filters.row} onSelect={select} {...(ladder ? { ladder } : {})} /> : <span className="nr-muted">Nothing matches these filters.</span>}
    </Fold>
  );
}

/**
 * Fixed side panel for the open conversation: readable without losing your place on the page.
 * Closes with the button, with Escape or by clicking outside.
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

type View = "now" | "cockpit" | "model" | "venues";

const VIEWS: { id: View; label: string }[] = [
  { id: "now", label: "Now" },
  { id: "cockpit", label: "Cockpit (the API)" },
  { id: "model", label: "Model (our internal view)" },
  { id: "venues", label: "Venues (all books)" },
];

/**
 * Bazaar cockpit: on top what must be decided (scoreboard, upcoming appointments, what is open now),
 * then album, what moved the figure and whether our agents are alive; history and market
 * collapsed. Everything comes from `/api/bazaar/board`; the UI does not compute the figure.
 */
export function BazaarScreen({ board, filters, onFiltersChange }: BazaarScreenProps) {
  const [view, setView] = useState<View>("now");
  const pick = (id: string) => setView(VIEWS.find((v) => v.id === id)?.id ?? "now");
  const { model, loading } = useBazaarModel(view !== "cockpit" || filters.row !== "");
  const selected = board.rows.find((r) => r.id === filters.row) ?? board.rows.find((r) => r.id === boardRowIdFor(filters.row)) ?? board.others.find((r) => r.id === filters.row) ?? null;
  const conv = filters.row ? modelConversationFor(model, selected?.id ?? filters.row) ?? modelConversationFor(model, filters.row) : null;
  const open = (id: string) => onFiltersChange({ ...filters, row: id });
  /** From the model: the board row if it exists; otherwise the model conversation. */
  const openModel = (id: string) => open(board.rows.some((r) => r.id === boardRowIdFor(id)) ? boardRowIdFor(id) : id);
  const { trades, duels } = historyGroups(board.rows);
  const duelPoints = board.header?.duel_points;
  const close = () => onFiltersChange({ ...filters, row: "" });
  const drawer = selected ? (
    <Drawer label={`Conversation ${selected.id}`} onClose={close}>
      <ConversationDetail board={board} row={selected} conv={conv} model={model} />
    </Drawer>
  ) : conv ? (
    <Drawer label={`Conversation ${conv.id}`} onClose={close}>
      <ModelOnlyDetail conv={conv} model={model} />
    </Drawer>
  ) : null;
  if (view !== "cockpit") {
    return (
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <PageTitle>Bazaar</PageTitle>
        <Tabs aria-label="Bazaar views" items={VIEWS} selectedId={view} onSelect={pick} />
        {view === "now" ? (
          <NowView board={board} model={model} onOpen={openModel} />
        ) : view === "venues" ? (
          <VenueBooks board={board} />
        ) : (
          <ModelView model={model} loading={loading} board={board} onOpen={openModel} />
        )}
        {drawer}
      </section>
    );
  }
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <PageTitle>Bazaar</PageTitle>
      <Tabs aria-label="Bazaar views" items={VIEWS} selectedId={view} onSelect={pick} />
      {!board.live ? <EmptyStateCard title="No live Bazaar data (BAZAAR_KEY not set on the viewer server, or the Bazaar is unreachable)" /> : null}
      <div className="nr-grid" style={gridCols("minmax(0, 1fr) minmax(0, 1fr)")}>
        <Scoreboard board={board} />
        <Upcoming board={board} />
      </div>
      <RightNow board={board} onOpen={open} />
      <TeamDesk board={board} />
      <div className="nr-grid" style={gridCols("minmax(0, 3fr) minmax(260px, 2fr)")}>
        <AlbumCards board={board} />
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", minWidth: 0 }}>
          <ScoreMovers board={board} onOpen={open} />
          <Agents board={board} />
          <Workshop board={board} />
        </div>
      </div>
      <History board={board} rows={[...trades, ...board.others]} title="History · dealers and El Rastro (all teams)" filters={filters} onFiltersChange={onFiltersChange} {...(model?.ladder ? { ladder: model.ladder } : {})} />
      <History board={board} rows={duels} title={`History · duels${duelPoints === 0 ? " (practice: 0 duel points so far)" : ""}`} filters={filters} onFiltersChange={onFiltersChange} {...(model?.ladder ? { ladder: model.ladder } : {})} />
      <Fold title="Market · leaderboard, feed, El Rastro, our venue">
        <MarketPanel board={board} />
      </Fold>
      {drawer}
    </section>
  );
}
