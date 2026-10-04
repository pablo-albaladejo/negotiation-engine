import type { GameModel } from "../../model/gameModel.js";
import { EmptyStateCard } from "../../ui/states.js";
import { DealerEstimates } from "../DealerEstimates.js";
import { Personas } from "../ModelView.js";

/** «Personas» tab: every dealer persona we model and our estimates per dealer (structure only). Read-only. */
export function PersonasView({ model, loading }: { model: GameModel | null; loading: boolean }) {
  if (!model || !model.available) return <EmptyStateCard title={loading ? "Loading our model…" : `Personas need our model: ${model?.reason ?? "not available"}`} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <Personas model={model} />
      <DealerEstimates model={model} />
    </div>
  );
}
