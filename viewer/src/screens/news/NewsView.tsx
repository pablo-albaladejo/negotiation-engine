import type { GameModel } from "../../model/gameModel.js";
import { EmptyStateCard } from "../../ui/states.js";
import { NewsSignals } from "../NewsSignals.js";
import { RadioRastro } from "../now/RadioRastro.js";

/** «News» tab: Radio Rastro as it airs and the news signals (which dealer, set or card is talked about). Never a figure. */
export function NewsView({ model, loading }: { model: GameModel | null; loading: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {model?.available ? <NewsSignals model={model} /> : <EmptyStateCard title={loading ? "Loading our model (news signals)…" : `News signals need our model: ${model?.reason ?? "not available"}`} />}
      <RadioRastro />
    </div>
  );
}
