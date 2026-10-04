import type { Board } from "../../model/index.js";
import type { GameModel } from "../../model/gameModel.js";
import { EmptyStateCard } from "../../ui/states.js";
import { EggsAndFlags, Hints } from "../ModelView.js";
import { Eggs } from "./Eggs.js";

/**
 * «Eggs» tab: everything about easter eggs in one place: our eggs and gifts per dealer (with probes and prizes), the
 * flags we sent, and the hints corpus (dealer lines kept only as an egg hint, never a figure). Read-only.
 */
export function EggsView({ board, model, loading, onOpenThread }: { board: Board; model: GameModel | null; loading: boolean; onOpenThread: (thread: number) => void }) {
  if (!model || !model.available) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <Eggs board={board} onOpenThread={onOpenThread} />
        <EmptyStateCard title={loading ? "Loading our model (flags and hints corpus)…" : `Flags and hints need our model: ${model?.reason ?? "not available"}`} />
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <EggsAndFlags model={model} board={board} onOpenThread={onOpenThread} />
      <Hints model={model} />
    </div>
  );
}
