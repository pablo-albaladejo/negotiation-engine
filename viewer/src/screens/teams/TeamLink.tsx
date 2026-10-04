import { TableLink } from "@negotiation-ring/design-system";
import { createContext, useContext } from "react";
import { teamLabel, type Board } from "../../model/index.js";

/** Opens the «Teams» tab on a team; given by BazaarScreen. Without it, team names render as plain text. */
export const TeamNav = createContext<((team: string) => void) | null>(null);

/** A team's name anywhere in the viewer: click → its profile in the «Teams» tab. */
export function TeamName({ board, team, strong = false }: { board: Board; team: string; strong?: boolean }) {
  const open = useContext(TeamNav);
  const label = teamLabel(board, team);
  const us = team === board.team;
  const style = us ? { color: "var(--us)", fontWeight: 800 } : strong ? { fontWeight: 700 } : undefined;
  if (!open || !/^t\d+$/.test(team)) return <span style={style}>{label}</span>;
  return (
    <TableLink aria-label={`Open ${label} in Teams`} title={`Open ${label} in Teams`} onClick={() => open(team)} style={style}>
      {label}
    </TableLink>
  );
}
