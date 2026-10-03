import { Card, DataTable, Flag, KpiStrip, Pill } from "@negotiation-ring/design-system";
import { Eggs } from "./profile/Eggs.js";
import { useId, useState, type ReactNode } from "react";
import { gridCols } from "../ui/grid.js";
import { TableLink } from "../ui/buttons.js";
import { EmptyStateCard } from "../ui/states.js";
import { Meter } from "../ui/meter.js";
import { DealerEstimates } from "./DealerEstimates.js";
import { Rivals } from "./Rivals.js";
import { NewsSignals } from "./NewsSignals.js";
import { PersonaStrategy } from "./DealerFitStrip.js";
import { herWalkText, sideLabel } from "../model/personaModel.js";
import { RARITY_COLOR, teamLabel, type Board } from "../model/index.js";
import {
  arr,
  assetLabel,
  decisionLabel,
  filterHints,
  filterPrices,
  groupHints,
  packsOf,
  venuesOf,
  priceRows,
  flagsOf,
  hintsOf,
  nowHours,
  personasOf,
  rec,
  roundOf,
  sortedConversations,
  textOf,
  timelineEvents,
  timeSummary,
  triggerLines,
  type GameModel,
  type MechanismDecisionView,
  type HintFilters,
  type PriceFilters,
  type PriceSort,
  type ModelConversation,
  type TimelineEvent,
} from "../model/gameModel.js";

/**
 * «Model» view: what our agent thinks at this tick, not a mirror of the API. Follows the three-layer
 * diagram of the spec (environment → state → decision), then timeline, coordinator, goals, personas and
 * hints, conversations, markets, and eggs and flags. Everything comes from `/api/bazaar/model` (dry-run, GET only).
 * Dealer text (hints) is rendered as plain text only.
 */

const col = { display: "flex", flexDirection: "column", gap: "var(--space-2)" } as const;
const row = { display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" } as const;
const list = { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-1)" } as const;

const fmt = (v: unknown, digits = 1): string => (typeof v === "number" && Number.isFinite(v) ? String(Math.round(v * 10 ** digits) / 10 ** digits) : "—");
const yesNo = (v: boolean | undefined) => (v === undefined ? "—" : v ? "yes" : "no");

function Muted({ children }: { children: ReactNode }) {
  return <span className="nr-muted">{children}</span>;
}

// ---------------------------------------------------------------- 1. environment → state → decision

function ThreeLayers({ model, board }: { model: GameModel; board: Board }) {
  const s = model.state;
  const b = model.budget;
  const active = (s?.conversations ?? []).filter((c) => c.phase !== "done");
  return (
    <div className="nr-grid" style={gridCols("minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)")}>
      <Card title="1 · Environment (GET only)">
        <div style={col}>
          <Muted>What we read this tick; a failed read lands in `missing` and the state stays usable.</Muted>
          <ul style={list} aria-label="Inputs read this tick">
            {model.inputs.ok.map((n) => (
              <li key={n}>
                <span style={{ color: "var(--ok)" }}>✓</span> {n}
              </li>
            ))}
            {model.inputs.missing.map((m) => (
              <li key={m}>
                <span style={{ color: "var(--warn)" }}>✗</span> {m}
              </li>
            ))}
            {!model.inputs.ok.includes("leaderboard") && !model.inputs.missing.some((m) => m.startsWith("leaderboard")) ? <li className="nr-muted">· leaderboard: read every 5 ticks</li> : null}
          </ul>
          <Muted>
            built {model.built_at ? new Date(model.built_at).toLocaleTimeString("en-GB") : "?"} · tick {model.tick ?? "?"} · next refresh in {Math.round(model.next_refresh_ms / 1000)} s
          </Muted>
        </div>
      </Card>
      <Card title="2 · State (GameState)">
        {s ? (
          <div style={col}>
            <span>
              <strong style={{ color: "var(--us)" }}>{board.team ? teamLabel(board, board.team) : `${s.ours.name ?? s.ours.team ?? "Team"} (us)`}</strong> · cash {fmt(s.ours.cash, 0)} P · level {s.ours.level ?? "?"}
            </span>
            <span>
              album {s.ours.album.filled ?? "?"}/{s.ours.album.slots ?? "?"} · {s.ours.holdings.cards} cards, {s.ours.holdings.spares} spares, {s.ours.holdings.packs} packs
            </span>
            <span>
              unlocked: {s.ours.unlocked.join(", ") || "—"}
              {s.ours.cooloffs.length ? ` · cooloff ${s.ours.cooloffs.map((c) => `${c.dealer} until ${c.untilTick}`).join(", ")}` : ""}
            </span>
            <span>
              conversations: {active.length} active, {s.conversations.length - active.length} done · El Rastro {s.env.rastro.offers} offers ({s.env.rastro.ours} ours)
            </span>
            <span>
              our venue: {s.ours.venue ? `${s.ours.venue.id ?? "?"} · ${s.ours.venue.mechanism ?? "?"} · ${s.ours.venue.status ?? "?"}` : "none"}
            </span>
          </div>
        ) : (
          <Muted>no state</Muted>
        )}
      </Card>
      <Card title="3 · Decision (budget from clock.limits)">
        {b ? (
          <div style={col}>
            <Meter label="accepts this tick (team)" used={(model.routes.flatMap((r) => r.intents).filter((i) => i.kind === "accept" && i.selected).length)} of={b.accepts} />
            <Meter label="open threads" used={b.openThreadsNow} of={b.maxOpenThreads} />
            <Meter label="listings this tick" used={model.routes.flatMap((r) => r.intents).filter((i) => i.kind === "listing" && i.selected).length} of={b.offersPerTick} />
            <Meter label="open offers" used={b.openOffersNow} of={b.maxOpenOffers} />
            <span>messages per conversation per tick: {b.messagesPerConversation}</span>
            {b.missing.length ? <span style={{ color: "var(--warn)" }}>missing in clock.limits (used as 0): {b.missing.join(", ")}</span> : null}
            <Flag kind="fallback">{b.assumption}</Flag>
          </div>
        ) : (
          <Muted>no budget</Muted>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- timeline

const EVENT_COLOR: Record<string, string> = { duels: "var(--warn)", bench: "var(--us)", round: "var(--ok)", grant_all: "var(--ok)", set_release: "var(--them)", day_closes: "var(--muted)", day_opens: "var(--muted)", finale: "var(--warn)", freeze: "var(--warn)" };

function Timeline({ model }: { model: GameModel }) {
  const events = timelineEvents(model);
  const now = nowHours(model);
  const W = 1000;
  const H = 170;
  const L = 30;
  const R = 20;
  const axisY = 70;
  const x = (h: number) => L + (Math.max(0, Math.min(24, h)) / 24) * (W - L - R);
  const rounds = [...model.goals.round_weights].sort((a, b) => a.at_hours - b.at_hours);
  const closes = events.filter((e) => e.action === "day_closes");
  const labeled = events.filter((e) => e.action !== "bench" && e.action !== "day_opens" && e.action !== "day_closes");
  const closed = model.state?.clock.paused || (model.state?.clock.doors !== undefined && model.state.clock.doors !== "open");
  const triggers = triggerLines(model);
  const upcoming = events.filter((e) => now === null || e.at >= now - 1e-9).slice(0, 14);
  return (
    <Card title="Timeline · game hours 0–24">
      <div style={col}>
        <strong>{timeSummary(model)}</strong>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Game-hour timeline with rounds, days, events and now" style={{ width: "100%", height: "auto" }}>
          {rounds.map((r, k) => {
            const end = rounds[k + 1]?.at_hours ?? 24;
            return (
              <g key={r.round}>
                <rect x={x(r.at_hours)} y={axisY - 22} width={x(end) - x(r.at_hours)} height={22} fill={k % 2 ? "var(--us-soft)" : "var(--them-soft)"} />
                <text x={x(r.at_hours) + 4} y={axisY - 7} fontSize={11} fill="var(--ink)">{`R${r.round} ×${r.weight} · ${r.name}`}</text>
              </g>
            );
          })}
          <line x1={x(0)} x2={x(24)} y1={axisY} y2={axisY} stroke="var(--line)" strokeWidth={2} />
          {Array.from({ length: 25 }, (_, h) => (
            <g key={h}>
              <line x1={x(h)} x2={x(h)} y1={axisY} y2={axisY + (h % 2 ? 3 : 6)} stroke="var(--muted)" />
              {h % 2 === 0 ? (
                <text x={x(h)} y={axisY + 18} fontSize={10} textAnchor="middle" fill="var(--muted)">
                  {h}
                </text>
              ) : null}
            </g>
          ))}
          {closes.map((e, k) => (
            <g key={`c-${k}`}>
              <rect x={x(e.at) - 3} y={axisY - 26} width={6} height={30} fill="var(--muted)" opacity={0.6} />
              <text x={x(e.at)} y={axisY - 28} fontSize={9} textAnchor="middle" fill="var(--muted)">
                closed
              </text>
            </g>
          ))}
          {events
            .filter((e) => e.action === "bench")
            .map((e, k) => (
              <circle key={`b-${k}`} cx={x(e.at)} cy={axisY} r={3.5} fill={EVENT_COLOR.bench} />
            ))}
          {labeled.map((e, k) => {
            const y = axisY + 32 + (k % 4) * 14;
            const color = EVENT_COLOR[e.action] ?? "var(--ink)";
            return (
              <g key={`e-${k}`}>
                {e.lead > 0 ? <line x1={x(e.at - e.lead)} x2={x(e.at)} y1={axisY + 4} y2={axisY + 4} stroke={color} strokeWidth={3} opacity={0.5} /> : null}
                <line x1={x(e.at)} x2={x(e.at)} y1={axisY} y2={y - 9} stroke={color} strokeDasharray="2 2" />
                <text x={x(e.at)} y={y} fontSize={10} textAnchor="middle" fill={color}>
                  {e.label}
                </text>
              </g>
            );
          })}
          {now !== null ? (
            <g>
              <line x1={x(now)} x2={x(now)} y1={10} y2={axisY + 8} stroke={closed ? "var(--muted)" : "var(--ok)"} strokeWidth={2.5} />
              <text x={x(now)} y={9} fontSize={11} fontWeight={700} textAnchor="middle" fill={closed ? "var(--muted)" : "var(--ok)"}>
                {`now h ${fmt(now, 2)}${closed ? " (closed)" : ""}`}
              </text>
            </g>
          ) : null}
        </svg>
        <Muted>Dots: Market Test bench sessions. Thick segment before an event: our lead time. Grey bars: doors close (game time stops until the next day opens).</Muted>
        {upcoming.length > 0 ? (
          <DataTable
            columns={[
              { key: "at", label: "Game h", numeric: true },
              { key: "wall", label: "Wall (Madrid)" },
              { key: "count", label: "Countdown" },
              { key: "event", label: "Event" },
              { key: "planned", label: "Our planned action" },
              { key: "lead", label: "Lead", numeric: true },
            ]}
            rows={upcoming.map((e: TimelineEvent) => ({ at: fmt(e.at, 2), wall: e.wall ?? "—", count: e.countdown ?? "—", event: e.note ? `${e.label} — ${e.note}` : e.label, planned: e.planned, lead: e.lead > 0 ? `${fmt(e.lead, 2)} h` : "—" }))}
          />
        ) : (
          <Muted>No upcoming events.</Muted>
        )}
        <strong>Recent triggers</strong>
        {triggers.length > 0 ? (
          <ul style={list} aria-label="Recent triggers">
            {triggers.map((t, k) => (
              <li key={k}>
                <Muted>{`tick ${t.tick ?? "?"} · ${t.type}`}</Muted> {t.text}
              </li>
            ))}
          </ul>
        ) : (
          <Muted>No trigger fired recently (levels, limit changes, eggs, strikes, cooloffs).</Muted>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- 2. coordinador

function Coordinator({ model }: { model: GameModel }) {
  const intents = model.routes.flatMap((r) => r.intents.map((i) => ({ ...i, label: r.label })));
  return (
    <div className="nr-grid" style={gridCols("minmax(0, 3fr) minmax(260px, 1fr)")}>
      <Card title={`Coordinator · tick ${model.tick ?? "?"} (viewer replica in dry-run: it sends nothing, whatever mode bazaar:play runs in)`}>
        <div style={col}>
          {intents.length > 0 ? (
            <DataTable
              columns={[
                { key: "verdict", label: "Verdict" },
                { key: "route", label: "Route" },
                { key: "kind", label: "Kind" },
                { key: "summary", label: "Intent (figure decided by code)" },
                { key: "ev", label: "EV", numeric: true },
                { key: "reason", label: "Why" },
              ]}
              rows={intents.map((i) => ({
                verdict: <Pill kind={i.selected ? "verdict" : "rejected"}>{i.selected ? "SELECTED" : "DROPPED"}</Pill>,
                route: i.label,
                kind: `${i.kind}${i.acceptClass ? ` · ${i.acceptClass}` : ""}`,
                summary: i.summary,
                ev: fmt(i.ev),
                reason: i.reason,
              }))}
            />
          ) : (
            <Muted>No route proposes anything this tick.</Muted>
          )}
          <ul style={list} aria-label="Routes">
            {model.routes.map((r) => (
              <li key={r.route}>
                <strong>{r.label}</strong> <Muted>{r.status === "ok" ? `${r.intents.length} intent(s)` : r.status}</Muted>
                {r.error ? <span style={{ color: "var(--warn)" }}> · {r.error}</span> : null}
                {r.notes.map((n, k) => (
                  <div key={k} className="nr-muted" style={{ paddingLeft: "var(--space-4)", overflowWrap: "anywhere" }}>
                    {n}
                  </div>
                ))}
              </li>
            ))}
          </ul>
          <Muted>
            Safety: {model.safety.note} · write attempts blocked: <strong style={{ color: model.safety.blocked ? "var(--warn)" : "var(--ok)" }}>{model.safety.blocked}</strong>
          </Muted>
        </div>
      </Card>
      <Card title="ACCEPT_PRIORITY (one accept per tick)">
        <DataTable
          columns={[
            { key: "rank", label: "Rank", numeric: true },
            { key: "cls", label: "Class" },
            { key: "why", label: "Why" },
          ]}
          rows={model.accept_priority.map((p) => ({ rank: p.rank, cls: p.cls, why: p.why }))}
        />
        <Muted>Same rank: higher expected value first. An asset is in one place only (asset locks across routes).</Muted>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- 3. objetivos

function Goals({ model, board }: { model: GameModel; board: Board }) {
  const s = rec(model.state?.ours.score);
  const g = model.goals;
  const lb = model.state?.env.leaderboard;
  return (
    <Card title="Goals">
      <div style={col}>
        <KpiStrip
          items={[
            { label: "score", value: fmt(s.score, 2) },
            { label: "negotiating (30)", value: fmt(s.negotiating, 2) },
            { label: "market (30)", value: fmt(s.market, 2) },
            { label: "judges (40)", value: "not in API" },
            { label: "rank", value: s.rank !== undefined ? `#${String(s.rank)}` : lb?.ourRank !== undefined ? `#${lb.ourRank}` : "—" },
          ]}
        />
        <Muted>
          ladder {fmt(s.ladder_points, 3)} · neg points {fmt(s.neg_points)} · duel points {fmt(s.duel_points)} · market-making {fmt(s.mm_points)} · bench {fmt(s.bench_points)} · deals {fmt(s.deals, 0)} · pages ★ {fmt(s.pages_complete, 0)}
        </Muted>
        <Muted>{g.judges}</Muted>
        <div className="nr-grid" style={gridCols("minmax(0, 1fr) minmax(0, 1fr)")}>
          <div style={col}>
            <strong>Round weights (score relative to the leader)</strong>
            <ul style={list}>
              {g.round_weights.map((r) => (
                <li key={r.round}>
                  R{r.round} ×{r.weight} · {r.name} <Muted>from h {fmt(r.at_hours, 2)}</Muted>
                </li>
              ))}
            </ul>
            <strong>Priority levers</strong>
            <ul style={list}>
              {g.levers.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
          <div style={col}>
            <strong>Targets and caps (bazaar:play defaults)</strong>
            <span>page targets: {g.page_targets.join(", ")}</span>
            <span>cash floor: {g.cash_floor} P</span>
            <span>
              dealer spending: ≤ {g.max_spend_hour} P/hour · ≤ {g.max_spend_total} P total
            </span>
            {lb ? (
              <>
                <strong>Leaderboard{lb.tick !== undefined ? ` (tick ${lb.tick})` : ""}</strong>
                <ul style={list}>
                  {lb.top.map((t) => (
                    <li key={t.team}>
                      #{t.rank ?? "?"} {t.team === board.team ? <strong style={{ color: "var(--us)" }}>{teamLabel(board, t.team)}</strong> : (t.name ?? t.team)} {fmt(t.score, 2)}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- 4. personas and hints

function SelectBox({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="nr-filter-field">
      <label className="nr-muted nr-filter-label" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="nr-filter-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Hints({ model }: { model: GameModel }) {
  const all = hintsOf(model);
  const [f, setF] = useState<HintFilters>({ candidatesOnly: true, classification: "", persona: "", q: "" });
  const searchId = useId();
  const candId = useId();
  const personas = [...new Set(all.map((h) => h.persona))].sort();
  const classes = [...new Set(all.map((h) => h.classification).filter((c): c is string => c !== null))].sort();
  const shown = groupHints(filterHints(all, f));
  const counts = personas.map((p) => `${p} ${all.filter((h) => h.persona === p).length}`);
  return (
    <Card title={`Hints corpus (${all.length})`}>
      <div style={col}>
        <Muted>
          Dealer text kept only as an egg hint, never a figure. Lines that differ only in numbers are grouped (×N). {counts.length ? counts.join(" · ") : ""}
        </Muted>
        <div className="nr-filters" role="group" aria-label="Hint filters">
          <div className="nr-filter-field">
            <label className="nr-muted nr-filter-label" htmlFor={candId}>
              Candidates only
            </label>
            <input id={candId} type="checkbox" checked={f.candidatesOnly} onChange={(e) => setF({ ...f, candidatesOnly: e.target.checked })} />
          </div>
          <SelectBox label="Classification" value={f.classification} onChange={(classification) => setF({ ...f, classification })} options={[{ value: "", label: "All" }, { value: "none", label: "unclassified" }, ...classes.map((c) => ({ value: c, label: c }))]} />
          <SelectBox label="Persona" value={f.persona} onChange={(persona) => setF({ ...f, persona })} options={[{ value: "", label: "All" }, ...personas.map((p) => ({ value: p, label: p }))]} />
          <div className="nr-filter-field">
            <label className="nr-muted nr-filter-label" htmlFor={searchId}>
              Search
            </label>
            <input id={searchId} className="nr-filter-select" type="search" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="text or reason" />
          </div>
        </div>
        {shown.length > 0 ? (
          <ul style={list} aria-label="Hints, latest first">
            {shown.slice(0, 100).map((h) => (
              <li key={h.key} style={{ ...row, flexWrap: "nowrap", borderTop: "1px solid var(--line)", paddingTop: "var(--space-1)" }}>
                <strong style={{ flex: "none" }}>{h.persona}</strong>
                <Muted>{`${h.count > 1 ? `×${h.count} · ` : ""}${h.lastTick !== null ? `t${h.lastTick}` : ""}`}</Muted>
                {h.classification ? <Flag kind="decision">{h.classification}</Flag> : null}
                <span title={[h.text, ...h.reasons].join("\n")} style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {h.text}
                </span>
              </li>
            ))}
            {shown.length > 100 ? <Muted>{`…and ${shown.length - 100} more (narrow with the filters)`}</Muted> : null}
          </ul>
        ) : (
          <Muted>{all.length ? "Nothing matches these filters." : "No hints recorded yet (hints.jsonl not there or empty)."}</Muted>
        )}
      </div>
    </Card>
  );
}

function Personas({ model }: { model: GameModel }) {
  const personas = personasOf(model);
  return (
    <Card title={`Personas (${personas.length})`}>
      {personas.length > 0 ? (
        <div style={col}>
          <DataTable
            columns={[
              { key: "who", label: "Persona" },
              { key: "type", label: "Type" },
              { key: "status", label: "Status" },
              { key: "traits", label: "Traits" },
              { key: "unlock", label: "Unlock" },
              { key: "hints", label: "Hints", numeric: true },
              { key: "probes", label: "Egg probes" },
              { key: "eggs", label: "Eggs found by others" },
            ]}
            rows={personas.map((p) => ({
              who: `${p.name}${p.name !== p.id ? ` (${p.id})` : ""}${p.level !== null ? ` · L${p.level}` : ""}`,
              type: p.type,
              status: p.status === "unlocked-for-us" ? { value: p.status, tone: "better" as const } : p.status === "closed" ? { value: p.status, tone: "worse" as const } : p.status,
              traits: Object.entries(p.traits).map(([k, v]) => `${k} ${fmt(v, 2)}`).join(" · ") || "—",
              unlock: p.unlock,
              hints: p.hints,
              probes: p.eggProbes.length ? p.eggProbes.map(textOf).join("; ") : "—",
              eggs: `${p.eggsByOthers.length ? p.eggsByOthers.map(textOf).join("; ") : "none"}${p.eggsLeft ? ` · ${p.eggsLeft} left` : ""}`,
            }))}
          />
          {personas.some((p) => p.teaser) ? (
            <ul style={list}>
              {personas
                .filter((p) => p.teaser)
                .map((p) => (
                  <li key={p.id} className="nr-muted">
                    {p.name}: {p.teaser}
                  </li>
                ))}
            </ul>
          ) : null}
          <Muted>Source: {personas[0]?.source}</Muted>
        </div>
      ) : (
        <Muted>No personas yet.</Muted>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------- model conversations

function RarityDot({ rarity }: { rarity: string | undefined }) {
  if (!rarity) return null;
  return <span aria-hidden="true" style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", marginRight: 6, background: RARITY_COLOR[rarity] ?? "var(--muted)" }} />;
}

function ConversationsTable({ convs, onOpen }: { convs: ModelConversation[]; onOpen: (id: string) => void }) {
  return (
    <DataTable
      columns={[
        { key: "id", label: "Conversation" },
        { key: "with", label: "With" },
        { key: "asset", label: "Asset" },
        { key: "goal", label: "Goal" },
        { key: "phase", label: "Phase" },
        { key: "round", label: "Round", numeric: true },
        { key: "turn", label: "Msg / accept" },
        { key: "last", label: "Last decision" },
        { key: "next", label: "Next if they hold", numeric: true },
      ]}
      rows={convs.map((c) => ({
        id: (
          <TableLink aria-label={`Open ${c.id}`} onClick={() => onOpen(c.id)}>
            {c.id}
          </TableLink>
        ),
        with: `${c.counterparty} · ${c.kind}`,
        asset: (
          <span>
            <RarityDot rarity={c.asset.rarity} />
            {`${sideLabel(c)} ${assetLabel(c)}`}
          </span>
        ),
        goal: `${c.goal.why}${c.goal.expectedValue !== undefined ? ` · EV ${fmt(c.goal.expectedValue)}` : ""}`,
        phase: c.result ? `${c.phase} · ${c.result.outcome ?? ""}${c.result.price !== undefined ? ` @ ${c.result.price}` : ""}` : c.phase,
        round: roundOf(c),
        turn: c.phase === "done" ? "—" : `${yesNo(c.turn.canMessage)} / ${yesNo(c.turn.canAccept)}`,
        last: decisionLabel(c.strategy.lastDecision),
        next: c.strategy.next.priceIfTheyHold ?? "—",
      }))}
    />
  );
}

/** Text or «—» if empty or «-». */
const dash = (s: string | undefined): string => (s && s.trim() !== "" && s.trim() !== "-" ? s : "—");

/** State and strategy of a conversation (side drawer). Private: local only. */
export function ConversationModelPanel({ conv, model = null }: { conv: ModelConversation; model?: GameModel | null }) {
  const herWalk = herWalkText(model, conv);
  const p = conv.strategy.plan;
  const d = conv.strategy.lastDecision;
  const hints = arr(conv.hints);
  return (
    <div className="nr-grid" style={gridCols("minmax(0, 1fr) minmax(0, 1fr)")}>
      <Card title="State (our model)">
        <div style={col}>
          <span>
            phase <strong>{conv.phase}</strong> · {sideLabel(conv)} · round {roundOf(conv)} of the {conv.kind === "duel" ? "duel rounds" : "patience budget"}
            {herWalk !== null ? ` · her walk ≈ round ${herWalk} (estimated, today)` : ""}
            {conv.patience?.probeCostNow !== undefined ? ` · probe cost now ${conv.patience.probeCostNow}` : ""}
          </span>
          <span>
            mood: kindness {conv.mood.kindness ?? "—"} · warnings {conv.mood.warnings} · strikes {conv.mood.strikes}
            {conv.mood.cooloffUntil !== undefined ? ` · cooloff until ${conv.mood.cooloffUntil}` : ""}
          </span>
          <span>
            this tick: can message {yesNo(conv.turn.canMessage)} · can accept {yesNo(conv.turn.canAccept)}
          </span>
          <span>
            goal {conv.goal.why}
            {conv.goal.expectedValue !== undefined ? ` · expected value ${fmt(conv.goal.expectedValue)}` : ""}
            {conv.herConcession !== undefined ? ` · their concession ${fmt(conv.herConcession)}` : ""}
          </span>
          <span className="nr-muted">
            private (local only): {[conv.limits.duelLimit !== undefined ? `duel limit ${conv.limits.duelLimit}` : null, conv.limits.reservation !== undefined ? `reservation ${conv.limits.reservation}` : null, conv.limits.privateValue !== undefined ? `our value ${conv.limits.privateValue}` : null].filter(Boolean).join(" · ") || "—"}
          </span>
          {conv.flagCandidate !== undefined && conv.flagCandidate !== null ? <Flag kind="injection">{`flag candidate: ${textOf(conv.flagCandidate)}`}</Flag> : null}
          {hints.length > 0 ? (
            <div style={col}>
              <strong>Hints heard</strong>
              <ul style={list}>
                {hints.map((h, k) => (
                  <li key={k} style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    {textOf(h)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Card>
      <Card title="Strategy (computed by code)">
        <div style={col}>
          {conv.phase === "done" && !d ? (
            <span className="nr-muted">closed: no live plan (plan, path, walk and next only on open conversations)</span>
          ) : (
            <>
              <span>
                plan: anchor {p.anchor ?? "—"} · step {p.stepSize ?? "—"}
                {p.acceptThreshold !== undefined ? ` · accept from ${p.acceptThreshold}` : ""}
              </span>
              <span>path: {p.plannedPath.length ? p.plannedPath.join(" → ") : "—"}</span>
              {p.daysPlan ? <span>days: {p.daysPlan}</span> : null}
              <span className="nr-muted">walk: {dash(p.walkCondition)}</span>
              <span>
                last decision: <strong>{decisionLabel(d)}</strong>
                {d ? <Muted>{` · ${d.reason} (tick ${d.tick})`}</Muted> : null}
              </span>
              <span>
                next: {conv.strategy.next.priceIfTheyHold !== undefined ? `${conv.strategy.next.priceIfTheyHold} if they hold · ` : ""}
                <Muted>{dash(conv.strategy.next.walkWhen)}</Muted>
              </span>
            </>
          )}
          <PersonaStrategy model={model} conv={conv} />
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- mercados

function Markets({ model, onOpen }: { model: GameModel; onOpen: (id: string) => void }) {
  const rastro = (model.state?.conversations ?? []).filter((c) => c.kind === "rastro" || c.kind === "market");
  const venue = model.state?.ours.venue;
  const benches = model.schedule.events.filter((e) => e.action === "bench");
  const now = nowHours(model);
  const s = rec(model.state?.ours.score);
  const trades = model.routes.find((r) => r.route === "trades");
  return (
    <div className="nr-grid" style={gridCols("minmax(0, 3fr) minmax(260px, 2fr)")}>
      <Card title={`Markets · our offers in El Rastro (${rastro.length})`}>
        <div style={col}>
          <Muted>We are clients here (scores in Negotiating): buy SAL-09 ≤ 130 P, sell duplicates above their value.</Muted>
          {rastro.length > 0 ? <ConversationsTable convs={rastro} onOpen={onOpen} /> : <Muted>No open offers of ours.</Muted>}
          {trades?.notes.map((n, k) => (
            <Muted key={k}>{n}</Muted>
          ))}
        </div>
      </Card>
      <Card title="Our venue (Market-making)">
        <div style={col}>
          {venue ? (
            <span>
              {venue.name ?? venue.id ?? "?"} · mechanism <strong>{venue.mechanism ?? "?"}</strong> · {venue.status ?? "?"}
            </span>
          ) : (
            <Muted>No venue of ours.</Muted>
          )}
          <VenueDecision decision={model.state?.venue?.mechanismDecision} />
          <span>
            bench points {fmt(s.bench_points)} · efficiency {fmt(s.bench_efficiency, 2)} · market-making {fmt(s.mm_points)}
          </span>
          <strong>Market Test sessions</strong>
          <ul style={list}>
            {benches.slice(0, 8).map((b, k) => (
              <li key={k}>
                h {fmt(b.at_hours, 2)}
                {now !== null ? <Muted>{b.at_hours >= now ? ` · in ${fmt(b.at_hours - now, 2)} h` : " · past"}</Muted> : null} · {b.note ?? "bench"}
                {typeof b.params.traders === "number" ? <Muted>{` · ${b.params.traders} traders, ${String(b.params.ticks ?? "?")} ticks`}</Muted> : null}
              </li>
            ))}
            {benches.length === 0 ? <li className="nr-muted">none scheduled</li> : null}
          </ul>
        </div>
      </Card>
    </div>
  );
}

const RECOMMENDATION_TEXT = {
  "stay-auto": "stay auto",
  "insufficient-data": "stay auto (not enough data yet)",
  "switch-to-board": "switch to board",
  "stay-board": "stay board",
  "back-to-auto": "go back to auto",
} as const;

/** Market Test auto-or-board recommendation (computed by the code from the sessions measured in shadow). */
function VenueDecision({ decision: d }: { decision: MechanismDecisionView | undefined }) {
  if (!d) return <Muted>Mechanism decision not available yet (no GameState).</Muted>;
  const measured = d.sessions.filter((s) => s.ratio !== undefined).length;
  const switching = d.recommendation === "switch-to-board" || d.recommendation === "back-to-auto";
  const hb = d.heartbeat;
  return (
    <>
      <Flag kind={switching ? "decision" : "walk"}>
        now {d.current} · recommendation: {RECOMMENDATION_TEXT[d.recommendation]}
      </Flag>
      <Muted>{d.reason}</Muted>
      <span>
        measured sessions {measured}/2 · mean shadow/auto {d.meanRatio !== undefined ? fmt(d.meanRatio, 2) : "-"} · confidence {fmt(d.confidence, 2)}
        {d.nextBenchAt !== undefined ? ` · next bench h ${fmt(d.nextBenchAt, 2)}${d.nextBenchHard ? " (hard)" : ""}${d.ticksToBench !== undefined ? ` in ${d.ticksToBench} ticks` : ""}` : ""}
      </span>
      <span>
        shadow broker: {hb ? <strong>{hb.mode} · {hb.ageSec} s ago{hb.ageSec > 120 ? " (stale)" : ""}</strong> : <strong>no heartbeat</strong>}
      </span>
      <Muted>
        Switch to board needs: ≥ 2 measured sessions, mean shadow/auto ≥ 1.10, worst ≥ 0.95, cash ≥ {d.costs.bond + d.costs.fee}+floor (bond {d.costs.bond} + fee {d.costs.fee} + 20) P
        {d.costs.cashAvailable !== undefined ? `, now ${fmt(d.costs.cashAvailable)} P` : ""}, healthy broker, not near a bench. Switching needs team approval (--confirm --allow-venue-switch).
      </Muted>
    </>
  );
}

function Venues({ model, board }: { model: GameModel; board: Board }) {
  const venues = venuesOf(model, board.team);
  if (venues.length === 0) return null;
  const lb = board.market.leaderboard;
  return (
    <Card title={`Venues (${venues.length})`}>
      <div style={col}>
        <Muted>Trading on a rival's venue raises that team's Market-making score: the net edge of a market intent subtracts the fee and a rival penalty.</Muted>
        <DataTable
          columns={[
            { key: "venue", label: "Venue" },
            { key: "owner", label: "Owner" },
            { key: "rank", label: "Owner rank / score" },
            { key: "fee", label: "Fee", numeric: true },
            { key: "mech", label: "Mechanism" },
            { key: "status", label: "Status" },
            { key: "depth", label: "Depth", numeric: true },
            { key: "penalty", label: "Rival penalty", numeric: true },
          ]}
          rows={venues.map((v) => {
            const t = v.owner ? lb.find((x) => x.team === v.owner) : undefined;
            const rank = v.ownerRank ?? t?.rank ?? null;
            const score = v.ownerScore ?? t?.score ?? null;
            return {
              venue: `${v.id} · ${v.name}`,
              owner: v.ours ? { value: v.owner ? teamLabel(board, v.owner) : "us", tone: "better" as const } : v.owner ? (lb.some((x) => x.team === v.owner) ? teamLabel(board, v.owner) : (v.ownerName ?? v.owner)) : "house",
              rank: rank !== null || score !== null ? `#${rank ?? "?"} · ${fmt(score, 2)}` : "—",
              fee: v.feePct !== null ? `${fmt(v.feePct, 2)} %${v.feePerCard ? ` + ${v.feePerCard}/card` : ""}` : "—",
              mech: v.mechanism ?? "—",
              status: v.status ?? "—",
              depth: fmt(v.depth, 0),
              penalty: v.ours ? "can't trade" : fmt(v.rivalPenalty),
            };
          })}
        />
      </div>
    </Card>
  );
}

function Odds({ slot }: { slot: Record<string, number> }) {
  return (
    <span style={{ display: "inline-flex", height: 12, width: 64, borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--line)", verticalAlign: "middle" }} title={Object.entries(slot).map(([r, p]) => `${r} ${Math.round(p * 100)} %`).join(", ")}>
      {Object.entries(slot).map(([r, p]) => (
        <span key={r} style={{ width: `${p * 100}%`, background: RARITY_COLOR[r] ?? "var(--muted)" }} />
      ))}
    </span>
  );
}

function Packs({ model }: { model: GameModel }) {
  const { types, held, intents, source } = packsOf(model);
  if (types.length === 0 && held.length === 0) return null;
  return (
    <Card title={`Packs (${held.length} sealed · ${source === "state" ? "from the PACKS route" : "from the catalogue"})`}>
      <div style={col}>
        {held.length > 0 ? (
          <DataTable
            columns={[
              { key: "pack", label: "Our sealed pack" },
              { key: "value", label: "Our value", numeric: true },
              { key: "action", label: "Proposed action" },
            ]}
            rows={held.map((h) => ({ pack: `${h.name} (#${h.id})`, value: fmt(h.value), action: h.action ? `${h.action}${h.why ? ` — ${h.why}` : ""}` : "no proposal yet (PACKS route not in the state)" }))}
          />
        ) : (
          <Muted>No sealed packs.</Muted>
        )}
        {intents.length > 0 ? (
          <ul style={list}>
            {intents.map((i, k) => (
              <li key={k}>{i}</li>
            ))}
          </ul>
        ) : null}
        {types.length > 0 ? (
          <DataTable
            columns={[
              { key: "type", label: "Pack type" },
              { key: "slots", label: "Slots (rarity odds)" },
              { key: "book", label: "Expected book", numeric: true },
              { key: "ev", label: "Supply-adjusted EV", numeric: true },
              { key: "price", label: "Best price" },
            ]}
            rows={types.map((t) => ({
              type: (
                <span>
                  <span aria-hidden="true" style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, marginRight: 6, background: t.color ?? "var(--muted)" }} />
                  {t.name}
                </span>
              ),
              slots: (
                <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
                  {t.slots.map((sl, k) => (
                    <Odds key={k} slot={sl} />
                  ))}
                </span>
              ),
              book: fmt(t.expectedBook),
              ev: fmt(t.ev),
              price: [t.dealerPrice !== null ? `dealer ${fmt(t.dealerPrice)}` : null, t.ask !== null ? `ask ${fmt(t.ask)}` : null, t.bid !== null ? `bid ${fmt(t.bid)}` : null].filter(Boolean).join(" · ") || "—",
            }))}
          />
        ) : null}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- precios

const edge = (v: number | null) => (v === null ? "—" : v > 0 ? { value: `+${fmt(v)}`, tone: "better" as const } : fmt(v));

function Prices({ model }: { model: GameModel }) {
  const rows = priceRows(model);
  const [f, setF] = useState<PriceFilters>({ set: "", rarity: "", opportunities: false, sort: "buyEdge" });
  const oppId = useId();
  if (rows.length === 0) return null;
  const sets = [...new Set(rows.map((r) => r.set))].sort();
  const rarities = [...new Set(rows.map((r) => r.rarity).filter((r): r is string => r !== null))];
  const shown = filterPrices(rows, f);
  const sorts: { value: PriceSort; label: string }[] = [
    { value: "buyEdge", label: "Buy edge" },
    { value: "sellEdge", label: "Sell edge" },
    { value: "value", label: "Our value" },
    { value: "book", label: "Book" },
    { value: "scarcity", label: "Scarcity" },
    { value: "ref", label: "Card" },
  ];
  return (
    <Card title={`Prices (${rows.length} cards · ${model.prices?.source === "state" ? "from GameState" : "rebuilt by the viewer"})`}>
      <div style={col}>
        <Muted>
          Book = catalogue price · Value = our private value from the server (includes the +25 % page bonus; local only) · Market = best ask / bid in El Rastro and other venues. Buy edge = value − ask, sell edge = bid − value. Score = value gained at private value (uncapped, measured 3 Oct). ★ = completes a page.
        </Muted>
        <div className="nr-filters" role="group" aria-label="Price filters">
          <SelectBox label="Set" value={f.set} onChange={(set) => setF({ ...f, set })} options={[{ value: "", label: "All" }, ...sets.map((x) => ({ value: x, label: x }))]} />
          <SelectBox label="Rarity" value={f.rarity} onChange={(rarity) => setF({ ...f, rarity })} options={[{ value: "", label: "All" }, ...rarities.map((x) => ({ value: x, label: x }))]} />
          <SelectBox label="Sort by" value={f.sort} onChange={(sort) => setF({ ...f, sort: (sorts.find((x) => x.value === sort)?.value ?? "buyEdge") })} options={sorts} />
          <div className="nr-filter-field">
            <label className="nr-muted nr-filter-label" htmlFor={oppId}>
              Opportunities only
            </label>
            <input id={oppId} type="checkbox" checked={f.opportunities} onChange={(e) => setF({ ...f, opportunities: e.target.checked })} />
          </div>
        </div>
        <DataTable
          columns={[
            { key: "card", label: "Card" },
            { key: "book", label: "Book", numeric: true },
            { key: "supply", label: "Minted / run" },
            { key: "ask", label: "Best ask", numeric: true },
            { key: "bid", label: "Best bid", numeric: true },
            { key: "last", label: "Last trade", numeric: true },
            { key: "value", label: "Our value", numeric: true },
            { key: "held", label: "Held", numeric: true },
            { key: "buy", label: "Buy edge", numeric: true },
            { key: "sell", label: "Sell edge", numeric: true },
            { key: "dealers", label: "Dealers" },
          ]}
          rows={shown.slice(0, 150).map((r) => ({
            card: (
              <span>
                <RarityDot rarity={r.rarity ?? undefined} />
                {`${r.completesPage ? "★ " : ""}${r.ref}${r.name ? ` ${r.name}` : ""}`}
              </span>
            ),
            book: fmt(r.book, 0),
            supply: r.minted !== null || r.printRun !== null ? `${fmt(r.minted, 0)}/${fmt(r.printRun, 0)}${r.scarcity !== null ? ` (${Math.round(r.scarcity * 100)} %)` : ""}` : "—",
            ask: r.bestAsk === null ? "—" : `${fmt(r.bestAsk)}${r.askVenue ? ` @ ${r.askVenue}` : ""}`,
            bid: r.bestBid === null ? "—" : `${fmt(r.bestBid)}${r.bidVenue ? ` @ ${r.bidVenue}` : ""}`,
            last: fmt(r.lastTrade),
            value: fmt(r.value),
            held: r.holdings,
            buy: edge(r.buyEdge),
            sell: edge(r.sellEdge),
            dealers: r.dealers.join(", ") || "—",
          }))}
        />
        {shown.length > 150 ? <Muted>{`Showing 150 of ${shown.length}.`}</Muted> : null}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- eggs and flags

/** One flag we sent (`FlagRecord` from src/state/world.ts), tolerant of missing fields. */
function flagRow(f: unknown, nowTick: number | null) {
  const r = (f && typeof f === "object" ? f : {}) as Record<string, unknown>;
  const n = (x: unknown) => (typeof x === "number" ? x : null);
  const tick = n(r.tick);
  const result = typeof r.result === "string" ? r.result : "pending";
  const points = n(r.points);
  return {
    tick: tick ?? "?",
    persona: typeof r.persona === "string" ? r.persona : "—",
    message: r.messageId != null ? `#${String(r.messageId)}` : "—",
    reason: typeof r.reason === "string" ? r.reason : "—",
    result: (
      <span style={{ color: result === "hit" ? "var(--ok)" : result === "miss" ? "var(--warn)" : "var(--muted)", fontWeight: 700 }}>
        {result === "pending" ? `pending${tick !== null && nowTick !== null ? ` · ${nowTick - tick} ticks, no result published` : ""}` : result}
        {points !== null ? ` (${points > 0 ? "+" : ""}${points})` : ""}
      </span>
    ),
  };
}

function EggsAndFlags({ model, board }: { model: GameModel; board: Board }) {
  const o = model.state?.ours;
  const flags = flagsOf(model);
  const byPersona = Object.entries(model.state?.world?.eggs?.byPersona ?? {});
  const items = (label: string, xs: unknown[] | undefined) => (
    <span>
      {label}: {xs && xs.length ? xs.map(textOf).join("; ") : "none"}
    </span>
  );
  const nowTick = board.clock?.tick ?? null;
  return (
    <div className="nr-grid" style={gridCols("minmax(0, 3fr) minmax(0, 2fr)")}>
      {board.eggs ? <Eggs board={board} title={`Eggs (prestige, not scored) · ${board.eggs.ours.length} ours`} /> : <Card title="Eggs (prestige, not scored)">
        <div style={col}>
          <strong>Ours</strong>
          {items("eggs", o?.eggs)}
          {items("badges", o?.badges)}
          {items("hidden cards", o?.hiddenCards)}
          {items("gifts", o?.gifts)}
          <strong>Found by others, per persona</strong>
          {byPersona.length ? (
            <ul style={list}>
              {byPersona.map(([id, e]) => (
                <li key={id}>
                  {id}: {arr(e.foundByOthers).length} found{e.left !== undefined ? ` · ${e.left} left${e.leftAssumed ? " (assumed)" : ""}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <Muted>not in the state yet</Muted>
          )}
          {model.eggs_feed.length ? (
            <ul style={list} aria-label="Egg events from the feed">
              {model.eggs_feed.map((e) => (
                <li key={e.id}>
                  <Muted>{`tick ${e.tick ?? "?"} · ${e.type}${e.persona ? ` · ${e.persona}` : ""}`}</Muted> {e.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Card>}
      <Card title="Flags (scored: a hit adds, a miss costs)">
        <div style={col}>
          <span>
            sent <strong>{flags.sent.length}</strong> · balance <strong>{flags.balance === null ? "—" : fmt(flags.balance, 2)}</strong>
            <Muted>{" · the game has not published a flag result yet, so «pending» may stay"}</Muted>
          </span>
          {flags.sent.length ? (
            <div style={{ overflowX: "auto" }}>
              <DataTable
                columns={[
                  { key: "tick", label: "Tick", numeric: true },
                  { key: "persona", label: "Persona" },
                  { key: "message", label: "Message" },
                  { key: "reason", label: "Contradiction (text vs offer)" },
                  { key: "result", label: "Result" },
                ]}
                rows={flags.sent.map((f) => flagRow(f, nowTick))}
              />
            </div>
          ) : null}
          <strong>Candidates (verifiable contradiction between text and offer structure)</strong>
          {flags.candidates.length ? (
            <ul style={list}>
              {flags.candidates.map((c) => (
                <li key={c.conversation}>
                  {c.conversation}: {textOf(c.candidate)}
                </li>
              ))}
            </ul>
          ) : (
            <Muted>none</Muted>
          )}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- vista

export function ModelView({ model, loading, board, onOpen }: { model: GameModel | null; loading: boolean; board: Board; onOpen: (id: string) => void }) {
  if (!model) return <EmptyStateCard title={loading ? "Building our model for this tick (dry-run, GET only)…" : "No model yet"} />;
  if (!model.available) return <EmptyStateCard title={`Model not available: ${model.reason ?? "?"}`} />;
  const convs = sortedConversations(model);
  const active = convs.filter((c) => c.phase !== "done");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className="nr-card" style={{ ...row, justifyContent: "space-between", padding: "var(--space-3) var(--space-4)" }}>
        <strong style={{ fontSize: 18 }}>{timeSummary(model)}</strong>
        <Muted>
          tick {model.tick ?? "?"} · {model.safety.mode} · GET only · {model.reason ?? (loading ? "refreshing…" : "up to date")}
        </Muted>
      </div>
      <ThreeLayers model={model} board={board} />
      <Timeline model={model} />
      <Coordinator model={model} />
      <Goals model={model} board={board} />
      <Personas model={model} />
      <DealerEstimates model={model} />
      <Hints model={model} />
      <NewsSignals model={model} />
      <Card title={`Conversations in our model (${active.length} active, ${convs.length - active.length} done)`}>
        {convs.length > 0 ? <ConversationsTable convs={convs} onOpen={onOpen} /> : <Muted>No conversations.</Muted>}
      </Card>
      <Markets model={model} onOpen={onOpen} />
      <Venues model={model} board={board} />
      <Rivals model={model} board={board} />
      <Prices model={model} />
      <Packs model={model} />
      <EggsAndFlags model={model} board={board} />
    </div>
  );
}
