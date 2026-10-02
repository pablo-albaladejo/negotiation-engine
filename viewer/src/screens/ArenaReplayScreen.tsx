import { Card, ChatMessage, KpiStrip, Legend, OfferChart, formatNumber } from "@negotiation-ring/design-system";
import React, { useEffect, useState } from "react";
import type { ArenaReplayModel } from "../model/index.js";
import { offerDomain, toOfferPoints, toTargetOfferPoints } from "../ui/chart.js";
import { resultLabel, zopaKpi } from "../ui/labels.js";
import { offerLabel, offerValue } from "../ui/offer.js";
import { EmptyZopaBanner, ProtocolBreakBanner, TemplateBanner } from "../ui/states.js";
import { ReplayHeader } from "../ui/replay-header.js";
import { DecisionPanel } from "../ui/DecisionPanel.js";

const pct = (v: number | null): string => (v === null ? "not logged" : `${formatNumber(v * 100, { locale: "en", decimals: 1 })}%`);
const dec = (v: number | null): string => (v === null ? "not logged" : formatNumber(v, { locale: "en", decimals: 2 }));

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
          { label: "Surplus / ZOPA", value: dec(model.game.surplusShare) },
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
      <div className="nr-grid" style={{ gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)" }}>
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
      <DecisionPanel
        hasTrace={model.hasTrace}
        panel={panel}
        selectedRound={selectedRound}
        totalRounds={model.game.rounds}
        onPrev={() => setSelectedRound((r) => Math.max(1, r - 1))}
        onNext={() => setSelectedRound((r) => Math.min(model.game.rounds, r + 1))}
      />
    </section>
  );
}
