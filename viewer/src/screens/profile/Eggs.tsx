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
  // One block per dealer: its eggs and gifts for us, by tick, in the order we first met it.
  const dealers: { id: string; name: string | null; eggs: typeof eggs.ours; gifts: typeof gifts }[] = [];
  const dealer = (id: string, name: string | null | undefined) => {
    let d = dealers.find((x) => x.id === id);
    if (!d) dealers.push((d = { id, name: name ?? persona(id)?.persona_name ?? null, eggs: [], gifts: [] }));
    d.name ??= name ?? null;
    return d;
  };
  for (const x of [...eggs.ours.map((e) => ({ tick: e.tick, e })), ...gifts.map((g) => ({ tick: g.tick, g }))].sort((a, b) => a.tick - b.tick)) {
    if ("e" in x) dealer(x.e.persona, x.e.persona_name).eggs.push(x.e);
    else dealer(x.g.from ?? "?", x.g.from_name).gifts.push(x.g);
  }
  return (
    <Card title={title ?? `Our easter eggs · ${eggs.ours.length} found · ${gifts.length} gifts`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {dealers.length ? (
          dealers.map((d) => {
            const info = persona(d.id);
            const fieldGifts = (eggs.gifts_by_persona ?? []).find((g) => g.persona === d.id);
            return (
              <section key={d.id} style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "baseline", flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 16 }}>{d.name ?? d.id}</strong>
                  <span className="nr-muted">
                    {[
                      `(${d.id})`,
                      `${d.eggs.length} egg${d.eggs.length === 1 ? "" : "s"} · ${d.gifts.length} gift${d.gifts.length === 1 ? "" : "s"} for us`,
                      info ? `${info.found.length} eggs found here by all teams` : null,
                      info?.probes.sent ? `our probes ${info.probes.sent} sent · ${info.probes.hit} hit` : null,
                      fieldGifts ? `gave ${fieldGifts.total} gifts to ${fieldGifts.teams} teams` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {[...d.eggs.map((e) => ({ tick: e.tick, egg: e, gift: null })), ...d.gifts.map((g) => ({ tick: g.tick, egg: null, gift: g }))]
                    .sort((a, b) => a.tick - b.tick)
                    .map(({ egg: e, gift: g }) =>
                      e ? (
                        <li key={`e-${e.tick}`} style={{ borderLeft: "4px solid var(--us)", paddingLeft: "var(--space-2)" }}>
                          <strong>Egg</strong> <span className="nr-muted">{`· tick ${e.tick} · find #${e.order} of ${info?.found.length ?? e.order} here`}</span>
                          <br />
                          Probe: {e.probe ? <>«{e.probe.phrase}» <span className="nr-muted">(t{e.probe.tick})</span></> : <span className="nr-muted">none of ours in the 6 ticks before</span>}
                          <br />
                          Prize: <strong>{prizeOf(e)}</strong>
                          {e.prize.reason ? <span className="nr-muted">{` · ${e.prize.reason}`}</span> : null}
                        </li>
                      ) : g ? (
                        <li key={`g-${g.tick}`} style={{ borderLeft: "4px solid var(--ok)", paddingLeft: "var(--space-2)" }}>
                          <strong>Gift</strong> <span className="nr-muted">{`· tick ${g.tick}`}</span>
                          <br />
                          <strong>{[...g.cards.map((c) => `${cardText(c)}${c.hidden ? " · hidden (never sold)" : ""}`), ...(g.cash ? [`${g.cash} P`] : []), ...g.packs.map((x) => `pack ${x}`)].join(" + ") || "—"}</strong>
                          {g.context ? (
                            <>
                              <br />
                              <span className="nr-muted">
                                {[
                                  g.context.thread !== null ? `while negotiating in thread #${g.context.thread}` : "while negotiating",
                                  g.context.our_offer ? `our offer t${g.context.our_tick ?? "?"}: ${g.context.our_offer}` : null,
                                  g.context.deal ? `deal t${g.context.deal.tick}: ${g.context.deal.refs.join(" + ") || "?"} at ${g.context.deal.price ?? "?"} P` : "no deal in the next ticks",
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </>
                          ) : null}
                        </li>
                      ) : null,
                    )}
                </ul>
              </section>
            );
          })
        ) : (
          <span className="nr-muted">No eggs or gifts yet.</span>
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
        {(eggs.gifts_by_persona ?? []).length ? (
          <span className="nr-muted">
            {`Gifts across the field: ${(eggs.gifts_by_persona ?? []).map((p) => `${p.persona} gave ${p.total} to ${p.teams} teams (${p.ours} to us)`).join(" · ")}`}
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
