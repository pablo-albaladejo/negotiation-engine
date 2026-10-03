import { Card, DataTable } from "@negotiation-ring/design-system";
import { teamLabel, type Board, type BoardEggCard, type BoardOurEgg } from "../../model/index.js";

/** ASSUMPTION (same as src/state/world.ts): 15 eggs per persona until the API gives a figure. */
const EGGS_PER_PERSONA = 15;

const cardText = (c: BoardEggCard) => `${c.ref}${c.name ? ` «${c.name}»` : ""}${c.rarity ? ` · ${c.rarity}` : ""}`;

/**
 * «Our easter eggs» in our profile: each egg we found (persona, tick, our probe phrase that fired it, the prize: cards,
 * cash, packs and the badge of that tick); our badges, hidden cards (never sold) and gifts; and, per persona, every
 * find (who and when), the eggs left (15 per persona is an assumption) and our probes (sent / hit / miss).
 * Read-only; no figure is decided here.
 */

function prizeOf(e: BoardOurEgg): string {
  const p = e.prize;
  const parts = [
    ...p.cards.map((c) => `${cardText(c)}${c.print_run ? ` · run ${c.print_run}` : ""}${c.hidden ? " · hidden card (never sold)" : ""}`),
    ...(p.cash ? [`${p.cash} P`] : []),
    ...p.packs.map((x) => `pack ${x}`),
    ...p.badges.map((b) => `badge «${b}»`),
  ];
  return parts.join(" + ") || "—";
}

export function Eggs({ board, title }: { board: Board; title?: string }) {
  const eggs = board.eggs;
  if (!eggs) return null;
  const persona = (id: string) => eggs.personas.find((p) => p.persona === id);
  const hidden = (board.album?.pages ?? []).flatMap((pg) => (pg.shinies ?? []).filter((c) => c.hidden && c.held > 0));
  const badges = eggs.badges ?? [];
  const gifts = eggs.gifts ?? [];
  return (
    <Card title={title ?? `Our easter eggs · ${eggs.ours.length} found`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {eggs.ours.length ? (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {eggs.ours.map((e) => {
              const total = persona(e.persona)?.found.length ?? e.order;
              return (
                <li key={`${e.persona}-${e.tick}`} style={{ borderLeft: "4px solid var(--us)", paddingLeft: "var(--space-2)" }}>
                  <strong>{e.persona_name ?? e.persona}</strong> <span className="nr-muted">({e.persona}) · tick {e.tick} · find #{e.order} of {total} at this persona</span>
                  <br />
                  Probe: {e.probe ? <>«{e.probe.phrase}» <span className="nr-muted">(t{e.probe.tick})</span></> : <span className="nr-muted">none of ours in the 6 ticks before</span>}
                  <br />
                  Prize: <strong>{prizeOf(e)}</strong>
                  {e.prize.reason ? <span className="nr-muted">{` · ${e.prize.reason}`}</span> : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <span className="nr-muted">No eggs found yet.</span>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <span>
            <span className="nr-muted">Badges: </span>
            {badges.length ? badges.map((b) => `${b.badge} (t${b.tick})`).join(" · ") : "none"}
          </span>
          <span>
            <span className="nr-muted">Hidden cards held: </span>
            {hidden.length ? hidden.map((c) => `${c.ref}${c.name ? ` «${c.name}»` : ""} ×${c.held} · never sold`).join(" · ") : "none"}
          </span>
        </div>
        {gifts.length ? (
          <span>
            <span className="nr-muted">Gifts: </span>
            {gifts.map((g) => `t${g.tick} ${g.from ?? "?"} → ${[...g.cards.map(cardText), ...(g.cash ? [`${g.cash} P`] : []), ...g.packs.map((x) => `pack ${x}`)].join(" + ") || "—"}`).join(" · ")}
          </span>
        ) : null}
        <div style={{ overflowX: "auto" }}>
          <DataTable
            columns={[
              { key: "persona", label: "Persona" },
              { key: "finds", label: "Finds", numeric: true },
              { key: "left", label: "Left", numeric: true },
              { key: "who", label: "Found by (tick)" },
              { key: "probes", label: "Our probes" },
              { key: "last", label: "Our last probe" },
            ]}
            rows={eggs.personas.map((p) => ({
              persona: `${p.persona_name ?? p.persona}${p.persona_name ? ` (${p.persona})` : ""}`,
              finds: p.found.length,
              left: `${Math.max(0, EGGS_PER_PERSONA - p.found.length)}*`,
              who: p.found.length ? (
                <span>
                  {p.found.map((f, i) => (
                    <span key={`${f.team}-${f.tick}`} style={f.team === board.team ? { color: "var(--us)", fontWeight: 800 } : undefined}>
                      {i ? " · " : ""}
                      {teamLabel(board, f.team)} t{f.tick}
                    </span>
                  ))}
                </span>
              ) : (
                "—"
              ),
              probes: p.probes.sent ? `${p.probes.sent} sent · ${p.probes.hit} hit · ${p.probes.miss} miss` : "—",
              last: p.probes.last ? `«${p.probes.last.phrase}» t${p.probes.last.tick} · ${p.probes.last.result}` : "—",
            }))}
          />
        </div>
        <span className="nr-muted" style={{ fontSize: 11 }}>* assuming 15 eggs per persona (the API gives no figure). Eggs are prestige: they add no score.</span>
      </div>
    </Card>
  );
}
