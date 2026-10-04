import { useEffect, useRef } from "react";
import type { GameModel } from "../../model/gameModel.js";
import { EmptyStateCard } from "../../ui/states.js";
import { DealerEstimates } from "../DealerEstimates.js";
import { Personas } from "../ModelView.js";

/** «Dealers» tab: every dealer persona we model and our estimates per dealer (structure only). Read-only. A dealer
 * name clicked anywhere in the viewer lands here with its row picked and scrolled into view. */
export function PersonasView({ model, loading, picked = "", onPick }: { model: GameModel | null; loading: boolean; picked?: string; onPick?: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (picked) ref.current?.querySelector('tr[aria-current="true"]')?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [picked, model?.available]);
  if (!model || !model.available) return <EmptyStateCard title={loading ? "Loading our model…" : `Personas need our model: ${model?.reason ?? "not available"}`} />;
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <Personas model={model} picked={picked} {...(onPick ? { onPick } : {})} />
      <DealerEstimates model={model} />
    </div>
  );
}
