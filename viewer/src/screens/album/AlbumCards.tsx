import { useState } from "react";
import { Card } from "@negotiation-ring/design-system";
import { RARITY_COLOR, type Board, type BoardAlbumCard, type BoardAlbumPage } from "../../model/index.js";
import type { ModelValuation, ModelValuationCard } from "../../model/gameModel.js";

/**
 * The album as cards, like the game's /cards page: one band per set (color, theme, have/of) and a tile per page card,
 * held in full color or missing in grey; under each tile the book price, the API value (`your_value`) and ours from `GameState.valuation` (lose a copy, +1 copy; ~ = estimated base), and the page bonus per set; copies in circulation under each tile, and
 * the shinies (off the page) apart. The art is our own drawing (sun + a skyline seeded by the ref), not the game's.
 * Read-only: no figure is computed here.
 */

const FALLBACK = "#8A6F9E";
const NOT_LOGGED = "Not logged yet.";
const fmtV = (v: number) => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10);

/** Same ref → same skyline: a few buildings whose heights come from the ref's characters. */

function Skyline({ seed, dark }: { seed: string; dark: string }) {
  const codes = [...seed].map((c) => c.charCodeAt(0));
  const h = (i: number) => 18 + ((codes[i % codes.length]! * (i + 7)) % 34);
  const xs = [0, 16, 30, 48, 62, 78, 92];
  return (
    <svg viewBox="0 0 108 60" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "46%" }}>
      {xs.map((x, i) => (
        <rect key={x} x={x} y={60 - h(i)} width={i % 2 ? 14 : 18} height={h(i)} fill={dark} />
      ))}
      {xs.map((x, i) =>
        h(i) > 30 ? (
          <g key={`w${x}`} fill="#F6D27A" opacity={0.85}>
            <rect x={x + 4} y={60 - h(i) + 6} width={3} height={4} />
            <rect x={x + 9} y={60 - h(i) + 6} width={3} height={4} />
            <rect x={x + 4} y={60 - h(i) + 14} width={3} height={4} />
          </g>
        ) : null,
      )}
    </svg>
  );
}

function Tile({ c, color, set, v }: { c: BoardAlbumCard; color: string; set: string; v: ModelValuationCard | undefined }) {
  const rarity = c.rarity ?? "common";
  const rc = RARITY_COLOR[rarity] ?? "var(--muted)";
  const have = c.held > 0;
  const dark = `color-mix(in srgb, ${color} 45%, #1A1226)`;
  const num = c.ref.split("-")[1] ?? c.ref;
  const minted = c.minted !== null && c.print_run ? Math.min(100, Math.round((100 * c.minted) / c.print_run)) : null;
  return (
    <li style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }} title={`${c.ref} ${c.name}${c.flavour ? ` — ${c.flavour}` : ""}`}>
      <div
        style={{
          position: "relative",
          aspectRatio: "3 / 4.2",
          borderRadius: 10,
          overflow: "hidden",
          border: have ? `2px solid ${rarity === "common" ? `color-mix(in srgb, ${color} 60%, #fff)` : rc}` : "2px dashed var(--line)",
          background: `linear-gradient(180deg, color-mix(in srgb, ${color} 35%, #F3C6A5) 0%, color-mix(in srgb, ${color} 55%, #3A2440) 100%)`,
          filter: have ? undefined : "grayscale(0.9)",
          opacity: have ? 1 : 0.5,
          boxShadow: have && (rarity === "epic" || rarity === "legendary") ? `0 0 12px ${rc}` : undefined,
        }}
      >
        <span aria-hidden="true" style={{ position: "absolute", right: "14%", top: "24%", width: "34%", aspectRatio: "1", borderRadius: "50%", background: "#F6D27A" }} />
        <Skyline seed={c.ref} dark={dark} />
        <span
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            top: 6,
            font: "800 13px/1.05 var(--font-display)",
            textTransform: "uppercase",
            color: "#FFF6EC",
            textShadow: "0 1px 2px rgba(0,0,0,.55)",
            overflowWrap: "anywhere",
          }}
        >
          {c.name}
        </span>
        {c.held > 1 ? (
          <span style={{ position: "absolute", right: 6, top: "56%", padding: "1px 6px", borderRadius: "var(--radius-pill)", background: "#1A1226", color: "#FFF6EC", fontSize: 11, fontWeight: 800 }}>{`×${c.held}`}</span>
        ) : null}
        {c.hidden && have ? (
          <span style={{ position: "absolute", left: 6, top: "56%", padding: "1px 6px", borderRadius: "var(--radius-pill)", background: "#1A1226", color: "#FFC44D", fontSize: 10, fontWeight: 800 }}>never sold</span>
        ) : null}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 4,
            padding: "3px 6px",
            background: "#1A1226",
            color: "#E9DDF0",
            font: "600 9px/1.2 ui-monospace, monospace",
            textTransform: "uppercase",
          }}
        >
          <span style={{ whiteSpace: "nowrap" }}>{`${set} ${num}`}</span>
          <span style={{ color: rc, whiteSpace: "nowrap" }}>{`● ${rarity}`}</span>
        </div>
      </div>
      {minted !== null ? (
        <div role="meter" aria-label={`${c.minted} of ${c.print_run} in circulation`} aria-valuenow={c.minted ?? 0} aria-valuemin={0} aria-valuemax={c.print_run ?? 0} style={{ height: 4, borderRadius: "var(--radius-pill)", background: "var(--line)", overflow: "hidden" }}>
          <div style={{ width: `${minted}%`, height: "100%", background: rc }} />
        </div>
      ) : null}
      <span className="nr-muted" style={{ fontSize: 11, display: "flex", justifyContent: "space-between", gap: 4, fontVariantNumeric: "tabular-nums" }}>
        <span>{c.minted !== null && c.print_run ? `${c.minted}/${c.print_run}` : ""}</span>
        <span>{c.book !== null ? `book ${c.book}` : ""}</span>
      </span>
      <span
        style={{ fontSize: 11, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "0 4px", fontVariantNumeric: "tabular-nums", whiteSpace: "pre-line" }}
        title={
          v
            ? [
                `API: ${v.api !== undefined ? fmtV(v.api) : "?"} (your_value${have ? " of the copy we hold" : ", first copy"})`,
                `Base: ${fmtV(v.base)} (${v.baseSource === "api" ? "from the API" : "estimated: set multiplier × book"}; first copy, no page bonus)`,
                `Next copy: ${fmtV(v.nextCopy)} (what one more adds)`,
                v.loseCopy !== undefined ? `Lose a copy: ${fmtV(v.loseCopy)} (value lost + page risk)` : null,
              ]
                .filter(Boolean)
                .join("\n")
            : "Our valuation loads with the model (GameState.valuation)."
        }
      >
        <span className="nr-muted">{`API ${c.value !== null ? fmtV(c.value) : "?"}`}</span>
        <span style={{ color: "var(--us)", fontWeight: 700 }}>
          {v ? (have ? `lose ${fmtV(v.loseCopy ?? 0)} · +1 ${fmtV(v.nextCopy)}` : `${v.baseSource === "estimated" ? "~" : ""}+1 ${fmtV(v.nextCopy)}`) : "ours ?"}
        </span>
      </span>
    </li>
  );
}

const grid = { listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 124px), 1fr))", gap: "var(--space-3)" } as const;

function Page({ p, val }: { p: BoardAlbumPage; val: ModelValuation | null }) {
  const vOf = (ref: string) => val?.cards.find((x) => x.ref === ref);
  const bonus = val?.pages.find((x) => x.set === p.set)?.bonus;
  const color = p.color ?? FALLBACK;
  const pct = Math.round((100 * p.have) / Math.max(1, p.of));
  return (
    <section aria-label={`${p.name} page`} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "8px 10px", borderRadius: 10, background: `linear-gradient(90deg, color-mix(in srgb, ${color} 40%, transparent), transparent)` }}>
        <span style={{ flex: "none", display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 10, background: color, color: "#fff", font: "800 16px/1 var(--font-display)" }}>{p.set}</span>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
          <strong style={{ font: "800 18px/1.1 var(--font-display)" }}>{p.name}</strong>
          {p.theme ? <span className="nr-muted" style={{ fontSize: 12, fontStyle: "italic" }}>{p.theme}</span> : null}
        </div>
        {bonus !== undefined ? (
          <span className="nr-muted" style={{ fontSize: 12, whiteSpace: "nowrap" }} title="Page bonus: page bonus fraction × Σ base of its cards (GameState.valuation)">
            {`page bonus ${fmtV(bonus)}${p.complete ? " · ours" : " · at stake"}`}
          </span>
        ) : null}
        <span style={{ fontWeight: 800, color: p.complete ? "var(--ok)" : undefined, whiteSpace: "nowrap" }}>{`${p.have}/${p.of}${p.complete ? " ✓" : ""}`}</span>
      </div>
      <div style={{ height: 6, borderRadius: "var(--radius-pill)", background: "var(--line)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: p.complete ? "var(--ok)" : color }} />
      </div>
      {p.cards && p.cards.length > 0 ? (
        <ul style={grid} aria-label={`${p.name} cards`}>
          {p.cards.map((c) => (
            <Tile key={c.ref} c={c} color={color} set={p.set} v={vOf(c.ref)} />
          ))}
        </ul>
      ) : (
        <span className="nr-muted">{p.missing.length ? `Missing: ${p.missing.map((m) => m.ref).join(", ")}` : "No card list from the catalog yet."}</span>
      )}
      {p.shinies && p.shinies.length > 0 ? (
        <>
          <span className="nr-muted" style={{ fontSize: 12 }}>
            ✦ <strong>Shinies</strong> · not on the page, they top it up
          </span>
          <ul style={grid} aria-label={`${p.name} shinies`}>
            {p.shinies.map((c) => (
              <Tile key={c.ref} c={c} color={color} set={p.set} v={vOf(c.ref)} />
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

function Chip({ on, label, dot, onClick }: { on: boolean; label: string; dot?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: "var(--radius-pill)",
        border: `1px solid ${on ? "var(--us)" : "var(--line)"}`,
        background: on ? "color-mix(in srgb, var(--us) 15%, transparent)" : "transparent",
        color: "inherit",
        font: "inherit",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {dot ? <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: "50%", background: dot }} /> : null}
      {label}
    </button>
  );
}

export function AlbumCards({ board, valuation = null }: { board: Board; valuation?: ModelValuation | null }) {
  const album = board.album;
  const [set, setSet] = useState<string>("all");
  const [missingOnly, setMissingOnly] = useState(false);
  const title = album ? `Album ${album.filled ?? "?"}/${album.slots ?? "?"} · ★ ${album.pages.filter((p) => p.complete).length} pages complete` : "Album";
  if (!album || album.pages.length === 0) {
    return (
      <Card title="Album">
        <span className="nr-muted">{NOT_LOGGED}</span>
      </Card>
    );
  }
  const pages = album.pages
    .filter((p) => set === "all" || p.set === set)
    .map((p) => (missingOnly ? { ...p, cards: (p.cards ?? []).filter((c) => c.held === 0), shinies: [] } : p));
  return (
    <Card title={title}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div role="group" aria-label="Sets" style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <Chip on={set === "all"} label="All sets" onClick={() => setSet("all")} />
          {album.pages.map((p) => (
            <Chip key={p.set} on={set === p.set} dot={p.color ?? FALLBACK} label={`${p.set} ${p.have}/${p.of}${p.complete ? " ✓" : ""}`} onClick={() => setSet(p.set)} />
          ))}
          <Chip on={missingOnly} label="only missing" onClick={() => setMissingOnly(!missingOnly)} />
        </div>
        {pages.map((p) => (
          <Page key={p.set} p={p} val={valuation} />
        ))}
      </div>
    </Card>
  );
}
