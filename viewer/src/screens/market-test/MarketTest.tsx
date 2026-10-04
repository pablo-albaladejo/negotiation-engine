import { useState, type ReactNode } from "react";
import { Card, DataTable } from "@negotiation-ring/design-system";
import type { Board, BoardMarketSession } from "../../model/index.js";

/**
 * «Market test»: our bench sessions in AUTO (v04) against BOARD (v26, our broker matching). A table with the official
 * result per session (efficiency vs the auto baseline, Δ, matches), the selected session's book tick by tick (one line
 * per synthetic trader: asks red, bids green, style by temper) with our matches marked, and a live band while a bench
 * runs. Read-only; every figure comes from the server (`board.market_test`).
 */

const ASK = "var(--bad, #e5484d)";
const BID = "var(--ok)";
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

function Legend({ showOurs }: { showOurs: boolean }) {
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
          <Key label="the ask and bid we paired (rings, joined), #n = row below">
            <g>
              <line x1={13} x2={13} y1={2} y2={10} stroke="var(--us)" strokeWidth={2} />
              <circle cx={13} cy={2.5} r={2.2} fill="none" stroke="var(--us)" strokeWidth={1.5} />
              <circle cx={13} cy={9.5} r={2.2} fill="none" stroke="var(--us)" strokeWidth={1.5} />
            </g>
          </Key>
          <Key label="tick with matches (count on top)">
            <line x1={13} x2={13} y1={0} y2={12} stroke="var(--us)" strokeDasharray="2 3" />
          </Key>
        </div>
      ) : null}
    </div>
  );
}

function BookChart({ s }: { s: BoardMarketSession }) {
  const [showOurs, setShowOurs] = useState(true);
  const traders = s.traders ?? [];
  const allMatches = s.our_matches ?? [];
  const matches = showOurs ? allMatches : [];
  // The traders of our matches stand out; the rest of the book fades while our matches are shown.
  const matched = new Set(matches.flatMap((m) => [m.sell, m.buy].filter((x): x is string => x !== null)));
  const fade = (id: string) => (matched.size === 0 ? 1 : matched.has(id) ? 1 : 0.35);
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
  const byTick = new Map<number, { sent: number; refused: number; other: number }>();
  for (const m of matches) {
    const c = byTick.get(m.tick) ?? { sent: 0, refused: 0, other: 0 };
    if (m.status === "sent") c.sent += 1;
    else if (m.status === "refused") c.refused += 1;
    else c.other += 1;
    byTick.set(m.tick, c);
  }
  return (
    <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      {allMatches.length ? (
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, alignSelf: "flex-start", cursor: "pointer" }}>
          <input type="checkbox" checked={showOurs} onChange={(e) => setShowOurs(e.target.checked)} />
          {`Show our matches (${allMatches.length})`}
        </label>
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
        {[...byTick].map(([t, c]) => (
          <g key={`m${t}`}>
            <line x1={x(t)} x2={x(t)} y1={pad.t} y2={H - pad.b} stroke="var(--us)" strokeDasharray="2 3" />
            <text x={x(t) + 3} y={pad.t + 10} fontSize="10" fill="var(--us)">
              {[c.sent ? `${c.sent} sent` : null, c.refused ? `${c.refused} refused` : null, c.other ? `${c.other} dry` : null].filter(Boolean).join(" · ")}
            </text>
          </g>
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
        {matches.map((m, i) =>
          m.ask !== null && m.bid !== null ? (
            <g key={`pair${i}`}>
              <line x1={x(m.tick)} x2={x(m.tick)} y1={y(m.ask)} y2={y(m.bid)} stroke="var(--us)" strokeWidth={2} />
              <circle cx={x(m.tick)} cy={y(m.ask)} r={6} fill="none" stroke="var(--us)" strokeWidth={2}>
                <title>{`#${i + 1} ask we took: ${m.sell ?? "?"} at ${m.ask}`}</title>
              </circle>
              <circle cx={x(m.tick)} cy={y(m.bid)} r={6} fill="none" stroke="var(--us)" strokeWidth={2}>
                <title>{`#${i + 1} bid we took: ${m.buy ?? "?"} at ${m.bid}`}</title>
              </circle>
            </g>
          ) : null,
        )}
        {matches.map((m, i) =>
          m.price !== null ? (
            <text key={`n${i}`} x={x(m.tick) + 8} y={y(m.price) + 4} fontSize="11" fontWeight={700} fill="var(--us)">
              {`#${i + 1}`}
            </text>
          ) : null,
        )}
        {matches.map((m, i) =>
          m.price !== null ? (
            <rect key={`p${i}`} x={x(m.tick) - 4} y={y(m.price) - 4} width={8} height={8} fill={m.status === "sent" ? "var(--us)" : "none"} stroke="var(--us)" strokeWidth={2}>
              <title>{`our match t${m.tick}: ${m.sell ?? "?"} × ${m.buy ?? "?"} at ${m.price} (ask ${m.ask ?? "?"} / bid ${m.bid ?? "?"}) · ${m.status ?? "?"}${m.error ? ` · ${m.error}` : ""}`}</title>
            </rect>
          ) : null,
        )}
      </svg>
      <figcaption>
        <Legend showOurs={showOurs && allMatches.length > 0} />
      </figcaption>
    </figure>
  );
}

export function MarketTest({ board }: { board: Board }) {
  const mt = board.market_test;
  const sessions = mt?.sessions ?? [];
  const [picked, setPicked] = useState<string | null>(null);
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
              {`efficiency ${fmt3(selected.efficiency)} vs auto ${fmt3(selected.auto_baseline)} (Δ ${signed(selected.delta)}) · ${selected.matches ?? "?"} matches · book ${selected.dry_run === null ? "not logged" : selected.dry_run ? "read in shadow (dry-run)" : "live broker"}`}
              {selected.shadow ? ` · shadow surplus ${selected.shadow.shadow_surplus ?? "?"} vs auto ${selected.shadow.auto_surplus ?? "?"} (pairs ${selected.shadow.pairs_shadow ?? "?"} vs ${selected.shadow.pairs_auto ?? "?"})` : ""}
            </span>
            {selected.traders ? <BookChart s={selected} /> : <span className="nr-muted">Book kept only for the last sessions.</span>}
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
                    tick: m.tick,
                    pair: `${m.sell ?? "?"} asks ${m.ask ?? "?"} × ${m.buy ?? "?"} bids ${m.bid ?? "?"}`,
                    price: m.price ?? "—",
                    quotes: `${m.ask ?? "?"} / ${m.bid ?? "?"}`,
                    surplus: m.surplus ?? "—",
                    source: m.source ?? "—",
                    status: <span style={{ color: m.status === "sent" ? "var(--ok)" : m.status === "refused" ? "var(--warn)" : "var(--muted)", fontWeight: 700 }}>{`${m.status ?? "?"}${m.error ? ` · ${m.error}` : ""}`}</span>,
                  }))}
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
