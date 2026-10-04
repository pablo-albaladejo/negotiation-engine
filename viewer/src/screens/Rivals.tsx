import { Card, DataTable } from "@negotiation-ring/design-system";
import type { Board } from "../model/bazaarBoard.js";
import { teamLabel } from "../model/cockpit.js";
import type { GameModel, ModelRivalTeam, ModelRivals } from "../model/gameModel.js";
import { Sparkline } from "../ui/sparkline.js";
import { TeamName } from "./teams/TeamLink.js";
import { TickLink } from "./nav/Links.js";

const TeamList = ({ board, teams }: { board: Board; teams: string[] }) => (
  <span>
    {teams.map((t, i) => (
      <span key={t}>
        {i ? ", " : ""}
        <TeamName board={board} team={t} />
      </span>
    ))}
  </span>
);

/**
 * What each team holds and wants, estimated from public structure only (`GameState.rivals`): the opportunities
 * panel, the per-team cells of the «Teams» table and the collection detail of a team. Read-only: nothing here sends.
 */

const muted = { color: "var(--muted)" } as const;
const col = { display: "flex", flexDirection: "column", gap: "var(--space-3)" } as const;

/** One leaderboard field over time (rows without it are skipped). */
const series = (t: ModelRivalTeam, k: "score" | "rank" | "albumFilled"): number[] => (t.history ?? []).flatMap((h) => (typeof h[k] === "number" ? [h[k]] : []));


const closest = (t: ModelRivalTeam) => t.pages.filter((p) => p.have < p.of).sort((a, b) => a.of - a.have - (b.of - b.have))[0];

interface Opportunity {
  ref: string;
  held: number;
  wantedBy: string[];
  /** Teams this card would leave at most 2 cards from a page. */
  closesFor: string[];
}

/** Cards we hold that other teams asked for, or that bring a team within 2 cards of a page. */
function opportunities(r: ModelRivals, holdings: Record<string, number>): Opportunity[] {
  const out: Opportunity[] = [];
  for (const [ref, held] of Object.entries(holdings)) {
    if (held <= 0) continue;
    const wantedBy = r.byRef[ref]?.wantedBy ?? [];
    const closesFor = r.teams.filter((t) => t.pages.some((p) => p.missing.includes(ref) && p.of - p.have <= 2)).map((t) => t.team);
    if (wantedBy.length || closesFor.length) out.push({ ref, held, wantedBy, closesFor });
  }
  return out.sort((a, b) => b.closesFor.length - a.closesFor.length || b.wantedBy.length - a.wantedBy.length || a.ref.localeCompare(b.ref));
}

/** Our own cells: album and pages are exact (`/api/me`), not estimated from public structure. */
function ourCells(board: Board, r: ModelRivals) {
  const pages = (board.album?.pages ?? []).filter((p) => !p.complete).sort((a, b) => a.of - a.have - (b.of - b.have));
  const held = Object.entries(board.holdings).filter(([, n]) => n > 0);
  const p = pages[0];
  return {
    trend: (r.usHistory ?? []).flatMap((h) => (typeof h.score === "number" ? [h.score] : [])),
    page: p ? `${p.set} ${p.have}/${p.of}${p.of - p.have <= 3 ? ` · lacks ${p.missing.map((m) => m.ref).join(" ")}` : ""}` : "—",
    wants: pages.flatMap((pg) => pg.missing.map((m) => m.ref)).slice(0, 5).join(" ") || "—",
    // Holdings include the copy in the album: a spare is any extra copy.
    spares: held.filter(([, n]) => n > 1).map(([ref]) => ref).join(" ") || "—",
  };
}

export function TeamDetail({ board, t }: { board: Board; t: ModelRivalTeam }) {
  return (
    <div style={col}>
      <span style={muted}>
        {teamLabel(board, t.team)} · {t.distinct} distinct cards seen ({t.seen.length} copies)
        {t.board ? ` · album ${t.board.albumFilled ?? "?"}/${t.board.albumSlots ?? "?"} at tick ${t.board.tick}` : " · no leaderboard row yet"}
        {t.unseen !== undefined ? ` · ${t.unseen} album cards not seen` : ""}
      </span>
      {t.pages.length > 0 ? (
        <DataTable
          columns={[
            { key: "set", label: "Page" },
            { key: "have", label: "Seen", numeric: true },
            { key: "missing", label: "Not seen with them" },
          ]}
          rows={t.pages.map((p) => ({ set: p.set, have: `${p.have}/${p.of}`, missing: p.missing.join(" ") || "—" }))}
        />
      ) : null}
      {(t.history?.length ?? 0) > 1 ? (
        <span style={muted}>
          Since tick {t.history![0]!.tick}: score <Sparkline values={series(t, "score")} label={`${t.team} score`} /> · rank{" "}
          <Sparkline values={series(t, "rank").map((r) => -r)} label={`${t.team} rank (higher is better)`} /> · album <Sparkline values={series(t, "albumFilled")} label={`${t.team} album`} />
        </span>
      ) : null}
      <DataTable
        columns={[
          { key: "ref", label: "Card seen" },
          { key: "source", label: "How" },
          { key: "tick", label: "Tick", numeric: true },
          { key: "confirmed", label: "Still theirs at", numeric: true },
        ]}
        rows={t.seen.map((s) => ({ ref: s.ref, source: s.source, tick: <TickLink tick={s.tick} prefix="" />, confirmed: s.confirmedTick !== undefined && s.confirmedTick !== null ? <TickLink tick={s.confirmedTick} prefix="" /> : "—" }))}
      />
    </div>
  );
}

/** Public-structure cells of one team for the «Teams» table: score trend, closest page, wants and spares. */
export function rivalCells(board: Board, r: ModelRivals | undefined, team: string): { trend: number[]; page: string; wants: string; spares: string } | null {
  if (team === board.team) return r ? ourCells(board, r) : null;
  const t = r?.teams.find((x) => x.team === team);
  if (!t) return null;
  const p = closest(t);
  return {
    trend: series(t, "score"),
    page: p ? `${p.set} ${p.have}/${p.of}${p.of - p.have <= 3 ? ` · lacks ${p.missing.join(" ")}` : ""}` : "—",
    wants: t.wants.slice(0, 5).map((w) => w.ref).join(" ") || "—",
    spares: t.spares.join(" ") || "—",
  };
}

/** Opportunities: cards we hold that other teams want or that bring them close to a page. */
export function Rivals({ model, board }: { model: GameModel; board: Board }) {
  const r = model.state?.rivals;
  if (!r) {
    return (
      <Card title="Opportunities">
        <span style={muted}>Not in this model yet (the viewer server predates `GameState.rivals`, or it failed this tick).</span>
      </Card>
    );
  }
  const opps = opportunities(r, board.holdings);
  return (
    <Card title={`Opportunities · cards we hold that others want (${opps.length})`}>
      <div style={col}>
        <span style={muted}>
          Public structure only ({r.seenAssets} cards located across {r.teams.length} teams): a card is seen with a team when it receives it in a settlement, offers it or gets it from a
          pack; a want is a card it asked for and has not been seen getting since.
        </span>
        {opps.length > 0 ? (
          <DataTable
            columns={[
              { key: "ref", label: "Card" },
              { key: "held", label: "We hold", numeric: true },
              { key: "closes", label: "Leaves them ≤ 2 from a page" },
              { key: "wanted", label: "Asked for it" },
            ]}
            rows={opps.map((o) => ({
              ref: o.ref,
              held: o.held,
              closes: o.closesFor.length ? <TeamList board={board} teams={o.closesFor} /> : "—",
              wanted: o.wantedBy.length ? <TeamList board={board} teams={o.wantedBy} /> : "—",
            }))}
          />
        ) : (
          <span style={muted}>None of our cards is wanted by another team right now.</span>
        )}
      </div>
    </Card>
  );
}
