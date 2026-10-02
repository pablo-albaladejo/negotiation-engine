import { Card, DataTable, KpiStrip } from "@negotiation-ring/design-system";
import { gridCols } from "../ui/grid.js";
import { PageTitle } from "../ui/page-title.js";
import { EmptyStateCard } from "../ui/states.js";
import type { BazaarLiveInfo, BazaarModel } from "../model/index.js";

export interface BazaarScreenProps {
  model: BazaarModel;
  live: BazaarLiveInfo | null;
}

const NOT_LOGGED = "not logged";

function kpi(label: string, value: number | string | undefined): { label: string; value: string } {
  return { label, value: value === undefined ? NOT_LOGGED : String(value) };
}

/**
 * Bazaar: la cifra que maximizamos, tal como la trazó el agente. La UI nunca calcula; solo
 * presenta los campos y deltas ya logueados por `src/bazaar/score.ts` y lo que
 * `/api/bazaar/live` sirve en vivo (ambos ya sin `rarest`/`luck`/`luck_private`).
 */
export function BazaarScreen({ model, live }: BazaarScreenProps) {
  const latest = model.latest;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <PageTitle>Bazaar</PageTitle>
        <span className="nr-muted" aria-live="polite">
          {live ? `${live.team ?? "?"} · ${live.round ?? "?"} · tick ${live.tick ?? "?"}` : NOT_LOGGED}
        </span>
      </div>
      <KpiStrip
        items={[
          kpi("Score", latest?.score),
          kpi("Rank", latest?.rank),
          kpi("Negotiating", latest?.neg_points),
          kpi("Market-making", latest?.mm_points),
          kpi("Duels", latest?.duel_points),
          kpi("Ladder", latest?.ladder_points),
          kpi("Bench efficiency", latest?.bench_efficiency),
          kpi("Deals", latest?.deals),
        ]}
      />
      <div className="nr-grid" style={gridCols("repeat(2, minmax(0, 1fr))")}>
        <Card title="Score over time">
          {model.chart.length > 0 ? (
            <DataTable
              columns={[
                { key: "tick", label: "Tick", numeric: true },
                { key: "score", label: "Score", numeric: true },
              ]}
              rows={model.chart.map((p) => ({ tick: p.tick, score: p.score }))}
            />
          ) : (
            <EmptyStateCard title="No logged score ticks yet" />
          )}
        </Card>
        <Card title="What moved the score">
          {model.moved.length > 0 ? (
            <DataTable
              columns={[
                { key: "tick", label: "Tick", numeric: true },
                { key: "component", label: "Component" },
                { key: "delta", label: "Delta", numeric: true },
                { key: "cause", label: "Cause" },
              ]}
              rows={model.moved.map((m) => ({
                tick: m.tick,
                component: m.component,
                delta: m.delta > 0 ? { value: m.delta, tone: "better" as const } : m.delta < 0 ? { value: m.delta, tone: "worse" as const } : { value: m.delta },
                cause: m.cause,
              }))}
            />
          ) : (
            <EmptyStateCard title="No logged score changes yet" />
          )}
        </Card>
      </div>
      <span className="nr-muted">Judges: not scored yet (not reported by /api/me).</span>
    </section>
  );
}
