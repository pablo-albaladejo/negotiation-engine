import { useState, type ReactNode } from "react";
import { Card, DataTable } from "@negotiation-ring/design-system";
import type { Board, BoardMarketHindsight, BoardMarketSession } from "../../model/index.js";
import { TickLink } from "../nav/Links.js";

/**
 * «Market test»: our bench sessions in AUTO (v04) against BOARD (v26, our broker matching). A table with the official
 * result per session (efficiency vs the auto baseline, Δ, matches), the selected session's book tick by tick (one line
 * per synthetic trader: asks red, bids green, style by temper) with our matches #n and the hindsight optimum's ghost
 * pairs On marked, ours vs optimum in quote surplus with the missed and suboptimal pairs, and a live band while a bench
 * runs. Read-only; every figure comes from the server (`board.market_test`).
 */

const ASK = "var(--bad, #e5484d)";
const BID = "var(--ok)";
/** Hindsight optimum ghosts: neutral ink, dashed and hollow. */
const GHOST = "var(--ink)";
/** Temper → line style: new and firm solid, relaxing dashed, settled faint. */
const TEMPER_STYLE: Record<string, { dash?: string; opacity: number }> = {
  new: { opacity: 1 },
  firm: { opacity: 1 },
  relaxing: { dash: "4 3", opacity: 0.8 },
  settled: { opacity: 0.35 },
};

const fmt3 = (x: number | null) => (x === null ? "—" : x.toFixed(3));
const signed = (x: number | null) => (x === null ? "—" : `${x > 0 ? "+" : ""}${x.toFixed(3)}`);

/** One legend entry: a tiny drawn sample next to its meaning. */
function Key({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
      <svg width={26} height={12} viewBox="0 0 26 12" aria-hidden="true">
        {children}
      </svg>
      {label}
    </span>
  );
}

function Legend({ showOurs, showGhosts }: { showOurs: boolean; showGhosts: boolean }) {
  const row = { display: "flex", flexWrap: "wrap" as const, gap: "var(--space-1) var(--space-3)", alignItems: "center" };
  return (
    <div className="nr-muted" style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <div style={row}>
        <strong>Side</strong>
        <Key label="ask (seller)">
          <line x1={1} x2={25} y1={6} y2={6} stroke={ASK} strokeWidth={2} />
        </Key>
        <Key label="bid (buyer)">
          <line x1={1} x2={25} y1={6} y2={6} stroke={BID} strokeWidth={2} />
        </Key>
      </div>
      <div style={row}>
        <strong>Trader mood</strong>
        <Key label="new quote">
          <circle cx={13} cy={6} r={4} fill="var(--muted)" />
        </Key>
        <Key label="firm (holds the price)">
          <line x1={1} x2={25} y1={6} y2={6} stroke="var(--muted)" strokeWidth={2} />
        </Key>
        <Key label="relaxing (moves toward the other side)">
          <line x1={1} x2={25} y1={6} y2={6} stroke="var(--muted)" strokeWidth={2} strokeDasharray="4 3" />
        </Key>
        <Key label="settled (done trading)">
          <circle cx={13} cy={6} r={3} fill="none" stroke="var(--muted)" opacity={0.6} />
        </Key>
        <span>· a line that stops: the trader left or was matched</span>
      </div>
      {showOurs ? (
        <div style={row}>
          <strong>Our broker</strong>
          <Key label="match sent (at its price)">
            <rect x={9} y={2} width={8} height={8} fill="var(--us)" />
          </Key>
          <Key label="refused or dry-run">
            <rect x={9} y={2} width={8} height={8} fill="none" stroke="var(--us)" strokeWidth={2} />
          </Key>
          <Key label="the ask and bid we paired (rings, joined), #n = row below (hover a row to focus it)">
            <g>
              <line x1={13} x2={13} y1={2} y2={10} stroke="var(--us)" strokeWidth={2} />
              <circle cx={13} cy={2.5} r={2.2} fill="none" stroke="var(--us)" strokeWidth={1.5} />
              <circle cx={13} cy={9.5} r={2.2} fill="none" stroke="var(--us)" strokeWidth={1.5} />
            </g>
          </Key>
        </div>
      ) : null}
      {showGhosts ? (
        <div style={row}>
          <strong>Hindsight optimum</strong>
          <Key label="best pair given the book (dashed, hollow), On = row below">
            <g>
              <line x1={13} x2={13} y1={2} y2={10} stroke={GHOST} strokeWidth={1.5} strokeDasharray="2 2" />
              <circle cx={13} cy={2.5} r={2.2} fill="none" stroke={GHOST} strokeWidth={1.2} strokeDasharray="1.5 1.5" />
              <circle cx={13} cy={9.5} r={2.2} fill="none" stroke={GHOST} strokeWidth={1.2} strokeDasharray="1.5 1.5" />
            </g>
          </Key>
        </div>
      ) : null}
    </div>
  );
}

function BookChart({ s, hover = null }: { s: BoardMarketSession; hover?: number | null }) {
  const [showOurs, setShowOurs] = useState(true);
  const [showGhosts, setShowGhosts] = useState(true);
  const traders = s.traders ?? [];
  const allMatches = s.our_matches ?? [];
  const matches = showOurs ? allMatches : [];
  const allGhosts = s.hindsight?.pairs ?? [];
  const ghosts = showGhosts ? allGhosts : [];
  // The traders of our matches and of the optimum stand out; the rest of the book fades.
  // Hovering a row of the matches table focuses that match: its two traders and its rings; everything else dims.
  const focus = hover !== null ? matches[hover] : undefined;
  const matched = focus
    ? new Set([focus.sell, focus.buy].filter((x): x is string => x !== null))
    : new Set([...matches.flatMap((m) => [m.sell, m.buy].filter((x): x is string => x !== null)), ...ghosts.flatMap((g) => [g.ask_id, g.bid_id])]);
  const fade = (id: string) => (matched.size === 0 ? 1 : matched.has(id) ? 1 : focus ? 0.12 : 0.3);
  const dimMatch = (i: number) => (focus && i !== hover ? 0.2 : 1);
  const quotes = [...traders.flatMap((t) => t.points.map((p) => p.quote)), ...matches.flatMap((m) => [m.ask, m.bid, m.price].filter((x): x is number => x !== null))];
  if (!quotes.length) return <span className="nr-muted">No book lines logged for this session (bench.jsonl).</span>;
  const W = 760;
  const H = 300;
  const pad = { l: 40, r: 12, t: 12, b: 28 };
  const x0 = s.start_tick;
  const x1 = s.start_tick + s.ticks + 1;
  const lo = Math.floor(Math.min(...quotes) / 10) * 10;
  const hi = Math.ceil(Math.max(...quotes) / 10) * 10 || lo + 10;
  const x = (t: number) => pad.l + ((t - x0) / Math.max(1, x1 - x0)) * (W - pad.l - pad.r);
  const y = (q: number) => pad.t + (1 - (q - lo) / Math.max(1, hi - lo)) * (H - pad.t - pad.b);
  const yTicks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
  const toggle = { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" };
  return (
    <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      {allMatches.length || allGhosts.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
          {allMatches.length ? (
            <label style={toggle}>
              <input type="checkbox" checked={showOurs} onChange={(e) => setShowOurs(e.target.checked)} />
              {`Show our matches #n (${allMatches.length})`}
            </label>
          ) : null}
          {allGhosts.length ? (
            <label style={toggle}>
              <input type="checkbox" checked={showGhosts} onChange={(e) => setShowGhosts(e.target.checked)} />
              {`Show hindsight optimum On (${allGhosts.length})`}
            </label>
          ) : null}
        </div>
      ) : null}
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Bench book of session ${s.session}: quotes per trader by tick`} style={{ width: "100%", height: "auto" }}>
        {yTicks.map((q) => (
          <g key={q}>
            <line x1={pad.l} x2={W - pad.r} y1={y(q)} y2={y(q)} stroke="var(--line)" />
            <text x={pad.l - 6} y={y(q) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
              {Math.round(q)}
            </text>
          </g>
        ))}
        {Array.from({ length: x1 - x0 + 1 }, (_, i) => x0 + i)
          .filter((t, i) => i % 2 === 0 || t === x1)
          .map((t) => (
            <text key={t} x={x(t)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">
              {t}
            </text>
          ))}
        {traders.map((t) => {
          const color = t.side === "ask" ? ASK : BID;
          return (
            <g key={t.id}>
              {t.points.slice(1).map((p, i) => {
                const prev = t.points[i]!;
                const st = TEMPER_STYLE[p.temper ?? ""] ?? { opacity: 0.8 };
                return <line key={i} x1={x(prev.tick)} y1={y(prev.quote)} x2={x(p.tick)} y2={y(p.quote)} stroke={color} strokeWidth={matched.has(t.id) ? 3 : 2} strokeOpacity={st.opacity * fade(t.id)} {...(st.dash ? { strokeDasharray: st.dash } : {})} />;
              })}
              {t.points.map((p, i) => (
                <circle key={i} cx={x(p.tick)} cy={y(p.quote)} r={p.temper === "new" ? 4 : 2.5} fill={p.temper === "settled" ? "none" : color} stroke={color} opacity={(TEMPER_STYLE[p.temper ?? ""] ?? { opacity: 0.8 }).opacity * fade(t.id)}>
                  <title>{`${t.id} · ${t.side} ${p.quote} · ${p.temper ?? "?"} · t${p.tick}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
        {ghosts.map((g, i) => (
          <g key={`ghost${i}`} opacity={focus ? 0.2 : 1}>
            <line x1={x(g.tick)} x2={x(g.tick)} y1={y(g.ask)} y2={y(g.bid)} stroke={GHOST} strokeWidth={1.5} strokeDasharray="4 3" />
            <circle cx={x(g.tick)} cy={y(g.ask)} r={8} fill="none" stroke={GHOST} strokeWidth={1.5} strokeDasharray="3 2">
              <title>{`O${i + 1} optimal ask: ${g.ask_id} at ${g.ask} (t${g.tick})`}</title>
            </circle>
            <circle cx={x(g.tick)} cy={y(g.bid)} r={8} fill="none" stroke={GHOST} strokeWidth={1.5} strokeDasharray="3 2">
              <title>{`O${i + 1} optimal bid: ${g.bid_id} at ${g.bid} (t${g.tick})`}</title>
            </circle>
            <text x={x(g.tick) - 10} y={y((g.ask + g.bid) / 2) + 4} textAnchor="end" fontSize="11" fontWeight={700} fill={GHOST}>
              {`O${i + 1}`}
            </text>
          </g>
        ))}
        {matches.map((m, i) =>
          m.ask !== null && m.bid !== null ? (
            <g key={`pair${i}`} opacity={dimMatch(i)}>
              <line x1={x(m.tick)} x2={x(m.tick)} y1={y(m.ask)} y2={y(m.bid)} stroke="var(--us)" strokeWidth={i === hover ? 3.5 : 2} />
              <circle cx={x(m.tick)} cy={y(m.ask)} r={i === hover ? 9 : 6} fill="none" stroke="var(--us)" strokeWidth={i === hover ? 3 : 2}>
                <title>{`#${i + 1} ask we took: ${m.sell ?? "?"} at ${m.ask}`}</title>
              </circle>
              <circle cx={x(m.tick)} cy={y(m.bid)} r={i === hover ? 9 : 6} fill="none" stroke="var(--us)" strokeWidth={i === hover ? 3 : 2}>
                <title>{`#${i + 1} bid we took: ${m.buy ?? "?"} at ${m.bid}`}</title>
              </circle>
            </g>
          ) : null,
        )}
        {matches.map((m, i) =>
          m.price !== null ? (
            <text key={`n${i}`} x={x(m.tick) + 8} y={y(m.price) + 4} fontSize={i === hover ? 14 : 11} fontWeight={700} fill="var(--us)" opacity={dimMatch(i)}>
              {`#${i + 1}`}
            </text>
          ) : null,
        )}
        {matches.map((m, i) =>
          m.price !== null ? (
            <rect key={`p${i}`} opacity={dimMatch(i)} x={x(m.tick) - 4} y={y(m.price) - 4} width={8} height={8} fill={m.status === "sent" ? "var(--us)" : "none"} stroke="var(--us)" strokeWidth={2}>
              <title>{`our match t${m.tick}: ${m.sell ?? "?"} × ${m.buy ?? "?"} at ${m.price} (ask ${m.ask ?? "?"} / bid ${m.bid ?? "?"}) · ${m.status ?? "?"}${m.error ? ` · ${m.error}` : ""}`}</title>
            </rect>
          ) : null,
        )}
      </svg>
      <figcaption>
        <Legend showOurs={showOurs && allMatches.length > 0} showGhosts={showGhosts && allGhosts.length > 0} />
      </figcaption>
    </figure>
  );
}

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)}%`);

/** Ours vs the hindsight optimum, in quote surplus, plus the missed and suboptimal pairs. */
function HindsightPanel({ s, h }: { s: BoardMarketSession; h: BoardMarketHindsight }) {
  const ours = s.our_matches ?? [];
  const status = h.final ? "final" : `provisional (tick ${h.through_tick ?? "?"})`;
  const optimum = h.comparable
    ? `optimum ${h.optimum.pairs} pairs · quote surplus ${h.optimum.surplus} · captured ${h.ours.surplus}/${h.optimum.surplus} (${pct(h.captured)})`
    : `optimum: ${h.note ?? "not comparable"}`;
  const optIndex = (askId: string, bidId: string) => h.pairs.findIndex((p) => p.ask_id === askId && p.bid_id === bidId);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <div className="nr-card" style={{ padding: "var(--space-2) var(--space-3)", borderLeft: `4px solid ${h.comparable ? "var(--us)" : "var(--line)"}` }}>
        <strong>{`Ours ${h.ours.pairs} pairs · quote surplus ${h.ours.surplus}`}</strong>
        <span>{" vs "}</span>
        <strong style={{ color: h.comparable ? undefined : "var(--muted)" }}>{optimum}</strong>
        <span className="nr-muted">{` · ${status}`}</span>
        <div className="nr-muted" style={{ fontSize: 12 }}>
          Quote surplus = bid − ask as quoted in bench.jsonl (no private limits): not the official efficiency. Optimum = best pairs in hindsight, each trader once, using every tick seen.
        </div>
      </div>
      {h.comparable && (h.missed.length || h.suboptimal.length) ? (
        <div style={{ overflowX: "auto" }}>
          <DataTable
            columns={[
              { key: "kind", label: "" },
              { key: "ref", label: "Ref" },
              { key: "ask", label: "Ask (seller)" },
              { key: "bid", label: "Bid (buyer)" },
              { key: "tick", label: "Tick", numeric: true },
              { key: "surplus", label: "Quote surplus", numeric: true },
            ]}
            rows={[
              ...h.missed.map((p) => ({
                kind: <strong style={{ color: "var(--warn)" }}>Missed</strong>,
                ref: `O${optIndex(p.ask_id, p.bid_id) + 1}`,
                ask: `${p.ask_id} @ ${p.ask}`,
                bid: `${p.bid_id} @ ${p.bid}`,
                tick: p.tick,
                surplus: p.surplus,
              })),
              ...h.suboptimal.map((i) => {
                const m = ours[i];
                return {
                  kind: <strong style={{ color: "var(--muted)" }}>Suboptimal</strong>,
                  ref: `#${i + 1}`,
                  ask: `${m?.sell ?? "?"} @ ${m?.ask ?? "?"}`,
                  bid: `${m?.buy ?? "?"} @ ${m?.bid ?? "?"}`,
                  tick: m?.tick ?? "—",
                  surplus: m?.surplus ?? "—",
                };
              }),
            ]}
          />
        </div>
      ) : h.comparable && h.optimum.pairs ? (
        <span className="nr-muted">Every optimal pair was ours: nothing missed, nothing suboptimal.</span>
      ) : null}
    </div>
  );
}

export function MarketTest({ board }: { board: Board }) {
  const mt = board.market_test;
  const sessions = mt?.sessions ?? [];
  const [picked, setPicked] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  if (!mt) return <Card title="Market test">{<span className="nr-muted">Not available (older viewer server).</span>}</Card>;
  const key = (s: BoardMarketSession) => `${s.day}:${s.session}`;
  const withBook = sessions.filter((s) => s.traders !== null);
  const selected = sessions.find((s) => key(s) === picked) ?? withBook[withBook.length - 1] ?? null;
  const running = mt.now !== null && (mt.now.bench ?? 0) > 0;
  const auto = sessions.filter((s) => s.mode === "auto" && s.efficiency !== null);
  const board_ = sessions.filter((s) => s.mode === "board" && s.efficiency !== null);
  const mean = (xs: BoardMarketSession[]) => (xs.length ? xs.reduce((a, s) => a + (s.efficiency ?? 0), 0) / xs.length : null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {mt.now ? (
        <div className="nr-card" style={{ padding: "var(--space-2) var(--space-3)", borderLeft: `4px solid ${running ? "var(--us)" : "var(--line)"}` }}>
          <strong>{running ? "Bench running" : "No bench now"}</strong>
          <span className="nr-muted">{` · broker log: ${mt.now.line}`}</span>
        </div>
      ) : null}
      <Card title={`Market test · ${sessions.length} sessions · auto mean ${fmt3(mean(auto))} · board mean ${fmt3(mean(board_))}`}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <span className="nr-muted">
            Official result per session (bench.finished): efficiency vs the auto baseline. Bench points: equal to auto → half; full at the top-3 mean. Click a session to see its book.
          </span>
          <div style={{ overflowX: "auto" }}>
            <DataTable
              columns={[
                { key: "session", label: "Session" },
                { key: "hour", label: "Hour", numeric: true },
                { key: "mode", label: "Mode" },
                { key: "hard", label: "Hard" },
                { key: "eff", label: "Efficiency", numeric: true },
                { key: "base", label: "Auto baseline", numeric: true },
                { key: "delta", label: "Δ", numeric: true },
                { key: "matches", label: "Matches", numeric: true },
                { key: "ours", label: "Our matches (sent / refused)", numeric: true },
              ]}
              rows={sessions.map((s) => {
                const ours = s.our_matches ?? [];
                return {
                  session: `${s.day.slice(5)} · s${s.session}${s.finished ? "" : " (running)"}`,
                  hour: s.hour === null ? `t${s.start_tick}` : `h${s.hour}`,
                  mode: <strong style={{ color: s.mode === "board" ? "var(--us)" : undefined }}>{`${s.mode}${s.venue ? ` (${s.venue})` : ""}`}</strong>,
                  hard: s.hard ? "hard" : "—",
                  eff: fmt3(s.efficiency),
                  base: fmt3(s.auto_baseline),
                  delta: <span style={{ color: (s.delta ?? 0) > 0 ? "var(--ok)" : (s.delta ?? 0) < 0 ? "var(--warn)" : undefined }}>{signed(s.delta)}</span>,
                  matches: s.matches ?? "—",
                  ours: s.our_matches === null ? "—" : `${ours.filter((m) => m.status === "sent").length} / ${ours.filter((m) => m.status === "refused").length}`,
                };
              })}
              onRowClick={(i) => {
                const s = sessions[i];
                if (s) setPicked(key(s));
                setHover(null);
              }}
              {...(selected ? { selectedRowIndex: sessions.indexOf(selected) } : {})}
            />
          </div>
        </div>
      </Card>
      {selected ? (
        <Card title={`Session ${selected.session} · h${selected.hour ?? "?"} · ${selected.mode}${selected.hard ? " · hard" : ""} · ticks ${selected.start_tick}–${selected.start_tick + selected.ticks}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <span className="nr-muted">
              {`official efficiency ${fmt3(selected.efficiency)} vs auto baseline ${fmt3(selected.auto_baseline)} (Δ ${signed(selected.delta)}) · ${selected.matches ?? "?"} matches · book ${selected.dry_run === null ? "not logged" : selected.dry_run ? "read in shadow (dry-run)" : "live broker"}`}
              {selected.shadow ? ` · shadow surplus ${selected.shadow.shadow_surplus ?? "?"} vs auto ${selected.shadow.auto_surplus ?? "?"} (pairs ${selected.shadow.pairs_shadow ?? "?"} vs ${selected.shadow.pairs_auto ?? "?"})` : ""}
            </span>
            {selected.hindsight ? <HindsightPanel s={selected} h={selected.hindsight} /> : null}
            {selected.traders ? <BookChart s={selected} hover={hover} /> : <span className="nr-muted">Book kept only for the last sessions.</span>}
            {(selected.our_matches ?? []).length ? (
              <div style={{ overflowX: "auto" }}>
                <DataTable
                  columns={[
                    { key: "n", label: "#" },
                    { key: "tick", label: "Tick", numeric: true },
                    { key: "pair", label: "Ask (seller) × bid (buyer)" },
                    { key: "price", label: "Price", numeric: true },
                    { key: "quotes", label: "Ask / bid" },
                    { key: "surplus", label: "Surplus", numeric: true },
                    { key: "source", label: "Source" },
                    { key: "status", label: "Status" },
                  ]}
                  rows={(selected.our_matches ?? []).map((m, i) => ({
                    n: <strong style={{ color: "var(--us)" }}>{`#${i + 1}`}</strong>,
                    tick: <TickLink tick={m.tick} prefix="" />,
                    pair: `${m.sell ?? "?"} asks ${m.ask ?? "?"} × ${m.buy ?? "?"} bids ${m.bid ?? "?"}`,
                    price: m.price ?? "—",
                    quotes: `${m.ask ?? "?"} / ${m.bid ?? "?"}`,
                    surplus: m.surplus ?? "—",
                    source: m.source ?? "—",
                    status: <span style={{ color: m.status === "sent" ? "var(--ok)" : m.status === "refused" ? "var(--warn)" : "var(--muted)", fontWeight: 700 }}>{`${m.status ?? "?"}${m.error ? ` · ${m.error}` : ""}`}</span>,
                  }))}
                  onRowHover={setHover}
                  {...(hover !== null ? { selectedRowIndex: hover } : {})}
                />
              </div>
            ) : (
              <span className="nr-muted">No matches of ours logged in this session (broker.jsonl).</span>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
