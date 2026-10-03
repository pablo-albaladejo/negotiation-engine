import { Flag } from "@negotiation-ring/design-system";
import { dealerFitStrip } from "../model/dealerFit.js";
import type { GameModel, ModelConversation } from "../model/gameModel.js";
import { bandView, isWelcome, strategyLines } from "../model/personaModel.js";

/**
 * Compact «Dealer fit» strip of the drawer: that persona's estimates (β, max_rounds, markup, mirror, walk-away round,
 * with interval and n) and the measured limit of that band. With `welcome` (first conversation with that dealer), a notice that
 * it only measures the limit. Dealer side only.
 */
export function DealerFitStrip({ model, conv }: { model: GameModel | null; conv: ModelConversation | null }) {
  const s = dealerFitStrip(model, conv);
  if (!s) return null;
  return (
    <div aria-label="Dealer fit" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", fontSize: 12.5, border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)" }}>
      <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
        <strong>Dealer fit · {s.persona} · {s.band}</strong>
        {s.welcome ? <Flag kind="decision">welcome</Flag> : null}
      </div>
      {s.items.map((i) => (
        <span key={i.label} style={{ fontFamily: "var(--font-mono)" }}>
          {i.label} {i.value} <span className="nr-muted">[{i.interval}] n{i.n}</span>
        </span>
      ))}
      <span style={{ fontFamily: "var(--font-mono)" }}>
        {s.limit ? (
          <>
            her limit {s.limit.value} <span className="nr-muted">[{s.limit.interval}] samples {s.limit.samples}</span> {s.limit.fewSamples ? <Flag kind="fallback">fewSamples</Flag> : null}
          </>
        ) : (
          <span className="nr-muted">her limit: no measure in this band yet</span>
        )}
      </span>
      {s.welcome ? (
        <span className="nr-muted">
          limit only, not the curve: first conversation with this dealer (opening = limit = final)
          {s.welcomeLimit ? ` · welcome limit ${s.welcomeLimit.value} [${s.welcomeLimit.interval}] n${s.welcomeLimit.n}` : ""}.
        </span>
      ) : null}
    </div>
  );
}

/**
 * The persona's strategy per TODAY's model (also in old or closed conversations), collapsible: the summary
 * carries the key figures (band limit, β, rounds, walk-away); inside, a table parameter · value · range · n ·
 * source, with this conversation's band limit on top and the unmeasured parameters together on one line.
 * The `welcome` mark says it only counts toward its limit. Dealer side only.
 */
export function PersonaStrategy({ model, conv }: { model: GameModel | null; conv: ModelConversation }) {
  if (conv.kind !== "dealer") return null;
  const lines = strategyLines(model, conv);
  const band = bandView(model, conv);
  const welcome = isWelcome(model, conv);
  const known = lines.filter((l) => l.value !== null);
  const unknown = lines.filter((l) => l.value === null);
  const pick = (key: string) => lines.find((l) => l.key === key)?.value;
  const headline = [
    band?.cells.value ? `her ${band.kind} ${band.cells.value}` : null,
    pick("beta") ? `β ${pick("beta")}` : null,
    pick("max_rounds") ? `rounds ${pick("max_rounds")}` : null,
    pick("walk_after_rounds") ? `walk ≈ ${pick("walk_after_rounds")}` : null,
  ].filter(Boolean);
  const rows = [
    ...(band ? [{ key: "band", label: `her ${band.kind} (${band.band})`, ...band.cells, source: `${band.cells.source}${band.cells.source ? " · " : ""}book ${band.book ?? "?"}`, few: band.fewSamples }] : []),
    ...known.map((l) => ({ ...l, label: l.label.replace(" ± patience_jitter", " ± jitter"), few: false })),
  ];
  return (
    <details open aria-label="Persona strategy (today's model)" style={{ borderTop: "1px solid var(--line)", paddingTop: "var(--space-2)", fontSize: 12.5 }}>
      <summary style={{ cursor: "pointer", display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
        <strong>{conv.counterparty} · today's model</strong>
        <span className="nr-muted">{headline.join(" · ")}</span>
        {welcome ? <Flag kind="decision">welcome: counts only towards her limit</Flag> : null}
      </summary>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--space-2)", fontVariantNumeric: "tabular-nums" }}>
        <thead>
          <tr className="nr-muted" style={{ textAlign: "left", fontSize: 11.5 }}>
            <th style={th}>parameter</th>
            <th style={{ ...th, textAlign: "right" }}>value</th>
            <th style={{ ...th, textAlign: "right" }}>range</th>
            <th style={{ ...th, textAlign: "right" }}>n</th>
            <th style={th}>source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} style={{ borderTop: "1px solid var(--line)", fontWeight: r.key === "band" ? 700 : undefined }}>
              <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.label}</td>
              <td style={{ ...td, textAlign: "right" }}>{r.value ?? <span className="nr-muted">unknown</span>}</td>
              <td style={{ ...td, textAlign: "right" }} className="nr-muted">{r.range || "—"}</td>
              <td style={{ ...td, textAlign: "right" }}>
                {r.n ?? "—"} {r.few ? <Flag kind="fallback">few</Flag> : null}
              </td>
              <td style={td} className="nr-muted">{r.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {unknown.length ? (
        <div className="nr-muted" style={{ marginTop: "var(--space-1)" }}>
          not measured yet: <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{unknown.map((l) => l.label).join(", ")}</span>
        </div>
      ) : null}
    </details>
  );
}

const th = { padding: "2px var(--space-2) 2px 0", fontWeight: 600 } as const;
const td = { padding: "3px var(--space-2) 3px 0", verticalAlign: "top", whiteSpace: "nowrap" } as const;
