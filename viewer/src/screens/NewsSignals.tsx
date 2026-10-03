import { Card, Flag, Pill } from "@negotiation-ring/design-system";
import { arr, rec, type GameModel } from "../model/gameModel.js";

/**
 * «News signals»: `GameState.news`, the news as a hint (which dealer, set or card is being talked about and in which
 * direction). Unverified and never a figure; no decision reads it yet. Plain text only.
 */

const muted = { color: "var(--muted)" } as const;
const col = { display: "flex", flexDirection: "column", gap: "var(--space-2)" } as const;
const row = { display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" } as const;
const list = { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-1)" } as const;

const DIRECTION_PILL = { demand: "verdict", supply: "rejected", event: "sample", unknown: "sample" } as const;
const KINDS = ["dealers", "sets", "cards", "venues"] as const;

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strs = (v: unknown): string[] => arr(v).filter((x): x is string => typeof x === "string");

export function NewsSignals({ model }: { model: GameModel }) {
  const news = rec(rec(model as unknown).news ?? rec(model.state).news);
  const items = arr(news.items).map(rec);
  const summary = rec(news.summary);
  return (
    <Card title={`News signals (${items.length})`}>
      <div style={col}>
        <span style={muted}>
          Radio Rastro, the Bulletin and the notice board as a hint (narrow exception to «structure only»): which dealer, set or card is being talked about. Unverified, may be rumour, never a figure; no decision reads it yet.
        </span>
        {str(summary.text) ? (
          <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            <span style={muted}>Summary ({str(summary.by) || "?"}): </span>
            {str(summary.text)}
          </div>
        ) : null}
        {items.length > 0 ? (
          <ul style={list} aria-label="News signals, latest first">
            {items.slice(0, 30).map((s, k) => {
              const mentions = rec(s.mentions);
              const direction = str(s.direction) as keyof typeof DIRECTION_PILL;
              return (
                <li key={typeof s.id === "number" ? s.id : k} style={{ borderTop: "1px solid var(--line)", paddingTop: "var(--space-1)" }}>
                  <div style={row}>
                    <span style={muted}>{[typeof s.tick === "number" ? `tick ${s.tick}` : null, typeof s.ageTicks === "number" ? `${s.ageTicks} ticks ago` : null, str(s.sourceName) || str(s.source)].filter(Boolean).join(" · ")}</span>
                    <Pill kind={DIRECTION_PILL[direction] ?? "sample"}>{direction || "unknown"}</Pill>
                    {s.unverified !== false ? <Flag kind="fallback">unverified</Flag> : null}
                    {KINDS.flatMap((kind) =>
                      strs(mentions[kind]).map((m) => (
                        <Flag key={`${kind}:${m}`} kind="neutral">
                          {`${kind.slice(0, -1)}: ${m}`}
                        </Flag>
                      )),
                    )}
                  </div>
                  <div style={{ overflowWrap: "anywhere" }}>
                    <strong>{str(s.headline)}</strong>
                    {str(s.body) ? <span style={muted}> — {str(s.body)}</span> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <span style={muted}>{news.available === true ? "No news yet." : "No news-summary.json yet (pnpm bazaar:news writes it)."}</span>
        )}
      </div>
    </Card>
  );
}
