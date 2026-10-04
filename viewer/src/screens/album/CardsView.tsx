import type { Board } from "../../model/index.js";
import type { GameModel } from "../../model/gameModel.js";
import { EmptyStateCard } from "../../ui/states.js";
import { Prices } from "../ModelView.js";
import { AlbumCards } from "./AlbumCards.js";

/** «Cards» tab: our album as cards, then the price sheet of every card (book, market, our value, next copy, edges). */
export function CardsView({ board, model, loading }: { board: Board; model: GameModel | null; loading: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <AlbumCards board={board} valuation={model?.valuation ?? null} workshop={model?.workshop ?? null} />
      {model?.available ? <Prices model={model} /> : <EmptyStateCard title={loading ? "Loading our model (price sheet)…" : `The price sheet needs our model: ${model?.reason ?? "not available"}`} />}
    </div>
  );
}
