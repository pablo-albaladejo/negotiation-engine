import { Card, DataTable, Flag } from "@negotiation-ring/design-system";
import { dealerEstimates, type EstimateRow } from "../model/dealerFit.js";
import type { GameModel } from "../model/gameModel.js";
import { Sparkline } from "../ui/sparkline.js";

/**
 * «Dealer estimates»: el ajuste de la curva por persona (solo el lado del dealer). Tabla de parámetros con valor,
 * intervalo y n; límites por banda marcando las de pocas muestras; y una línea por parámetro con su historia para
 * ver cómo converge.
 */
export function DealerEstimates({ model }: { model: GameModel }) {
  const views = dealerEstimates(model);
  if (views.length === 0) {
    return (
      <Card title="Dealer estimates">
        <span className="nr-muted">No fit yet: no dealer conversation with prices (persona-posterior.json {model.fit?.source === "persona-posterior.json" ? "read" : "not found"}).</span>
      </Card>
    );
  }
  const series = (r: EstimateRow) => <Sparkline values={r.series.map((p) => p.value)} label={`${r.label} by tick ${r.series.map((p) => p.tick).join(", ")}`} />;
  const points = (r: EstimateRow) => (r.series.length > 0 ? `${r.series.length} pt · t${r.series[0]!.tick}–${r.series.at(-1)!.tick}` : "—");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {views.map((v) => (
        <Card key={v.id} title={`Dealer estimates · ${v.name}${v.name !== v.id ? ` (${v.id})` : ""} · fitted from ${v.fittedFrom} conversation${v.fittedFrom === 1 ? "" : "s"} · mirror ${v.mirror}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <DataTable
              columns={[
                { key: "param", label: "Parameter" },
                { key: "value", label: "Value", numeric: true },
                { key: "interval", label: "Interval (lo–hi)", numeric: true },
                { key: "n", label: "n", numeric: true },
                { key: "trend", label: "Convergence" },
                { key: "points", label: "History" },
              ]}
              rows={v.params.map((r) => ({ param: r.label, value: r.value, interval: r.interval, n: r.n || "prior", trend: series(r), points: points(r) }))}
            />
            {v.bands.length > 0 ? (
              <DataTable
                columns={[
                  { key: "band", label: "Band (her side · rarity)" },
                  { key: "limit", label: "Her limit", numeric: true },
                  { key: "interval", label: "Interval (lo–hi)", numeric: true },
                  { key: "n", label: "Samples", numeric: true },
                  { key: "best", label: "Best sample", numeric: true },
                  { key: "trend", label: "Convergence" },
                  { key: "few", label: "" },
                ]}
                rows={v.bands.map((b) => ({
                  band: b.label,
                  limit: b.value,
                  interval: b.interval,
                  n: b.n,
                  best: b.best,
                  trend: series(b),
                  few: b.fewSamples ? <Flag kind="fallback">fewSamples</Flag> : "",
                }))}
              />
            ) : (
              <span className="nr-muted">No band limits yet.</span>
            )}
          </div>
        </Card>
      ))}
      <span className="nr-muted">
        Dealer side only (her opening markup, concession shape, rounds and limits); our values and reservations are never shown here. Source: {model.fit?.source ?? "state.personas"}. fewSamples = fewer than 3 conversations in that band.
      </span>
    </div>
  );
}
