import { Card, ChatMessage, DataTable, Flag, Legend, OfferChart, Tabs } from "@negotiation-ring/design-system";
import { useEffect, useId, useState, type ReactNode } from "react";
import { gridCols } from "../ui/grid.js";
import { Workshop } from "./Workshop.js";
import { TeamDesk } from "./TeamDesk.js";
import { VenueBooks } from "./venues/VenueBooks.js";
import { Forex } from "./forex/Forex.js";
import { MarketTest } from "./market-test/MarketTest.js";
import { CardsView } from "./album/CardsView.js";
import { NewsView } from "./news/NewsView.js";
import { TeamName } from "./teams/TeamLink.js";
import { NavCtx, TickLink, type Nav } from "./nav/Links.js";
import { TickPanel } from "./nav/TickPanel.js";
import { GoalsView } from "./goals/GoalsView.js";
import { TeamsView } from "./teams/TeamsView.js";
import { EggsView } from "./profile/EggsView.js";
import { PersonasView } from "./profile/PersonasView.js";
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
  duelSessionName,
  duelEarlierAccept,
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
  originOf,
  partyOf,
  scheduleLines,
  scoreMovers,
  standingOf,
  teamLabel,
  withTeamNames,
  type OfferCurve,
} from "../model/index.js";
import { useBazaarModel } from "../bazaarModelLive.js";
import { boardRowIdFor, modelConversationFor, modelCurve, personasOf, withPlannedPath, type GameModel, type ModelConversation } from "../model/gameModel.js";
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
  const duels = rows.some((r) => r.duel);
  return (
    <DataTable
      columns={[
        ...(duels ? [{ key: "duel", label: "Duel" }] : []),
        { key: "counterparty", label: "With" },
        { key: "party", label: "Who they are" },
        { key: "kind", label: "Kind" },
        { key: "item", label: "Item" },
        { key: "status", label: "Status" },
        { key: "price", label: "Price", numeric: true },
        { key: "value", label: "Our value", numeric: true },
        ...(duels ? [{ key: "result", label: "Game result (captured)", numeric: true }, { key: "eff", label: "Efficiency (captured ÷ our limit)", numeric: true }] : []),
        { key: "surplus", label: duels ? "Price vs limit" : "Margin vs our value", numeric: true },
        // Duels only feed duel points: the column says nothing there.
        ...(duels ? [] : [{ key: "feeds", label: "Feeds" }]),
        { key: "score", label: "Points (Δ on its tick)", numeric: true },
        { key: "ticks", label: "Ticks" },
      ]}
      rows={rows.map((r) => ({
        duel: r.duel ? `#${r.duel.no}` : "—",
        result: r.duel_result === null ? "—" : toned(r.duel_result),
        eff: duelEfficiency([r]) === null ? "—" : `${duelEfficiency([r])}%`,
        counterparty: (
          <TableLink aria-pressed={r.id === selectedId} aria-label={`Open conversation with ${r.counterparty} (${r.id})`} onClick={() => onSelect(r.id)}>
            {partyOf(board, r).label}
          </TableLink>
        ),
        party: PARTY_LABEL[partyOf(board, r).kind],
        kind: KIND_LABEL[r.kind] ?? r.kind,
        item: r.item,
        status: <span style={{ color: STATUS_TONE[outcomeOf(r)], fontWeight: 600 }}>{statusLabel(r)}</span>,
        price: r.duel?.days != null && r.price !== null ? `${r.price} · day ${r.duel.days}` : show(r.price, "—"),
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
            {row.value_source ? ` (${row.value_source})` : ""} · {row.duel ? "price vs limit" : "margin vs our value"} {show(row.surplus, "—")}
            {row.duel_result !== null ? ` · game result (captured) ${row.duel_result}` : ""}
          </span>
          {row.duel ? (
            <span className="nr-muted" style={{ flexBasis: "100%" }}>
              {`Duel #${row.duel.no} · ${duelSessionName(row.duel.session)} · issues: ${row.duel.issues.join(" + ") || "price"}${row.duel.days !== null ? ` · delivery day ${row.duel.days}` : ""}${row.duel.decay !== null ? ` · decay ${Math.round(row.duel.decay * 100)} %/round` : ""} · deadline t${row.duel.deadline ?? "?"}. The game scores the result (captured); «price vs limit» counts the price only (no delivery days, no decay), so the two differ.`}
            </span>
          ) : null}
          {(() => {
            const e = duelEarlierAccept(row);
            return e ? (
              <span style={{ flexBasis: "100%", color: "var(--warn)" }}>
                {`Deal at ${e.price}: the rival accepted our earlier offer of ${e.price} (t${e.tick ?? "?"}); our later ${e.later} (t${e.laterTick ?? "?"}) did not count.`}
              </span>
            ) : null;
          })()}
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
              rows={row.offers.map((o) => ({ tick: <TickLink tick={o.tick} prefix="" />, maker: maker(o.maker), give: o.give, want: o.want, final: o.final ? "final" : "", status: o.status }))}
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
        <Grants board={board} />
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

/** Organiser grants today (cash the whole field receives): labelled so a cash jump never reads as a trade or an error. */
function Grants({ board }: { board: Board }) {
  const all = board.grants ?? [];
  // Recorder day folders are UTC dates (bazaar-board.ts `today()`).
  const today = new Date().toISOString().slice(0, 10);
  const todays = all.filter((g) => g.day === today && (g.cash || g.packs.length || g.cards.length));
  if (!todays.length) return null;
  const tick = board.clock?.tick ?? null;
  const cash = todays.reduce((s, g) => s + g.cash, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span>
        <strong style={{ color: "var(--ok)" }}>{`+${cash} P from grants today`}</strong>
        <span className="nr-muted">{" (organisers, to every team: not a trade, not an error)"}</span>
      </span>
      {todays.map((g, i) => {
        const fresh = tick !== null && g.tick !== null && tick - g.tick <= 30;
        return (
          <span key={i} className={fresh ? undefined : "nr-muted"} style={{ fontSize: 12, fontWeight: fresh ? 700 : 400 }}>
            {fresh ? "NEW · " : ""}
            <TickLink tick={g.tick} />
            {` · ${[...(g.cash ? [`+${g.cash} P`] : []), ...g.packs.map((x) => `pack ${x}`), ...g.cards].join(" + ")}${g.actor ? ` · ${g.actor}` : ""}${g.reason ? ` · ${g.reason}` : ""}`}
          </span>
        );
      })}
    </div>
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
            { key: "origin", label: "Posted by" },
            { key: "state", label: "State" },
          ]}
          rows={items.map((it) => ({
            origin: (() => {
              const o = originOf(board, it.id);
              if (!o) return it.kind === "offer" ? <span className="nr-muted">—</span> : "";
              return (
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }} title={o.history}>
                  <strong style={{ fontSize: 12 }}>{o.route}</strong>
                  <span className="nr-muted" style={{ fontSize: 12 }}>{o.history}</span>
                  {o.tail ? <span style={{ fontSize: 12 }}>{o.tail}</span> : null}
                </span>
              );
            })(),
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
            tick: <TickLink tick={r.tick_settled} prefix="" />,
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

/**
 * Duel efficiency in relative terms: what we captured over what the duels were worth to us (Σ game result ÷ Σ our
 * limit, in %). A no-deal counts its limit with 0 captured, so walking away lowers it; in-progress duels are left out.
 */
/** Status colour by outcome: deal green, no deal red, still open in our colour. */
const STATUS_TONE: Record<string, string> = { deal: "var(--ok)", "no deal": "var(--bad)", open: "var(--us)" };

/**
 * Where the duel waves stand: duels open right now, or that every wave so far is closed and when the next one starts
 * (from the schedule; its local time is estimated from the one event the schedule gives a wall time for).
 */
function DuelWaves({ board, rows }: { board: Board; rows: BoardRow[] }) {
  const live = rows.filter((r) => outcomeOf(r) === "open");
  const sched = board.schedule;
  const next = sched?.upcoming.find((u) => u.action === "duels") ?? null;
  const anchor = sched?.upcoming.find((u) => u.wall) ?? null;
  let when = "";
  if (next && sched?.now_hours != null) {
    const left = next.at_hours - sched.now_hours;
    // Real ms per game hour, from now to the anchored event.
    const rate = anchor && anchor.at_hours > sched.now_hours ? (Date.parse(anchor.wall!) - Date.now()) / (anchor.at_hours - sched.now_hours) : null;
    const at = rate ? new Date(Date.now() + left * rate) : null;
    const mins = rate ? Math.round((left * rate) / 60000) : null;
    when = ` at h${next.at_hours}${at ? ` (≈ ${at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} your time, in ~${mins! >= 60 ? `${Math.floor(mins! / 60)} h ${mins! % 60} min` : `${mins} min`})` : ` (in ${Math.round(left * 10) / 10} game h)`}`;
  }
  const sessions = [...new Set(live.map((r) => duelSessionName(r.duel?.session)))].join(", ");
  return (
    <div className="nr-card" style={{ padding: "var(--space-3)", borderLeft: `4px solid ${live.length ? "var(--us)" : "var(--ok)"}` }}>
      {live.length ? (
        <strong style={{ color: "var(--us)" }}>{`● ${live.length} duel${live.length === 1 ? "" : "s"} in progress (${sessions})`}</strong>
      ) : (
        <strong style={{ color: "var(--ok)" }}>✓ No duel open: every wave so far is closed</strong>
      )}
      <span className="nr-muted">{next ? ` · next wave: ${next.note}${when}` : " · no more duel waves on the schedule"}</span>
    </div>
  );
}

function duelEfficiency(rows: BoardRow[]): number | null {
  const closed = rows.filter((r) => outcomeOf(r) !== "open" && r.our_value);
  const limit = closed.reduce((s, r) => s + (r.our_value ?? 0), 0);
  if (!limit) return null;
  const captured = closed.reduce((s, r) => s + (outcomeOf(r) === "deal" ? (r.duel_result ?? 0) : 0), 0);
  return Math.round((1000 * captured) / limit) / 10;
}

function History({ board, rows, title, filters, onFiltersChange, ladder, open = false }: { board: Board; rows: BoardRow[]; title: string; filters: BoardFilters; onFiltersChange: (f: BoardFilters) => void; ladder?: ModelLadderLevel[]; open?: boolean }) {
  // "Whose" only applies where other teams' trades are listed (duels are always ours).
  const shown = filterBoardRows(rows, rows.some((r) => r.kind === "other-trade") ? filters : { ...filters, scope: "all" });
  const select = (id: string) => onFiltersChange({ ...filters, row: id });
  return (
    <Fold title={`${title} (${rows.length})`} open={open}>
      <FiltersBar board={board} rows={rows} filters={filters} onChange={onFiltersChange} />
      {shown.length === 0 ? (
        <span className="nr-muted">Nothing matches these filters.</span>
      ) : shown.some((r) => r.duel) ? (
        // Duels grouped by session (practice, Duels I, II, III, Grand Final), newest session first.
        [...new Set(shown.map((r) => r.duel?.session ?? null))]
          .sort((a, b) => (b ?? -1) - (a ?? -1))
          .map((session, i) => {
            const group = shown.filter((r) => (r.duel?.session ?? null) === session);
            const deals = group.filter((r) => outcomeOf(r) === "deal");
            const captured = Math.round(deals.reduce((s, r) => s + (r.duel_result ?? 0), 0) * 10) / 10;
            const done = group.filter((r) => outcomeOf(r) !== "open");
            const eff = duelEfficiency(done);
            const rel = done.length ? ` · efficiency ${eff ?? "—"}% · ${Math.round((captured / done.length) * 10) / 10}/duel · ${Math.round((100 * deals.length) / done.length)}% deals` : "";
            // In-progress duels get their own table on top, so they never hide among the closed ones.
            const live = group.filter((r) => outcomeOf(r) === "open");
            const closed = group.filter((r) => outcomeOf(r) !== "open");
            const list = (rs: BoardRow[]) => <ConversationList board={board} rows={rs} selectedId={filters.row} onSelect={select} {...(ladder ? { ladder } : {})} />;
            return (
              <Fold key={String(session)} open={i === 0 || live.length > 0} title={`${duelSessionName(session)} · ${group.length} duels · ${live.length ? `● ${live.length} in progress` : "✓ all closed"} · ${deals.length} deals · captured ${captured}${rel}`}>
                {live.length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    <strong style={{ color: "var(--us)" }}>{`● In progress · ${live.length}`}</strong>
                    {list(live)}
                    <strong className="nr-muted">{`Closed · ${closed.length}`}</strong>
                    {closed.length ? list(closed) : <span className="nr-muted">None yet.</span>}
                  </div>
                ) : (
                  list(group)
                )}
              </Fold>
            );
          })
      ) : (
        <ConversationList board={board} rows={shown} selectedId={filters.row} onSelect={select} {...(ladder ? { ladder } : {})} />
      )}
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

type View = "now" | "cockpit" | "cards" | "model" | "venues" | "forex" | "market-test" | "eggs" | "personas" | "news" | "teams" | "goals" | "duels";

/** Tab label (what it is) and hint (what it answers), shown under the tabs for the selected view. */
const VIEWS: { id: View; label: string; hint: string }[] = [
  { id: "now", label: "⏱️ Now", hint: "What the coordinator picked this tick, live conversations, our open offers and what changed since the last tick." },
  { id: "cockpit", label: "🎛️ Cockpit", hint: "Straight from the Bazaar API: scoreboard, upcoming events, right now, team desk, what moved the score, agents alive, and the full history of trades and duels." },
  { id: "cards", label: "🃏 Cards", hint: "Our album page by page (held or missing, copies in circulation, API value vs ours, shinies), then the price sheet of every card: market, our value, next copy and edges." },
  { id: "model", label: "🧠 Model", hint: "Our internal view: the three score layers, timeline, coordinator, goals, markets, venues and packs." },
  { id: "venues", label: "🏪 Venues", hint: "Every open venue's asks and bids side by side, each offer marked against our hand and values. Nothing here sends." },
  { id: "forex", label: "🔁 Forex", hint: "A → B → C chains: buy a card at one place, hold it, sell it at another, net of fees." },
  { id: "market-test", label: "🧪 Market test", hint: "Our bench sessions in auto (v04) against board (v26, our broker matching): efficiency per session and the book tick by tick." },
  { id: "eggs", label: "🥚 Eggs", hint: "Easter eggs per dealer (our probes, finds and prizes), gifts we received, flags we sent and the dealers' hint lines." },
  { id: "news", label: "📻 News", hint: "Radio Rastro, the Bulletin and the notice board: which dealer, set or card is being talked about, with a summary. Unverified, may be rumour, never a figure." },
  { id: "duels", label: "⚔️ Duels", hint: "Every 1-on-1 duel by session (practice, I, II, III, Grand Final): rival, item, price vs our limit, result and the duel points each one brought." },
  { id: "goals", label: "🎯 Goals", hint: "What we aim at and how: gaps and conflicts, goals by priority, open proposals (pros, cons, recommendation) and every strategy by goal. From the goals session; shown only." },
  { id: "teams", label: "👥 Teams", hint: "Every team in one place: score parts, what we did with it, its trades with others, eggs it found and its collection. Click any team name in the viewer to land here." },
  { id: "personas", label: "🧑‍🎤 Dealers", hint: "Every dealer persona we model and our estimates of each dealer (structure only)." },
];

/**
 * Bazaar cockpit: on top what must be decided (scoreboard, upcoming appointments, what is open now),
 * then album, what moved the figure and whether our agents are alive; history and market
 * collapsed. Everything comes from `/api/bazaar/board`; the UI does not compute the figure.
 */
function ViewHint({ view }: { view: View }) {
  return (
    <p className="nr-muted" style={{ margin: "calc(-1 * var(--space-2)) 0 0", fontSize: 13 }}>
      {VIEWS.find((v) => v.id === view)?.hint}
    </p>
  );
}

export function BazaarScreen({ board, filters, onFiltersChange }: BazaarScreenProps) {
  const [view, setView] = useState<View>("now");
  const [team, setTeam] = useState("");
  const openTeam = (t: string) => {
    setTeam(t);
    setView("teams");
  };
  const [tick, setTick] = useState<number | null>(null);
  const [dealer, setDealer] = useState("");
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
  const dealers = new Map<string, string>([
    ...(board.eggs?.personas ?? []).map((p): [string, string] => [p.persona, p.persona_name ?? p.persona]),
    ...(model?.available ? personasOf(model).map((p): [string, string] => [p.id, p.name]) : []),
  ]);
  const nav: Nav = {
    tick: (t) => {
      close();
      setTick(t);
    },
    team: (t) => {
      setTick(null);
      close();
      openTeam(t);
    },
    dealer: (id) => {
      setTick(null);
      close();
      setDealer(id);
      setView("personas");
    },
    dealers,
  };
  const drawer = selected ? (
    <Drawer label={`Conversation ${selected.id}`} onClose={close}>
      <ConversationDetail board={board} row={selected} conv={conv} model={model} />
    </Drawer>
  ) : conv ? (
    <Drawer label={`Conversation ${conv.id}`} onClose={close}>
      <ModelOnlyDetail conv={conv} model={model} />
    </Drawer>
  ) : tick !== null ? (
    <Drawer label={`Tick ${tick}`} onClose={() => setTick(null)}>
      <TickPanel
        board={board}
        tick={tick}
        onTick={setTick}
        onOpen={(id) => {
          setTick(null);
          openModel(id);
        }}
      />
    </Drawer>
  ) : null;
  if (view !== "cockpit") {
    return (
      <NavCtx.Provider value={nav}>
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <Tabs aria-label="Bazaar views" items={VIEWS} selectedId={view} onSelect={pick} />
        <ViewHint view={view} />
        {view === "now" ? (
          <NowView board={board} model={model} onOpen={openModel} />
        ) : view === "cards" ? (
          <CardsView board={board} model={model} loading={loading} />
        ) : view === "venues" ? (
          <VenueBooks board={board} />
        ) : view === "forex" ? (
          <Forex board={board} onOpen={openModel} />
        ) : view === "market-test" ? (
          <MarketTest board={board} />
        ) : view === "eggs" ? (
          <EggsView board={board} model={model} loading={loading} onOpenThread={(t) => openModel(`dealer:${t}`)} />
        ) : view === "duels" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <DuelWaves board={board} rows={duels} />
          <History open board={board} rows={duels} title={`Duels${duelPoints === 0 ? " (practice: 0 duel points so far)" : ""}`} filters={filters} onFiltersChange={onFiltersChange} {...(model?.ladder ? { ladder: model.ladder } : {})} />
          </div>
        ) : view === "goals" ? (
          <GoalsView model={model} loading={loading} />
        ) : view === "teams" ? (
          <TeamsView board={board} model={model} team={team} onPick={setTeam} onOpen={openModel} />
        ) : view === "news" ? (
          <NewsView model={model} loading={loading} />
        ) : view === "personas" ? (
          <PersonasView model={model} loading={loading} picked={dealer} onPick={setDealer} />
        ) : (
          <ModelView model={model} loading={loading} board={board} onOpen={openModel} />
        )}
        {drawer}
      </section>
      </NavCtx.Provider>
    );
  }
  return (
    <NavCtx.Provider value={nav}>
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <Tabs aria-label="Bazaar views" items={VIEWS} selectedId={view} onSelect={pick} />
      <ViewHint view={view} />
      {!board.live ? <EmptyStateCard title="No live Bazaar data (BAZAAR_KEY not set on the viewer server, or the Bazaar is unreachable)" /> : null}
      <div className="nr-grid" style={gridCols("minmax(0, 1fr) minmax(0, 1fr)")}>
        <Scoreboard board={board} />
        <Upcoming board={board} />
      </div>
      <RightNow board={board} onOpen={open} />
      <TeamDesk board={board} />
      <div className="nr-grid" style={gridCols("minmax(0, 3fr) minmax(260px, 2fr)")}>
        <ScoreMovers board={board} onOpen={open} />
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", minWidth: 0 }}>
          <Agents board={board} />
          <Workshop board={board} strategy={model?.workshop ?? null} />
        </div>
      </div>
      <History board={board} rows={[...trades, ...board.others]} title="History · dealers and El Rastro (all teams)" filters={filters} onFiltersChange={onFiltersChange} {...(model?.ladder ? { ladder: model.ladder } : {})} />
      <Fold title="Market · leaderboard, feed, El Rastro, our venue">
        <MarketPanel board={board} />
      </Fold>
      {drawer}
    </section>
    </NavCtx.Provider>
  );
}
