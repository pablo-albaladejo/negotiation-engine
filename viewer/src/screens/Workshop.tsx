import { Card } from "@negotiation-ring/design-system";
import { RARITY_COLOR, teamLabel, type Board } from "../model/index.js";
import type { ModelWorkshop } from "../model/gameModel.js";
import { TeamName } from "./teams/TeamLink.js";
import { TickLink } from "./nav/Links.js";

/**
 * The Workshop (El Taller): three spare copies of one rarity → one random card of the next rarity (shown, never
 * scored). Read-only: spares counted by the server under the sale guardrails (never the last free copy, nothing
 * busy in a thread or offer) and the public `taller.crafted` events. Nothing here sends; a POST needs Pablo's OK.
 */

const ul = { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-1)" } as const;
const dot = (rarity: string) => <span aria-hidden="true" style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: RARITY_COLOR[rarity] ?? "var(--muted)", marginRight: 6 }} />;

export function Workshop({ board, strategy = null }: { board: Board; strategy?: ModelWorkshop | null }) {
  const w = board.workshop;
  if (!w) return null;
  const ready = w.rarities.filter((r) => r.ready);
  const title = !w.open ? "The Workshop · not open" : ready.length ? `The Workshop · ready: ${ready.map((r) => `${r.rarity} → ${r.next}`).join(", ")}` : "The Workshop · nothing to craft";
  return (
    <Card title={title}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <span className="nr-muted">
          {w.needed} spare copies of one rarity → 1 random card of the next (never scored). We always keep one free copy of each card.
          {w.opened_tick !== null ? ` Open since tick ${w.opened_tick}.` : ""}
        </span>
        {w.rarities.length > 0 ? (
          <ul style={ul} aria-label="Our spares by rarity">
            {w.rarities.map((r) => (
              <li key={r.rarity}>
                {dot(r.rarity)}
                <strong>{`${r.rarity} ${Math.min(r.count, w.needed)}/${w.needed}`}</strong>{" "}
                <span className="nr-muted">{r.spares.map((s) => `${s.ref}${s.spare > 1 ? ` ×${s.spare}` : ""}`).join(" ")}</span>
                {r.ready ? <span style={{ color: "var(--ok)" }}>{` · ready → ${r.next}`}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <span className="nr-muted">No spare copies right now.</span>
        )}
        {strategy && strategy.rarities.length > 0 ? (
          <ul style={ul} aria-label="Workshop strategy (GameState.workshop)">
            {strategy.rarities.map((r) => (
              <li key={r.rarity} style={r.decision === "craft" ? { color: "var(--ok)" } : undefined} className={r.decision === "craft" ? undefined : "nr-muted"}>
                {`Strategy · ${r.rarity}: ${r.decision}${r.decision === "craft" && r.pick.length ? ` [${r.pick.map((id) => `${r.spares.find((s) => s.id === id)?.ref ?? "?"}#${id}`).join(", ")}]` : ""} · ${r.reason}`}
              </li>
            ))}
          </ul>
        ) : null}
        {w.locked.length > 0 ? <span className="nr-muted">{`Busy (not counted): ${w.locked.map((l) => `${l.ref} #${l.id} in ${l.where}`).join(" · ")}`}</span> : null}
        {w.crafts.length > 0 ? (
          <>
            <strong>{`Crafted (${w.crafts.length})`}</strong>
            <ul style={ul} aria-label="Public crafts, latest first">
              {w.crafts.slice(0, 8).map((c) => (
                <li key={c.id} className={c.us ? undefined : "nr-muted"}>
                  <TickLink tick={c.tick} />
                  {" · "}
                  <TeamName board={board} team={c.team} />
                  {` · ${c.from ?? "?"} → ${c.card ?? "?"} (${c.to ?? "?"})`}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </Card>
  );
}
