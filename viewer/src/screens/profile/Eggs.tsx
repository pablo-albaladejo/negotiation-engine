import { Card, DataTable } from "@negotiation-ring/design-system";
import { teamLabel, type Board, type BoardEggCard, type BoardEggFlow, type BoardEggPlanRow, type BoardOurEgg } from "../../model/index.js";

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

/**
 * What we did to get the egg, step by step: the thread we opened ("buy pack sobre_barrio from abuela"), each message up
 * to the egg (what we said and offered; the dealer's offer, and its reply on the egg tick) and how the thread ended.
 */
function EggFlowSteps({ flow, persona, eggTick }: { flow: BoardEggFlow; persona: string; eggTick: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: "var(--space-1)" }}>
      <span>
        <span className="nr-muted">Flow: </span>
        {`${flow.topic ? `${flow.topic} from ${persona}` : `thread with ${persona}`}${flow.thread !== null ? ` · thread #${flow.thread}` : ""}`}
      </span>
      <ol style={{ margin: 0, paddingLeft: "var(--space-4, 20px)", display: "flex", flexDirection: "column", gap: 2 }}>
        {flow.steps.map((s, i) => (
          <li key={`${s.tick}-${i}`} style={s.tick === eggTick && s.who === "dealer" ? { color: "var(--ok)" } : undefined}>
            <span className="nr-muted">{`t${s.tick} · `}</span>
            <strong>{s.who === "us" ? "we" : persona}</strong>
            {s.offer ? ` ${s.offer}` : s.who === "us" ? " write" : " replies"}
            {s.text ? <>{s.offer ? ", saying " : " "}«{s.text}»</> : null}
            {s.tick === eggTick && s.who === "dealer" ? <strong>{" → egg"}</strong> : null}
          </li>
        ))}
      </ol>
      <span>
        <span className="nr-muted">Outcome: </span>
        {flow.outcome}
      </span>
    </div>
  );
}

const ROUTE_TEXT: Record<BoardEggPlanRow["route"], string> = { play: "inside play", manual: "manual (probe.sh)", excluded: "excluded" };

function planStatus(r: BoardEggPlanRow) {
  const color = r.status === "hit" ? "var(--ok)" : r.status === "miss" || r.status === "excluded" ? "var(--muted, inherit)" : r.status === "sent" ? "var(--us)" : undefined;
  const text =
    r.status === "hit" ? `hit t${r.hitTick ?? "?"}` : r.status === "miss" ? `miss (sent t${r.sentTick ?? "?"})` : r.status === "sent" ? `sent t${r.sentTick ?? "?"}` : r.status === "pending" && r.nextAllowedTick !== undefined ? `pending · not before t${r.nextAllowedTick}` : r.status;
  return <span style={{ color, fontWeight: r.status === "hit" ? 800 : undefined }}>{text}</span>;
}

/** Sunday's approved egg probe plan: one card per probe, the literal phrase big, then odds, prize, cost and status. */
function EggPlan({ rows }: { rows: BoardEggPlanRow[] }) {
  const fact = (label: string, value: string) => (
    <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      <span className="nr-muted" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </span>
      <span>{value || "—"}</span>
    </span>
  );
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <strong style={{ fontSize: 16 }}>Probe plan</strong>
      <span className="nr-muted" style={{ fontSize: 12 }}>
        We send the phrase to the dealer; if our message contains it literally (accents and case ignored), the egg fires. At least 5 ticks between probes to the same dealer.
      </span>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {rows.map((r) => (
          <li
            key={`${r.n}-${r.persona}-${r.key}`}
            style={{
              border: "1px solid var(--line)",
              borderLeft: `4px solid ${r.status === "hit" ? "var(--ok)" : r.status === "sent" ? "var(--us)" : "var(--line)"}`,
              borderRadius: 8,
              padding: "var(--space-2) var(--space-3)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-1)",
              opacity: r.status === "excluded" || r.status === "miss" ? 0.6 : 1,
            }}
          >
            <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "baseline", flexWrap: "wrap" }}>
              <strong>{`${r.n ? `#${r.n} · ` : ""}${r.persona}`}</strong>
              <span className="nr-muted" style={{ fontSize: 12 }}>
                {ROUTE_TEXT[r.route]}
              </span>
              <span style={{ marginLeft: "auto" }}>{planStatus(r)}</span>
            </div>
            <span style={{ fontSize: 15, fontStyle: "italic" }}>«{r.line}»</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "var(--space-1) var(--space-3)", fontSize: 13 }}>
              {fact("Odds", r.odds)}
              {fact("We could win", r.stake)}
              {fact("Cost", r.cost)}
            </div>
            {r.note ? (
              <span className="nr-muted" style={{ fontSize: 12 }}>
                {r.note}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
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
        {eggs.plan?.length ? <EggPlan rows={eggs.plan} /> : null}
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
                          {e.flow ? <EggFlowSteps flow={e.flow} persona={e.persona_name ?? e.persona} eggTick={e.tick} /> : null}
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
