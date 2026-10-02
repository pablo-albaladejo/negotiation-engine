import { MatchSelector as DsMatchSelector } from "@negotiation-ring/design-system";

/** Lo mínimo de cada partida que usa el selector (sale tal cual de transcripts.jsonl). */
export interface MatchSelectorGame {
  gameId: string;
  rival?: string;
  endReason?: string;
}

export interface MatchSelectorProps {
  games: MatchSelectorGame[];
  currentGameId: string;
  onSelectGame: (gameId: string) => void;
}

/** Partidas a cada lado de la actual: un run puede tener miles y el componente pinta un botón por partida. */
export const MATCH_WINDOW = 3;

/** Etiqueta de UI a partir del motivo de fin registrado; no se calcula nada. */
export function endReasonLabel(endReason: string | undefined): { result: "deal" | "walk"; label: string } {
  if (endReason === "agreement") return { result: "deal", label: "Deal" };
  if (endReason === "agent-walk" || endReason === "rival-walk") return { result: "walk", label: "Walk" };
  if (endReason === "limit") return { result: "walk", label: "Round limit" };
  return { result: "walk", label: endReason ?? "not logged" };
}

/** Ventana de partidas alrededor de la actual, en el orden del log. */
export function matchWindow(games: MatchSelectorGame[], currentGameId: string, size = MATCH_WINDOW): MatchSelectorGame[] {
  const index = games.findIndex((game) => game.gameId === currentGameId);
  if (index < 0) return games.slice(0, size * 2 + 1);
  return games.slice(Math.max(0, index - size), index + size + 1);
}

/**
 * Selector de partida del replay: usa el `MatchSelector` del design system (no un control propio)
 * con una ventana de partidas vecinas para no pintar miles de botones.
 */
export function MatchSelector({ games, currentGameId, onSelectGame }: MatchSelectorProps) {
  const matches = matchWindow(games, currentGameId).map((game) => {
    const { result, label } = endReasonLabel(game.endReason);
    return { id: game.gameId, rival: game.rival ?? "not logged", result, label };
  });
  return <DsMatchSelector matches={matches} selectedId={currentGameId} onSelect={onSelectGame} />;
}
