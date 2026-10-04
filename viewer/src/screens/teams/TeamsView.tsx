import { Card, DataTable, TableLink } from "@negotiation-ring/design-system";
import { KIND_LABEL, teamLabel, type Board, type BoardRow } from "../../model/index.js";
import type { GameModel } from "../../model/gameModel.js";
import { Fold } from "../../ui/fold.js";
import { Sparkline } from "../../ui/sparkline.js";
import { Rivals, TeamDetail } from "../Rivals.js";
import { TeamName } from "./TeamLink.js";

/**
 * «Teams» tab: everything we know about each team in one place. The leaderboard as a picker; for the picked team its
 * score parts, what we did with it (trades, offers, duels: each opens its conversation), its trades with other teams,
 * the eggs it found and its collection as public structure shows it; then the opportunities and collections of every
 * team. Any team name in the viewer (`TeamName`) opens this tab on that team. Read-only: nothing here sends.
 */

const col = { display: "flex", flexDirection: "column", gap: "var(--space-3)" } as const;
const n = (x: number | null | undefined, d = 0) => (x === null || x === undefined ? "—" : x.toFixed(d));

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "var(--space-2) var(--space-3)", border: "1px solid var(--line)", borderRadius: 10, minWidth: 96 }}>
      <span className="nr-muted" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </span>
      <strong style={{ fontSize: 18 }}>{value}</strong>
    </div>
  );
}

const involves = (r: BoardRow, team: string) => r.counterparty === team || (r.parties ?? []).includes(team) || r.offers.some((o) => o.maker === team);

function TeamProfile({ board, model, team, onOpen }: { board: Board; model: GameModel | null; team: string; onOpen: (id: string) => void }) {
  const lb = board.market.leaderboard.find((t) => t.team === team);
  const rival = model?.state?.rivals?.teams.find((t) => t.team === team);
  const ours = board.rows.filter((r) => involves(r, team));
  const others = board.others.filter((r) => involves(r, team));
  const eggs = (board.eggs?.personas ?? []).flatMap((p) => p.found.filter((f) => f.team === team).map((f) => ({ persona: p.persona_name ?? p.persona, tick: f.tick, name: f.name })));
  const history = (rival?.history ?? []).flatMap((h) => (typeof h.score === "number" ? [h.score] : []));
  const dealRow = (r: BoardRow) => ({
    tick: r.tick_settled ?? r.tick_opened ?? "—",
    what: (
      <TableLink aria-label={`Open ${r.id}`} onClick={() => onOpen(r.id)}>
        {KIND_LABEL[r.kind] ?? r.kind}
      </TableLink>
    ),
    item: r.item || "—",
    price: r.price ?? "—",
    status: r.status,
  });
  const columns = [
    { key: "tick", label: "Tick", numeric: true },
    { key: "what", label: "What" },
    { key: "item", label: "Item" },
    { key: "price", label: "Price", numeric: true },
    { key: "status", label: "Status" },
  ];
  return (
    <Card title={`${teamLabel(board, team)}${lb?.rank != null ? ` · #${lb.rank}` : ""}`}>
      <div style={col}>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <Stat label="Rank" value={lb?.rank !== null && lb?.rank !== undefined ? `#${lb.rank}` : "—"} />
          <Stat label="Score" value={n(lb?.score, 1)} />
          <Stat label="Negotiating" value={n(lb?.negotiating, 1)} />
          <Stat label="Market" value={n(lb?.market, 1)} />
          <Stat label="Album" value={lb ? `${lb.album_filled ?? "?"}/${lb.album_slots ?? "?"}` : "—"} />
          <Stat label="Pages ★" value={n(lb?.pages_complete)} />
          <Stat label="Level" value={n(lb?.level)} />
          <Stat label="Deals" value={n(lb?.deals)} />
        </div>
        {history.length > 1 ? (
          <span className="nr-muted">
            Score over time <Sparkline values={history} label={`${team} score`} />
          </span>
        ) : null}
        <strong>{`With us · ${ours.length}`}</strong>
        {ours.length ? <DataTable columns={columns} rows={ours.map(dealRow)} /> : <span className="nr-muted">No trades, offers or duels with us yet.</span>}
        {others.length ? (
          <Fold title={`With other teams · ${others.length}`}>
          <DataTable
            columns={[{ key: "with", label: "With" }, ...columns]}
            rows={others.map((r) => {
              const other = (r.parties ?? [r.counterparty]).find((p) => p !== team) ?? r.counterparty;
              return { with: <TeamName board={board} team={other} />, ...dealRow(r) };
            })}
          />
          </Fold>
        ) : (
          <span className="nr-muted">No trades with other teams seen.</span>
        )}
        <strong>{`Easter eggs found · ${eggs.length}`}</strong>
        <span>{eggs.length ? eggs.map((e) => `${e.persona} t${e.tick}`).join(" · ") : <span className="nr-muted">none seen</span>}</span>
        <strong>Collection (public structure)</strong>
        {rival ? <TeamDetail board={board} t={rival} /> : <span className="nr-muted">{model ? "Not located yet in GameState.rivals." : "Loading our model…"}</span>}
      </div>
    </Card>
  );
}

export function TeamsView({ board, model, team, onPick, onOpen }: { board: Board; model: GameModel | null; team: string; onPick: (team: string) => void; onOpen: (id: string) => void }) {
  const teams = [...board.market.leaderboard].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  const picked = team || teams.find((t) => !t.us)?.team || "";
  return (
    <div style={col}>
      <Card title={`Teams · ${teams.length}`}>
        <DataTable
          columns={[
            { key: "rank", label: "#", numeric: true },
            { key: "team", label: "Team" },
            { key: "score", label: "Score", numeric: true },
            { key: "neg", label: "Negotiating", numeric: true },
            { key: "market", label: "Market", numeric: true },
            { key: "album", label: "Album" },
            { key: "pages", label: "★", numeric: true },
            { key: "deals", label: "Deals", numeric: true },
          ]}
          rows={teams.map((t) => ({
            rank: t.rank ?? "—",
            team: <TeamName board={board} team={t.team} />,
            score: n(t.score, 1),
            neg: n(t.negotiating, 1),
            market: n(t.market, 1),
            album: `${t.album_filled ?? "?"}/${t.album_slots ?? "?"}`,
            pages: n(t.pages_complete),
            deals: n(t.deals),
          }))}
          onRowClick={(i) => {
            const t = teams[i];
            if (t) onPick(t.team);
          }}
          {...(teams.some((t) => t.team === picked) ? { selectedRowIndex: teams.findIndex((t) => t.team === picked) } : {})}
        />
      </Card>
      {picked ? <TeamProfile board={board} model={model} team={picked} onOpen={onOpen} /> : null}
      {model?.available ? <Rivals model={model} board={board} picked={picked} onPick={onPick} /> : null}
    </div>
  );
}
