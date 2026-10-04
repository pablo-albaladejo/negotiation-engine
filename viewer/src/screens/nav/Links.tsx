import { TableLink } from "@negotiation-ring/design-system";
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";

/**
 * Cross-tab links, given by BazaarScreen: a tick opens the «Tick N» drawer (everything we saw happen around it), a
 * team its profile in «Teams», a dealer its row in «Dealers». Without the provider they render as plain text.
 */
export interface Nav {
  tick: (tick: number) => void;
  team: (team: string) => void;
  dealer: (id: string) => void;
  /** Dealer ids we know (persona id → name), so a counterparty id can be told apart from a team. */
  dealers: ReadonlyMap<string, string>;
}

export const NavCtx = createContext<Nav | null>(null);

export const useNav = () => useContext(NavCtx);

/** «t1231» anywhere in the viewer: click → the «Tick 1231» drawer. */
export function TickLink({ tick, prefix = "t", style }: { tick: number | null | undefined; prefix?: string; style?: CSSProperties }) {
  const nav = useNav();
  if (tick === null || tick === undefined) return <span style={style}>{`${prefix}?`}</span>;
  if (!nav) return <span style={style}>{`${prefix}${tick}`}</span>;
  return (
    <TableLink aria-label={`Open tick ${tick}`} title={`What happened at tick ${tick}`} onClick={() => nav.tick(tick)} {...(style ? { style } : {})}>
      {`${prefix}${tick}`}
    </TableLink>
  );
}

/** A dealer's name: click → its row in the «Dealers» tab. */
export function DealerName({ id, children }: { id: string; children?: ReactNode }) {
  const nav = useNav();
  const label = children ?? nav?.dealers.get(id) ?? id;
  if (!nav) return <span>{label}</span>;
  return (
    <TableLink aria-label={`Open dealer ${id}`} title={`Open ${id} in Dealers`} onClick={() => nav.dealer(id)}>
      {label}
    </TableLink>
  );
}
