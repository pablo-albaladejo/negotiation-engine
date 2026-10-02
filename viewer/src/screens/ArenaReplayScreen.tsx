import {
  Card,
  ChatMessage,
  DataTable,
  type DataTableColumn,
  type DataTableRow,
  KpiStrip,
  Legend,
  OfferChart,
  Pill,
  formatNumber,
} from "@negotiation-ring/design-system";
import React, { useEffect, useState } from "react";
import type { ArenaReplayModel } from "../model/index.js";
import { offerDomain, toOfferPoints, toTargetOfferPoints } from "../ui/chart.js";
import { nameLatencySteps } from "../ui/decision.js";
import { resultLabel, zopaKpi } from "../ui/labels.js";
import { offerLabel, offerValue } from "../ui/offer.js";
import { EmptyZopaBanner, ProtocolBreakBanner, TemplateBanner } from "../ui/states.js";
import { SecondaryButton } from "../ui/buttons.js";
import { ReplayHeader } from "../ui/replay-header.js";

/** P3: una entrada por paso, con nombre único cuando una caja corrió más de una vez; los pasos de 0 ms quedan tras "show all". */
function LatencyList({ boxes }: { boxes: readonly { box: string; latencyMs: number }[] }) {
  const [showAll, setShowAll] = useState(false);
  const steps = nameLatencySteps(boxes);
  const hiddenCount = steps.filter((s) => s.latencyMs === 0).length;
  const shown = showAll ? steps : steps.filter((s) => s.latencyMs > 0);
  return (
    <span>
      {shown.map((s) => `${s.name} ${s.latencyMs} ms`).join(" · ")}
      {hiddenCount > 0 ? (
        <SecondaryButton style={{ marginLeft: "var(--space-2)" }} onClick={() => setShowAll((v) => !v)}>
          {showAll ? "hide 0 ms steps" : `show all (+${hiddenCount})`}
        </SecondaryButton>
      ) : null}
    </span>
  );
}

const DECISION_COLUMNS: DataTableColumn[] = [
  { key: "k", label: "Turn step" },
  { key: "v", label: "Engine log" },
];

const pct = (v: number | null): string => (v === null ? "not logged" : `${formatNumber(v * 100, { locale: "en", decimals: 1 })}%`);

export interface ArenaReplayScreenProps {
  runId: string;
  model: ArenaReplayModel;
  onBack: () => void;
  games?: Array<{ gameId: string }>;
  onSelectGame?: (gameId: string) => void;
}

/** P3: replay de una partida de arena, con el chart, el chat y el panel de decisión por ronda. */
export function ArenaReplayScreen({ runId, model, onBack, games, onSelectGame }: ArenaReplayScreenProps) {
  const lastRound = model.game.rounds || 1;
  const [selectedRound, setSelectedRound] = useState(lastRound);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;
    const targetElement = container.querySelector(`[data-round="${selectedRound}"]`) as HTMLElement | null;
    if (targetElement) {
      container.scrollTop = targetElement.offsetTop - container.offsetTop;
    }
  }, [selectedRound]);

  const ourOffers = toOfferPoints(model.offers.ours);
  const theirOffers = toOfferPoints(model.offers.rival);
  const target = toTargetOfferPoints(model.explain);
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

  const result = resultLabel(model.game.endReason);
  const errorRoundPanel = model.rounds?.find((p) => p.round === model.game.rounds) ?? null;
  const panel = model.rounds?.find((p) => p.round === selectedRound) ?? null;
  const decisionRows: DataTableRow[] = panel
    ? [
        { k: "Rule", v: panel.decision?.rule ?? "not logged" },
        { k: "Target (Boulware curve)", v: panel.explain ? formatNumber(panel.explain.target, { locale: "en", decimals: 3 }) : "not logged" },
        { k: "Step vs previous round", v: panel.explain ? (panel.explain.step === null ? "n/a" : formatNumber(panel.explain.step, { locale: "en", decimals: 3 })) : "not logged" },
        {
          k: "AC_next",
          v: panel.explain ? <Pill kind={panel.explain.acNext ? "verdict" : "rejected"}>{panel.explain.acNext ? "accept" : "no accept"}</Pill> : "not logged",
        },
        { k: "AC_time", v: panel.explain ? panel.explain.acTime : "not logged" },
        { k: "Quarantined parser", v: panel.parser ? `${panel.parser.intent}${panel.parser.injectionSuspected ? " · injection" : ""}` : "not logged" },
        {
          k: "Validator",
          v: panel.validator
            ? `${panel.validator.ok ? "ok" : `failed: ${Array.isArray(panel.validator.reasons) ? panel.validator.reasons.join(", ") : ""}`} (${panel.boxes.filter((b) => b.box === "validator").length} attempt(s))`
            : "not logged",
        },
        {
          k: "Latencies",
          v:
            panel.boxes.length > 0 ? (
              <LatencyList boxes={panel.boxes} />
            ) : (
              "not logged"
            ),
        },
      ]
    : [];

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <ReplayHeader
        onBack={onBack}
        backLabel="← Matches"
        gameId={model.game.gameId}
        rival={model.game.rival}
        {...(games ? { games } : {})}
        {...(onSelectGame ? { onSelectGame } : {})}
      />
      <KpiStrip
        items={[
          { label: "Result", value: result.label, ...(result.tone ? { tone: result.tone } : {}) },
          { label: "Surplus", value: pct(model.game.surplusShare) },
          { label: "Rounds", value: model.game.roundLimit !== null ? `${model.game.rounds} / ${model.game.roundLimit}` : String(model.game.rounds) },
          { label: "ZOPA", value: zopaKpi(model.game.zopaEmpty) },
        ]}
      />
      {model.game.endReason === "rival-error" || model.game.endReason === "protocol-violation" ? (
        <ProtocolBreakBanner
          round={model.game.rounds}
          detail={model.game.error ?? `${model.game.endReason} (no detail logged)`}
          rivalText={errorRoundPanel?.rivalText ?? null}
          decision={errorRoundPanel?.decision ? { kind: errorRoundPanel.decision.action === "walk" ? "walk" : "fallback", label: errorRoundPanel.decision.action } : null}
        />
      ) : null}
      {model.game.zopaEmpty && model.reserves ? (
        <EmptyZopaBanner ours={offerLabel(model.reserves.ours)} rival={offerLabel(model.reserves.rival)} walked={model.game.endReason === "agent-walk"} />
      ) : null}
      {model.game.templateCount > 0 ? <TemplateBanner templateCount={model.game.templateCount} ourMessageCount={model.game.ourMessageCount} provider={model.provider} /> : null}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)", gap: "var(--space-4)", alignItems: "start" }}>
        <Card title="Offers by round" style={{ position: "sticky", top: "var(--space-4)" }}>
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
          <Legend
            items={[
              { kind: "us", label: "Our offers" },
              { kind: "them", label: "Opponent offers" },
              { kind: "target", label: "Target curve" },
              { kind: "estimate", label: "Estimate of their reserve" },
              { kind: "reserve-us", label: "Our reserve" },
              { kind: "reserve-them", label: "Their reserve" },
              { kind: "zopa", label: "ZOPA" },
            ]}
          />
        </Card>
        <Card title="Messages" style={{ maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div ref={messagesContainerRef} className="nr-chat" style={{ overflow: "auto", flex: 1, minHeight: 0 }}>
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
            <SecondaryButton onClick={() => setSelectedRound((r) => Math.max(1, r - 1))}>← Previous round</SecondaryButton>
            <SecondaryButton onClick={() => setSelectedRound((r) => Math.min(model.game.rounds, r + 1))}>Next round →</SecondaryButton>
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
