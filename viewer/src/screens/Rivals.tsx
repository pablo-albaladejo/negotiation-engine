import { Card, DataTable } from "@negotiation-ring/design-system";
import { useId, useState } from "react";
import type { Board } from "../model/bazaarBoard.js";
import { teamLabel } from "../model/cockpit.js";
import type { GameModel, ModelRivalTeam, ModelRivals } from "../model/gameModel.js";

/**
 * «Other teams»: what each team holds and wants, estimated from public structure only (`GameState.rivals`).
 * Opportunities first (cards we hold that someone wants or that close a page for them), then one row per team
 * and the detail of the chosen one. Read-only: nothing here sends an offer.
 */

const muted = { color: "var(--muted)" } as const;
const col = { display: "flex", flexDirection: "column", gap: "var(--space-3)" } as const;

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

function TeamDetail({ board, t }: { board: Board; t: ModelRivalTeam }) {
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
      <DataTable
        columns={[
          { key: "ref", label: "Card seen" },
          { key: "source", label: "How" },
          { key: "tick", label: "Tick", numeric: true },
        ]}
        rows={t.seen.map((s) => ({ ref: s.ref, source: s.source, tick: s.tick }))}
      />
    </div>
  );
}

export function Rivals({ model, board }: { model: GameModel; board: Board }) {
  const r = model.state?.rivals;
  const pickId = useId();
  const [picked, setPicked] = useState("");
  if (!r) {
    return (
      <Card title="Other teams">
        <span style={muted}>Not in this model yet (the viewer server predates `GameState.rivals`, or it failed this tick).</span>
      </Card>
    );
  }
  const opps = opportunities(r, board.holdings);
  const teams = [...r.teams].sort((a, b) => (a.board?.rank ?? 99) - (b.board?.rank ?? 99) || a.team.localeCompare(b.team));
  const detail = teams.find((t) => t.team === picked);
  return (
    <Card title={`Other teams · collections (${r.teams.length} teams · ${r.seenAssets} cards located)`}>
      <div style={col}>
        <span style={muted}>
          Public structure only: a card is seen with a team when it receives it in a settlement, offers it or gets it from a pack; a want is a card it asked for and has not been seen
          getting since. The leaderboard bounds each album; «not seen» is what we cannot place yet.
        </span>
        <strong>Opportunities · cards we hold that others want ({opps.length})</strong>
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
              closes: o.closesFor.map((t) => teamLabel(board, t)).join(", ") || "—",
              wanted: o.wantedBy.map((t) => teamLabel(board, t)).join(", ") || "—",
            }))}
          />
        ) : (
          <span style={muted}>None of our cards is wanted by another team right now.</span>
        )}
        <strong>Teams</strong>
        <DataTable
          columns={[
            { key: "team", label: "Team" },
            { key: "rank", label: "Rank", numeric: true },
            { key: "album", label: "Album", numeric: true },
            { key: "seen", label: "Seen", numeric: true },
            { key: "unseen", label: "Not seen", numeric: true },
            { key: "page", label: "Closest page" },
            { key: "wants", label: "Wants" },
            { key: "spares", label: "Spares" },
          ]}
          rows={teams.map((t) => {
            const p = closest(t);
            return {
              team: teamLabel(board, t.team),
              rank: t.board?.rank ?? "—",
              album: t.board ? `${t.board.albumFilled ?? "?"}/${t.board.albumSlots ?? "?"}` : "—",
              seen: t.distinct,
              unseen: t.unseen ?? "—",
              page: p ? `${p.set} ${p.have}/${p.of}${p.of - p.have <= 3 ? ` · lacks ${p.missing.join(" ")}` : ""}` : "—",
              wants: t.wants.slice(0, 5).map((w) => w.ref).join(" ") || "—",
              spares: t.spares.join(" ") || "—",
            };
          })}
          onRowClick={(i) => setPicked(teams[i]?.team === picked ? "" : (teams[i]?.team ?? ""))}
          {...(detail ? { selectedRowIndex: teams.indexOf(detail) } : {})}
        />
        <div className="nr-filter-field">
          <label className="nr-muted nr-filter-label" htmlFor={pickId}>
            Team detail
          </label>
          <select id={pickId} className="nr-filter-select" value={picked} onChange={(e) => setPicked(e.target.value)}>
            <option value="">Pick a team (or click its row)</option>
            {teams.map((t) => (
              <option key={t.team} value={t.team}>
                {teamLabel(board, t.team)}
              </option>
            ))}
          </select>
        </div>
        {detail ? <TeamDetail board={board} t={detail} /> : null}
      </div>
    </Card>
  );
}
