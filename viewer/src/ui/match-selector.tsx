import { MatchSelector as DsMatchSelector } from "@negotiation-ring/design-system";
import { resultLabel, resultTone } from "./labels.js";

/** Lo mínimo de cada partida que usa el selector (sale tal cual de transcripts.jsonl). */
export interface MatchSelectorGame {
  gameId: string;
  rival?: string;
  endReason?: string;
  /** `line.protocolViolation?.by`, when known: disambiguates `endReason: "protocol-violation"`. */
  protocolViolation?: { by: "agent" | "rival" };
  /** C7: same disambiguation when only logged on `metrics.protocolViolation` -- the fallback the
   * Matches table/KpiStrip already use (`model/matches.ts`, `model/arenaReplay.ts`). */
  metrics?: { protocolViolation?: "agent" | "rival" | null };
}

export interface MatchSelectorProps {
  games: MatchSelectorGame[];
  currentGameId: string;
  onSelectGame: (gameId: string) => void;
}

/** Partidas a cada lado de la actual: un run puede tener miles y el componente pinta un botón por partida. */
export const MATCH_WINDOW = 3;

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
    const violationBy = game.protocolViolation?.by ?? game.metrics?.protocolViolation ?? null;
    return {
      id: game.gameId,
      rival: game.rival ?? "not logged",
      result: resultTone(game.endReason, violationBy),
      label: resultLabel(game.endReason, violationBy).label,
    };
  });
  return <DsMatchSelector matches={matches} selectedId={currentGameId} onSelect={onSelectGame} />;
}
