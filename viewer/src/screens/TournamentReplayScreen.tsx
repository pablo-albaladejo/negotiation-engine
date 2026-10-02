import {
  Card,
  ChatMessage,
  DataTable,
  type DataTableColumn,
  type DataTableRow,
  KpiStrip,
  Legend,
  OfferChart,
  StatFigure,
  formatNumber,
} from "@negotiation-ring/design-system";
import { useEffect, useRef, useState } from "react";
import type { TournamentReplayModel } from "../model/index.js";
import { offerDomain, toOfferPoints, toTargetOfferPoints } from "../ui/chart.js";
import { gridCols } from "../ui/grid.js";
import { offerValue } from "../ui/offer.js";
import { DecisionPanel } from "../ui/DecisionPanel.js";
import { ReplayHeader } from "../ui/replay-header.js";
import { ProtocolBreakBanner, TemplateBanner } from "../ui/states.js";

const EST_COLUMNS: DataTableColumn[] = [
  { key: "r", label: "Round" },
  { key: "th", label: "Their offer", numeric: true },
  { key: "e", label: "Estimated reserve", numeric: true },
  { key: "us", label: "Our offer", numeric: true },
];

export interface TournamentReplayScreenProps {
  model: TournamentReplayModel;
  onBack: () => void;
}

/**
 * P4: replay en modo torneo. Privacidad: nunca ZOPA ni reserva del rival; la nuestra solo si el
 * escenario local coincide. El header no muestra "vs rival" (ajuste vs. P13 §C): una sesión de
 * torneo no tiene un único rival logeado, al contrario que una partida de arena (ver "Questions for
 * design").
 */
export function TournamentReplayScreen({ model, onBack }: TournamentReplayScreenProps) {
  const lastRound = model.rounds.length > 0 ? model.rounds[model.rounds.length - 1]!.round : 1;
  const [selectedRound, setSelectedRound] = useState(lastRound);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
  const ourReserve = offerValue(model.ourReserve) ?? undefined;
  const yDomain = offerDomain([...ourOffers.map((p) => p.value), ...theirOffers.map((p) => p.value), ...target.map((p) => p.value), ...estimate.map((p) => p.value), ourReserve]);
  const rounds = model.rounds.length;

  const lastRoundPanel = model.rounds[model.rounds.length - 1] ?? null;
  const finalOffer =
    model.outcome?.kind === "agreement"
      ? offerValue(model.outcome.offer)
      : offerValue(lastRoundPanel?.decision?.offer ?? lastRoundPanel?.ourOffer ?? null);
  const lastEstimate = model.explain[model.explain.length - 1] ?? null;
  const finalEstimate = lastEstimate ? offerValue(lastEstimate.rivalReserveEstimate) : null;
  const result = model.outcome
    ? model.outcome.kind === "agreement"
      ? "Deal"
      : model.outcome.by === "agent"
        ? "We walked"
        : "Opponent walked"
    : "not logged";
  const resultTone = model.outcome ? (model.outcome.kind === "agreement" ? ("deal" as const) : ("walk" as const)) : undefined;

  const estRows: DataTableRow[] = model.rounds.map((p) => {
    const estimateForRound = model.explain.find((e) => e.round === p.round);
    return {
      r: `R${p.round}`,
      th: offerValue(p.rivalOffer) ?? "not logged",
      e: estimateForRound ? (offerValue(estimateForRound.rivalReserveEstimate) ?? "not logged") : "not logged",
      us: offerValue(p.ourOffer) ?? (p.decision?.action === "accept" ? "accept" : p.decision?.action === "walk" ? "walk" : "not logged"),
    };
  });

  const chat = model.rounds.flatMap((p) => {
    const entries: { side: "us" | "them"; round: number; text: string; offer: number | undefined; template: boolean }[] = [];
    if (p.rivalText !== null) entries.push({ side: "them", round: p.round, text: p.rivalText, offer: offerValue(p.rivalOffer) ?? undefined, template: false });
    if (p.ourText !== null) entries.push({ side: "us", round: p.round, text: p.ourText, offer: offerValue(p.ourOffer) ?? undefined, template: p.template });
    return entries;
  });

  const panel = model.rounds.find((p) => p.round === selectedRound) ?? null;
  const roundNumbers = model.rounds.map((p) => p.round);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <ReplayHeader onBack={onBack} backLabel="← Runs" mode="tournament" gameId={model.sessionId} />
        <span className="nr-muted">
          {model.role ?? "not logged"} · scenario {model.scenario.id}
        </span>
        <span className="nr-cfg">config v{model.configVersion} · tournament mode</span>
      </div>
      <KpiStrip
        items={[
          { label: "Result", value: result, ...(resultTone ? { tone: resultTone } : {}) },
          { label: "Rounds", value: formatNumber(rounds, { locale: "en" }) },
          { label: "Final offer", value: finalOffer !== null ? formatNumber(finalOffer, { locale: "en" }) : "not logged" },
          { label: "Final estimate", value: finalEstimate !== null ? formatNumber(finalEstimate, { locale: "en" }) : "not logged" },
        ]}
      />
      {model.protocol.map((b, i) => (
        <ProtocolBreakBanner key={i} round={b.round} detail={b.issues.length > 0 ? b.issues.map((x) => `${x.path || "(root)"} (${x.code})`).join(", ") : "not logged"} />
      ))}
      {model.templateCount > 0 ? <TemplateBanner templateCount={model.templateCount} ourMessageCount={model.ourMessageCount} provider={model.provider} /> : null}
      <div className="nr-grid" style={gridCols("minmax(0, 1.55fr) minmax(320px, 1fr)")}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", minWidth: 0 }}>
          <Card title="Offers by round" className="nr-sticky-wide" caption="In a tournament the opponent's reserve is unknown: no ZOPA and no surplus, only our estimate.">
            <OfferChart
              rounds={rounds}
              yDomain={yDomain}
              ourOffers={ourOffers}
              theirOffers={theirOffers}
              target={target}
              estimate={estimate}
              {...(ourReserve !== undefined ? { ourReserve } : {})}
              selectedRound={selectedRound}
              onPointClick={(point) => setSelectedRound(point.round)}
            />
            <Legend
              items={[
                { kind: "us", label: "Our offers" },
                { kind: "them", label: "Opponent offers" },
                { kind: "estimate", label: "Estimate of their reserve" },
                { kind: "target", label: "Target curve" },
                { kind: "reserve-us", label: "Our reserve" },
              ]}
            />
            {ourReserve === undefined ? (
              <span className="nr-muted">
                Our reserve: <span>not available</span>
              </span>
            ) : null}
          </Card>
          <Card title="Estimate of their reserve by round">
            <StatFigure
              value={finalEstimate !== null ? formatNumber(finalEstimate, { locale: "en" }) : "not logged"}
              tone="them"
              {...(finalEstimate !== null && finalOffer !== null ? { caption: `vs. final offer ${formatNumber(finalOffer, { locale: "en" })}` } : {})}
            />
            <DataTable columns={EST_COLUMNS} rows={estRows} />
          </Card>
        </div>
        <Card title="Messages">
          <div ref={messagesContainerRef} className="nr-chat nr-chat-scroll is-tall">
            {chat.map((c, i) => (
              <ChatMessage
                key={i}
                side={c.side}
                round={c.round}
                {...(c.offer !== undefined ? { offer: c.offer } : {})}
                text={c.text}
                {...(c.template ? { flags: [{ kind: "fallback" as const, label: "template" }] } : {})}
                highlighted={c.round === selectedRound}
              />
            ))}
          </div>
        </Card>
      </div>
      <DecisionPanel hasTrace panel={panel} rounds={roundNumbers} selectedRound={selectedRound} onSelectRound={setSelectedRound} />
    </section>
  );
}
