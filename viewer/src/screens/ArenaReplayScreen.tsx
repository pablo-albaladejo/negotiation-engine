import {
  Card,
  ChatMessage,
  DataTable,
  type DataTableColumn,
  type DataTableRow,
  Flag,
  KpiStrip,
  Legend,
  OfferChart,
  formatNumber,
} from "@negotiation-ring/design-system";
import { useState } from "react";
import type { ArenaReplayModel } from "../model/index.js";
import { offerDomain, toOfferPoints } from "../ui/chart.js";
import { offerLabel, offerValue } from "../ui/offer.js";
import { EmptyZopaBanner, ProtocolBreakBanner, TemplateBanner } from "../ui/states.js";

const DECISION_COLUMNS: DataTableColumn[] = [
  { key: "k", label: "Turn step" },
  { key: "v", label: "Engine log" },
];

const pct = (v: number | null): string => (v === null ? "not logged" : `${formatNumber(v * 100, { locale: "en", decimals: 1 })}%`);

export interface ArenaReplayScreenProps {
  runId: string;
  model: ArenaReplayModel;
  onBack: () => void;
}

/** P3: replay de una partida de arena, con el chart, el chat y el panel de decisión por ronda. */
export function ArenaReplayScreen({ runId, model, onBack }: ArenaReplayScreenProps) {
  const lastRound = model.game.rounds || 1;
  const [selectedRound, setSelectedRound] = useState(lastRound);

  const ourOffers = toOfferPoints(model.offers.ours);
  const theirOffers = toOfferPoints(model.offers.rival);
  const target = model.explain.map((e) => ({ round: e.round, value: e.target }));
  const estimate = model.explain.flatMap((e) => {
    const value = offerValue(e.rivalReserveEstimate);
    return value === null ? [] : [{ round: e.round, value }];
  });
  const ourReserve = offerValue(model.reserves?.ours) ?? undefined;
  const theirReserve = offerValue(model.reserves?.rival) ?? undefined;
  const yDomain = offerDomain([
    ...ourOffers.map((p) => p.value),
    ...theirOffers.map((p) => p.value),
    ...target.map((p) => p.value),
    ...estimate.map((p) => p.value),
    ourReserve,
    theirReserve,
  ]);
  const injectionRounds = model.rounds?.filter((p) => p.parser?.injectionSuspected).map((p) => p.round) ?? [];
  const end =
    model.game.endReason === "agreement"
      ? { round: lastRound, kind: "deal" as const, label: "Deal" }
      : model.game.endReason === "agent-walk" || model.game.endReason === "rival-walk"
        ? { round: lastRound, kind: "walk" as const, label: "Walk" }
        : undefined;

  const panel = model.rounds?.find((p) => p.round === selectedRound) ?? null;
  const decisionRows: DataTableRow[] = panel
    ? [
        { k: "Rule", v: panel.decision?.rule ?? "not logged" },
        { k: "Target (Boulware curve)", v: panel.explain ? formatNumber(panel.explain.target, { locale: "en", decimals: 3 }) : "not logged" },
        { k: "Step vs previous round", v: panel.explain ? (panel.explain.step === null ? "n/a" : formatNumber(panel.explain.step, { locale: "en", decimals: 3 })) : "not logged" },
        {
          k: "AC_next",
          v: (
            <>
              {panel.explain ? (panel.explain.acNext ? "accept" : "no accept") : "not logged"} <Flag kind={panel.explain?.acNext ? "decision" : "neutral"}>{panel.explain ? (panel.explain.acNext ? "accept" : "no accept") : "not logged"}</Flag>
            </>
          ),
        },
        { k: "AC_time", v: panel.explain ? panel.explain.acTime : "not logged" },
        { k: "Quarantined parser", v: panel.parser ? `${panel.parser.intent}${panel.parser.injectionSuspected ? " · injection" : ""}` : "not logged" },
        { k: "Validator", v: panel.validator ? JSON.stringify(panel.validator) : "not logged" },
        { k: "Latencies", v: panel.boxes.length > 0 ? panel.boxes.map((b) => `${b.box} ${b.latencyMs} ms`).join(" · ") : "not logged" },
      ]
    : [];

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <button type="button" onClick={onBack}>
          ← Matches in {runId}
        </button>
        <h2 className="nr-heading">
          {model.game.gameId} · vs {model.game.rival}
        </h2>
      </div>
      <KpiStrip
        items={[
          { label: "Result", value: model.game.endReason },
          { label: "Surplus", value: pct(model.game.surplusShare) },
          { label: "Rounds", value: model.game.roundLimit !== null ? `${model.game.rounds} / ${model.game.roundLimit}` : String(model.game.rounds) },
          { label: "ZOPA", value: model.game.zopaEmpty ? "empty" : "open" },
        ]}
      />
      {model.game.endReason === "rival-error" || model.game.endReason === "protocol-violation" ? (
        <ProtocolBreakBanner round={model.game.rounds} detail={model.game.error ?? `${model.game.endReason} (no detail logged)`} />
      ) : null}
      {model.game.zopaEmpty && model.reserves ? (
        <EmptyZopaBanner ours={offerLabel(model.reserves.ours)} rival={offerLabel(model.reserves.rival)} walked={model.game.endReason === "agent-walk"} />
      ) : null}
      {model.game.templateCount > 0 ? <TemplateBanner templateCount={model.game.templateCount} ourMessageCount={model.game.ourMessageCount} provider={model.provider} /> : null}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(320px, 1fr)", gap: "var(--space-4)", alignItems: "start" }}>
        <Card title="Offers by round">
          <OfferChart
            rounds={model.game.roundLimit ?? model.game.rounds}
            yDomain={yDomain}
            ourOffers={ourOffers}
            theirOffers={theirOffers}
            target={target}
            estimate={estimate}
            {...(ourReserve !== undefined ? { ourReserve } : {})}
            {...(theirReserve !== undefined ? { theirReserve } : {})}
            zopa={model.reserves !== null}
            injectionRounds={injectionRounds}
            {...(end ? { end } : {})}
            onPointClick={(point) => setSelectedRound(point.round)}
          />
          <Legend>
            <span>Our offers</span>
            <span>Opponent offers</span>
            <span>Target curve</span>
            <span>Estimate of their reserve</span>
            <span>Our reserve</span>
            <span>Their reserve</span>
            <span>ZOPA</span>
          </Legend>
        </Card>
        <Card title="Messages">
          <div className="nr-chat">
            {model.chat.map((c, i) => (
              <ChatMessage
                key={i}
                side={c.from === "agent" ? "us" : "them"}
                round={c.round}
                {...(offerValue(c.offer) !== null ? { offer: offerValue(c.offer)! } : {})}
                text={c.text}
                {...(c.from === "agent" && model.rounds?.find((p) => p.round === c.round)?.template ? { flags: [{ kind: "fallback" as const, label: "template" }] } : {})}
                highlighted={c.round === selectedRound}
              />
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
          <h3 className="nr-heading">Engine decision this round</h3>
          <span className="nr-cfg">
            R{selectedRound} / {model.game.rounds}
          </span>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button type="button" onClick={() => setSelectedRound((r) => Math.max(1, r - 1))}>
              ← Previous round
            </button>
            <button type="button" onClick={() => setSelectedRound((r) => Math.min(model.game.rounds, r + 1))}>
              Next round →
            </button>
          </div>
        </div>
        {model.hasTrace ? (
          <DataTable columns={DECISION_COLUMNS} rows={decisionRows} />
        ) : (
          <p className="nr-muted">No trace recorded for this match (played with --no-traces or --agent-url).</p>
        )}
      </Card>
    </section>
  );
}
