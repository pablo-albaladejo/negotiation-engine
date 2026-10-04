import { TableLink } from "@negotiation-ring/design-system";
import { teamLabel, type Board } from "../../model/index.js";
import { DealerName, useNav } from "../nav/Links.js";

/** A team's name anywhere in the viewer: click → its profile in the «Teams» tab. A dealer id renders as `DealerName`. */
export function TeamName({ board, team, strong = false }: { board: Board; team: string; strong?: boolean }) {
  const nav = useNav();
  if (nav && !/^t\d+$/.test(team) && nav.dealers.has(team)) return <DealerName id={team} />;
  const label = teamLabel(board, team);
  const us = team === board.team;
  const style = us ? { color: "var(--us)", fontWeight: 800 } : strong ? { fontWeight: 700 } : undefined;
  if (!nav || !/^t\d+$/.test(team)) return <span style={style}>{label}</span>;
  return (
    <TableLink aria-label={`Open ${label} in Teams`} title={`Open ${label} in Teams`} onClick={() => nav.team(team)} style={style}>
      {label}
    </TableLink>
  );
}
