import {
  Card,
  DataTable,
  type DataTableColumn,
  type DataTableRow,
  KpiStrip,
  Legend,
  OfferChart,
  Scatter2D,
  type Scatter2DRegion,
  formatNumber,
} from "@negotiation-ring/design-system";
import { useState } from "react";
import type { Offer, TwoIssueModel } from "../model/index.js";
import { offerDomain } from "../ui/chart.js";
import { gridCols } from "../ui/grid.js";
import { resultLabel } from "../ui/labels.js";
import { ReplayHeader } from "../ui/replay-header.js";

const COLUMNS: DataTableColumn[] = [
  { key: "r", label: "Round" },
  { key: "us", label: "Our offer" },
  { key: "uu", label: "Utility", numeric: true },
  { key: "th", label: "Their offer (bound this turn)" },
  { key: "tu", label: "Utility", numeric: true },
];

const num = (v: number): string => formatNumber(v, { locale: "en" });
const utility = (v: number | null): string => (v === null ? "not logged" : formatNumber(v, { locale: "en", decimals: 2 }));
const dec = (v: number | null): string => (v === null ? "not logged" : formatNumber(v, { locale: "en", decimals: 2 }));

export interface TwoIssueScreenProps {
  runId: string;
  model: TwoIssueModel;
  onBack: () => void;
  games?: Array<{ gameId: string }>;
  onSelectGame?: (gameId: string) => void;
}

/** P5: partida de 2 issues en el plano, utilidades por ronda tal como las registró el motor y tabla de ofertas. */
export function TwoIssueScreen({ runId, model, onBack, games, onSelectGame }: TwoIssueScreenProps) {
  const { x, y } = model.axes;
  const [selectedRound, setSelectedRound] = useState(model.game.rounds || 1);
  const selectPoint = (point: { round: number }) => setSelectedRound(point.round);
  const value = (offer: Offer, key: string): string => (offer[key] === undefined ? "not logged" : num(offer[key]!));
  const fmtOffer = (offer: Offer | null): string => (offer ? `${y.name} ${value(offer, y.name)} · ${x.name} ${value(offer, x.name)}` : "not logged");
  const all = [...model.offers.ours, ...model.offers.rival];
  const xDomain: [number, number] = x.issue ? [x.issue.min, x.issue.max] : offerDomain(all.map((p) => p.x));
  const yDomain: [number, number] = y.issue ? [y.issue.min, y.issue.max] : offerDomain(all.map((p) => p.y));
  const region = model.mandate?.region ?? null;
  const mandate: Scatter2DRegion | undefined = region
    ? {
        label: "Mandate",
        points: [
          { x: region.x[0], y: region.y[0] },
          { x: region.x[1], y: region.y[0] },
          { x: region.x[1], y: region.y[1] },
          { x: region.x[0], y: region.y[1] },
        ],
      }
    : undefined;
  const agreement = model.game.agreement;
  const deal =
    agreement && agreement[x.name] !== undefined && agreement[y.name] !== undefined
      ? { x: agreement[x.name]!, y: agreement[y.name]!, label: "Deal" }
      : undefined;
  const lastRound = model.game.rounds || 1;
  const end =
    model.game.endReason === "agreement"
      ? { round: lastRound, kind: "deal" as const, label: "Deal" }
      : model.game.endReason === "agent-walk" || model.game.endReason === "rival-walk"
        ? { round: lastRound, kind: "walk" as const, label: "Walk" }
        : undefined;
  const result = resultLabel(model.game.endReason, model.game.protocolViolationBy);
  const rows: DataTableRow[] = (model.rows ?? []).map((r) => ({
    r: `R${r.round}`,
    us: fmtOffer(r.ours),
    uu: utility(r.uOffer),
    th: fmtOffer(r.rival),
    tu: utility(r.uRival),
  }));

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <ReplayHeader
          onBack={onBack}
          backLabel="← Matches"
          gameId={model.game.gameId}
          rival={model.game.rival}
          {...(games ? { games } : {})}
          {...(onSelectGame ? { onSelectGame } : {})}
        />
        <span className="nr-muted">
          {model.game.role} · {y.name} and {x.name}
          {model.game.roundLimit !== null ? ` · T=${model.game.roundLimit}` : ""}
        </span>
        <span className="nr-cfg">
          <span>config v{model.configVersion !== null ? model.configVersion : "not logged"}</span>
          {" · "}
          <span>utility: not logged</span>
          {" · "}
          <span>
            {model.mandate
              ? `mandate: ${Object.entries(model.mandate.reservation)
                  .map(([k, v]) => `${k} ${num(v)}`)
                  .join(" · ")}`
              : "mandate: not logged"}
          </span>
        </span>
      </div>
      <KpiStrip
        items={[
          {
            label: "Outcome",
            value: result.label,
            ...(result.tone ? { tone: result.tone } : {}),
          },
          { label: "Agreement", value: agreement ? fmtOffer(agreement) : "none" },
          { label: "Surplus / ZOPA", value: dec(model.game.surplusShare) },
          { label: "Rounds", value: model.game.roundLimit !== null ? `${model.game.rounds} / ${model.game.roundLimit}` : String(model.game.rounds) },
          { label: "Role", value: model.game.role },
        ]}
      />
      <div className="nr-grid" style={gridCols("minmax(0, 1.3fr) minmax(0, 1fr)")}>
        <Card title={`Offers on the ${y.name} × ${x.name} plane`}>
          <Scatter2D
            xDomain={xDomain}
            yDomain={yDomain}
            xLabel={x.name}
            yLabel={y.name}
            ourOffers={model.offers.ours}
            theirOffers={model.offers.rival}
            {...(mandate ? { mandate } : {})}
            {...(deal ? { deal } : {})}
            onPointClick={selectPoint}
          />
          <Legend>
            <span>Our offers</span>
            <span>Opponent offers</span>
            <span>Same round</span>
            {mandate ? <span>Mandate</span> : null}
          </Legend>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", minWidth: 0 }}>
          <Card title="Utility by round" caption="Our utility × 100 as logged by the engine, for our offer and the opponent's.">
            {model.hasExplain ? (
              <OfferChart
                rounds={model.game.roundLimit ?? model.game.rounds}
                yDomain={[0, 100]}
                ourOffers={model.utilities.map((u) => ({ round: u.round, value: u.uOffer * 100 }))}
                theirOffers={model.utilities.flatMap((u) => (u.uRival === null ? [] : [{ round: u.round, value: u.uRival * 100 }]))}
                {...(end ? { end } : {})}
                onPointClick={selectPoint}
              />
            ) : (
              <p className="nr-muted">Utilities not logged (trace without engine explain).</p>
            )}
          </Card>
          <Card title="Logged offers">
            {model.hasTrace ? (
              <DataTable columns={COLUMNS} rows={rows} selectedRowIndex={(model.rows ?? []).findIndex((r) => r.round === selectedRound)} />
            ) : (
              <p className="nr-muted">No trace recorded for this match (played with --no-traces or --agent-url).</p>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
