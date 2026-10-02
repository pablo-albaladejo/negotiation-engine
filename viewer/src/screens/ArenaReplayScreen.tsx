import { Card, ChatMessage, KpiStrip, Legend, OfferChart, formatNumber } from "@negotiation-ring/design-system";
import type { Summary } from "../../../src/arena/results-schema.js";
import React, { useEffect, useState } from "react";
import { dealRule, type ArenaReplayModel } from "../model/index.js";
import { arenaChartCaption, offerDomain, toOfferPoints, toTargetOfferPoints } from "../ui/chart.js";
import { gridCols } from "../ui/grid.js";
import { matchConfigLine, resultLabel, roleLabel } from "../ui/labels.js";
import { firstIssueName, offerLabel, offerValue, priceLabel } from "../ui/offer.js";
import { EmptyZopaBanner, ProtocolBreakBanner, TemplateBanner } from "../ui/states.js";
import { ReplayHeader } from "../ui/replay-header.js";
import { MatchSelector } from "../ui/match-selector.js";
import { DecisionPanel } from "../ui/DecisionPanel.js";
import { chatFlags } from "../ui/chat-flags.js";

const pct = (v: number | null): string => (v === null ? "not logged" : `${formatNumber(v * 100, { locale: "en", decimals: 1 })}%`);
const dec = (v: number | null): string => (v === null ? "not logged" : formatNumber(v, { locale: "en", decimals: 2 }));

export interface ArenaReplayScreenProps {
  runId: string;
  model: ArenaReplayModel;
  onBack: () => void;
  /** Run summary, for the `cfg` config line (A2); `null` when `summary.json` wasn't available. */
  summary?: Summary | null;
  games?: Array<{ gameId: string }>;
  onSelectGame?: (gameId: string) => void;
}

/** P3: replay de una partida de arena, con el chart, el chat y el panel de decisión por ronda. */
export function ArenaReplayScreen({ runId, model, onBack, summary, games, onSelectGame }: ArenaReplayScreenProps) {
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

  // A9/X3: "{rule} → deal at {price}" (no rule when the rival accepted our offer) / "R{n} · walk".
  const rule = model.rounds ? dealRule(model.rounds) : null;
  const endLabel =
    model.game.endReason === "agreement"
      ? `${rule ? `${rule} → ` : ""}deal at ${priceLabel(model.game.agreement)}`
      : `R${lastRound} · walk`;
  const end =
    model.game.endReason === "agreement"
      ? { round: lastRound, kind: "deal" as const, label: endLabel }
      : model.game.endReason === "agent-walk" || model.game.endReason === "rival-walk"
        ? { round: lastRound, kind: "walk" as const, label: endLabel }
        : undefined;

  const result = resultLabel(model.game.endReason, model.game.protocolViolationBy);
  const errorRoundPanel = model.rounds?.find((p) => p.round === model.game.rounds) ?? null;
  const panel = model.rounds?.find((p) => p.round === selectedRound) ?? null;
  const roundNumbers = model.rounds ? model.rounds.map((p) => p.round) : Array.from({ length: model.game.rounds }, (_, i) => i + 1);

  // A2: "Seller · price · T=10 · run r-1001" -- issue name from the logged offers, never guessed.
  const issueName = firstIssueName(model.offers.ours) ?? firstIssueName(model.offers.rival) ?? "not logged";
  const sub = `${roleLabel(model.game.role)} · ${issueName} · T=${model.game.roundLimit ?? "not logged"} · run ${runId}`;
  const cfg = matchConfigLine(summary?.config.params, summary?.config.params?.persona ?? null, model.provider);

  // A3: drop the separate "ZOPA" KPI -- empty ZOPA now reads in the Surplus / ZOPA value itself.
  const surplusKpi = model.game.zopaEmpty
    ? `${model.game.surplusShare === null ? "—" : dec(model.game.surplusShare)} · empty ZOPA`
    : dec(model.game.surplusShare);
  const ourReserveValue = model.reserves ? offerValue(model.reserves.ours) : null;
  // A5: "Target curve ({persona/strategy})" only when a persona is actually logged.
  const persona = summary?.config.params?.persona ?? null;
  const targetCurveLabel = persona ? `Target curve (${persona})` : "Target curve";

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <ReplayHeader
        onBack={onBack}
        backLabel={`← Matches in ${runId}`}
        gameId={model.game.gameId}
        rival={model.game.rival}
        sub={sub}
        cfg={cfg}
      />
      {games && onSelectGame ? <MatchSelector games={games} currentGameId={model.game.gameId} onSelectGame={onSelectGame} /> : null}
      <KpiStrip
        items={[
          { label: "Outcome", value: result.label, ...(result.tone ? { tone: result.tone } : {}) },
          { label: "Price", value: priceLabel(model.game.agreement) },
          { label: "Surplus / ZOPA", value: surplusKpi },
          { label: "Rounds", value: model.game.roundLimit !== null ? `${model.game.rounds}/${model.game.roundLimit}` : String(model.game.rounds) },
          { label: "Role · reserve", value: `${roleLabel(model.game.role)} · ${ourReserveValue === null ? "not logged" : ourReserveValue}` },
          { label: "Injections", value: String(injectionRounds.length), ...(injectionRounds.length > 0 ? { tone: "walk" as const } : {}) },
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
      <div className="nr-grid" style={gridCols("minmax(0, 1.55fr) minmax(320px, 1fr)")}>
        <Card title="Offers by round" caption={arenaChartCaption(ourReserve ?? null, theirReserve ?? null, model.game.zopaEmpty)}>
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
            selectedRound={selectedRound}
            onPointClick={(point) => setSelectedRound(point.round)}
          />
          <Legend
            items={[
              { kind: "us", label: "Our offers" },
              { kind: "them", label: "Opponent offers" },
              { kind: "target", label: targetCurveLabel },
              { kind: "estimate", label: "Estimate of their reserve" },
              { kind: "reserve-us", label: "Our reserve" },
              { kind: "reserve-them", label: "Their reserve" },
              { kind: "zopa", label: "ZOPA" },
              { kind: "injection", label: "Injection" },
              { kind: "end", label: "Close" },
            ]}
          />
        </Card>
        <Card title="Messages">
          <div ref={messagesContainerRef} className="nr-chat nr-chat-scroll">
            {model.chat.map((c, i) => {
              const roundPanel = model.rounds?.find((p) => p.round === c.round) ?? null;
              const flags = [
                ...(c.from === "agent" && roundPanel?.template ? [{ kind: "fallback" as const, label: "template" }] : []),
                ...chatFlags(c.from, roundPanel),
              ];
              return (
                <ChatMessage
                  key={i}
                  side={c.from === "agent" ? "us" : "them"}
                  round={c.round}
                  {...(offerValue(c.offer) !== null ? { offer: offerValue(c.offer)! } : {})}
                  text={c.text}
                  {...(flags.length > 0 ? { flags } : {})}
                  highlighted={c.round === selectedRound}
                />
              );
            })}
          </div>
        </Card>
      </div>
      <DecisionPanel hasTrace={model.hasTrace} panel={panel} rounds={roundNumbers} selectedRound={selectedRound} onSelectRound={setSelectedRound} />
    </section>
  );
}
