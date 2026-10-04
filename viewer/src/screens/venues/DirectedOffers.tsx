import { useState } from "react";
import { Card, DataTable } from "@negotiation-ring/design-system";
import { teamLabel, type Board } from "../../model/index.js";
import { TeamName } from "../teams/TeamLink.js";

/**
 * «Between other teams»: directed offers one team makes to another (they never show in the venue books), from the
 * public stream, last ~60 ticks: who → whom, the cards, the cash and how it ended. Structure only (their text is never
 * read or shown). A card we hold as a spare is highlighted: someone in the market wants it, and at what price.
 */

const STATUS_COLOR: Record<string, string> = { open: "var(--us)", filled: "var(--ok)", cancelled: "var(--muted)", expired: "var(--muted)" };

export function DirectedOffers({ board }: { board: Board }) {
  const [sparesOnly, setSparesOnly] = useState(false);
  const all = board.directed;
  if (!all) return null;
  const rows = sparesOnly ? all.filter((d) => d.spare) : all;
  const spares = all.filter((d) => d.spare).length;
  const pairs = new Map<string, number>();
  for (const d of all) pairs.set(`${d.maker}→${d.to}`, (pairs.get(`${d.maker}→${d.to}`) ?? 0) + 1);
  const top = [...pairs].sort((a, b) => b[1] - a[1]).slice(0, 5);
  return (
    <Card title={`Between other teams · ${all.length} directed offers (last 60 ticks)`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <span className="nr-muted">
          {top.length ? `Most active: ${top.map(([k, n]) => `${k} (${n})`).join(" · ")}` : "No directed offers between other teams in the last 60 ticks."}
          {spares ? <strong style={{ color: "var(--ok)" }}>{` · ${spares} on cards we hold as spares`}</strong> : null}
        </span>
        <label style={{ display: "inline-flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" checked={sparesOnly} onChange={(e) => setSparesOnly(e.target.checked)} />
          only cards we hold as spares
        </label>
        {rows.length ? (
          <div style={{ overflowX: "auto" }}>
            <DataTable
              columns={[
                { key: "tick", label: "Tick", numeric: true },
                { key: "who", label: "Who → whom" },
                { key: "side", label: "Side" },
                { key: "card", label: "Card" },
                { key: "price", label: "Price", numeric: true },
                { key: "status", label: "State" },
              ]}
              rows={rows.slice(0, 80).map((d) => ({
                tick: d.tick ?? "?",
                who: (
                  <span>
                    <TeamName board={board} team={d.maker} /> → <TeamName board={board} team={d.to} />
                    {d.venue && d.venue !== "rastro" ? ` @ ${d.venue}` : ""}
                  </span>
                ),
                side: d.side,
                card: (
                  <span style={d.spare ? { color: "var(--ok)", fontWeight: 800 } : undefined} title={d.spare ? `we hold ×${d.hand}` : undefined}>
                    {d.refs.join(" + ") || "—"}
                    {d.spare ? ` · our spare ×${d.hand}` : ""}
                  </span>
                ),
                price: `${d.price} P`,
                status: <span style={{ color: STATUS_COLOR[d.status], fontWeight: 700 }}>{d.status}</span>,
              }))}
            />
          </div>
        ) : (
          <span className="nr-muted">None.</span>
        )}
      </div>
    </Card>
  );
}
