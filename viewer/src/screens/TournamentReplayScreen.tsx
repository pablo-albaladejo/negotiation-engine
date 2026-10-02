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
import type { Summary } from "../../../src/arena/results-schema.js";
import { dealRule, dealUtility, type TournamentReplayModel } from "../model/index.js";
import { offerDomain, toOfferPoints, toTargetOfferPoints } from "../ui/chart.js";
import { gridCols } from "../ui/grid.js";
import { configParamsLine, roleLabel } from "../ui/labels.js";
import { firstIssueName, offerValue } from "../ui/offer.js";
import { chatFlags } from "../ui/chat-flags.js";
import { DecisionPanel } from "../ui/DecisionPanel.js";
import { ReplayHeader } from "../ui/replay-header.js";
import { ProtocolBreakBanner, TemplateBanner } from "../ui/states.js";

const EST_COLUMNS: DataTableColumn[] = [
  { key: "r", label: "Round" },
  { key: "th", label: "Their offer", numeric: true },
  { key: "e", label: "Estimated reserve", numeric: true },
  { key: "us", label: "Our offer", numeric: true },
];

const dec = (v: number | null): string => (v === null ? "not logged" : formatNumber(v, { locale: "en", decimals: 2 }));

export interface TournamentReplayScreenProps {
  model: TournamentReplayModel;
  onBack: () => void;
  /** Run summary, for the `cfg` config line (R4); `null` when `summary.json` wasn't available for this run. */
  summary?: Summary | null;
}

/**
 * P4: replay en modo torneo. Privacidad: nunca ZOPA ni reserva del rival; la nuestra solo si el
 * escenario local coincide. El header no muestra "vs rival" (ajuste vs. P13 §C): una sesión de
 * torneo no tiene un único rival logeado, al contrario que una partida de arena (ver "Questions for
 * design"). R3: sin back link (la navegación por pestañas ya cubre "volver"); R4: línea de config
 * completa (parámetros registrados + "tournament mode").
 */
export function TournamentReplayScreen({ model, summary }: TournamentReplayScreenProps) {
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

  // R1: injection-rounds + end marker on the chart, like the arena replay (A9).
  const injectionRounds = model.rounds.filter((p) => p.parser?.injectionSuspected).map((p) => p.round);
  // X2: Price is the agreed price -- never our last offer on a walk (that was never accepted).
  const finalOffer = model.outcome?.kind === "agreement" ? offerValue(model.outcome.offer) : null;
  const priceValue = model.outcome === null ? "not logged" : model.outcome.kind === "agreement" ? (finalOffer !== null ? formatNumber(finalOffer, { locale: "en" }) : "not logged") : "\u2014";
  const lastExplain = model.explain[model.explain.length - 1] ?? null;
  const finalEstimate = lastExplain ? offerValue(lastExplain.rivalReserveEstimate) : null;
  const lastUtility = model.outcome?.kind === "agreement" ? dealUtility(model.rounds) : null;
  const result = model.outcome
    ? model.outcome.kind === "agreement"
      ? "Deal"
      : model.outcome.by === "agent"
        ? "We walked"
        : "Opponent walked"
    : "not logged";
  const resultTone = model.outcome ? (model.outcome.kind === "agreement" ? ("deal" as const) : ("walk" as const)) : undefined;
  // X3: the logged acceptance rule, or no rule when the rival accepted our offer.
  const rule = dealRule(model.rounds);
  const endLabel = model.outcome
    ? model.outcome.kind === "agreement"
      ? `${rule ? `${rule} → ` : ""}deal at ${finalOffer === null ? "not logged" : finalOffer}`
      : `R${lastRound} · walk`
    : undefined;
  const endKind: "deal" | "walk" = model.outcome?.kind === "agreement" ? "deal" : "walk";
  const end = model.outcome ? { round: lastRound, kind: endKind, label: endLabel! } : undefined;

  // R6: "final estimate · the opponent closed at N" only when the session actually closed (not merely inferred from the last round).
  const closePrice = model.outcome ? offerValue(model.outcome.offer) : null;

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

  // R3: "role · issue · T · phase" -- phase isn't logged by the tournament trace, so it's always "not logged".
  const issueName = firstIssueName(model.offers.ours) ?? firstIssueName(model.offers.rival) ?? "not logged";
  const sub = `${model.role ? roleLabel(model.role) : "not logged"} · ${issueName} · T=${model.roundLimit ?? "not logged"} · not logged`;
  // R4: full logged config params + " · tournament mode" (the trace header logs `configVersion`; the rest comes from the run's `summary.json`, when available).
  const cfg = `config v${model.configVersion} · ${configParamsLine(summary?.config.params)} · tournament mode`;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <ReplayHeader mode="tournament" gameId={model.sessionId} sub={sub} cfg={cfg} />
      <KpiStrip
        items={[
          { label: "Outcome", value: result, ...(resultTone ? { tone: resultTone } : {}) },
          { label: "Price", value: priceValue },
          { label: "Utility", value: dec(lastUtility) },
          { label: "Estimated opponent reserve", value: finalEstimate !== null ? formatNumber(finalEstimate, { locale: "en" }) : "not logged" },
          { label: "Rounds", value: model.roundLimit !== null ? `${rounds}/${model.roundLimit}` : String(rounds) },
          { label: "Role · reserve", value: `${model.role ? roleLabel(model.role) : "not logged"} · ${ourReserve === undefined ? "not logged" : ourReserve}` },
          { label: "Injections", value: String(injectionRounds.length), ...(injectionRounds.length > 0 ? { tone: "walk" as const } : {}) },
        ]}
      />
      {model.protocol.map((b, i) => (
        <ProtocolBreakBanner key={i} round={b.round} detail={b.issues.length > 0 ? b.issues.map((x) => `${x.path || "(root)"} (${x.code})`).join(", ") : "not logged"} />
      ))}
      {model.templateCount > 0 ? <TemplateBanner templateCount={model.templateCount} ourMessageCount={model.ourMessageCount} provider={model.provider} /> : null}
      <div className="nr-grid" style={gridCols("minmax(0, 1.55fr) minmax(320px, 1fr)")}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", minWidth: 0 }}>
          <Card title="Offers by round" caption="In a tournament the opponent's reserve is unknown: no ZOPA and no surplus, only our estimate.">
            <OfferChart
              rounds={model.roundLimit ?? rounds}
              yDomain={yDomain}
              ourOffers={ourOffers}
              theirOffers={theirOffers}
              target={target}
              estimate={estimate}
              {...(ourReserve !== undefined ? { ourReserve } : {})}
              injectionRounds={injectionRounds}
              {...(end ? { end } : {})}
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
                { kind: "injection", label: "Injection" },
              ]}
            />
          </Card>
          <Card title="Estimate of their reserve by round">
            <StatFigure
              value={finalEstimate !== null ? formatNumber(finalEstimate, { locale: "en" }) : "not logged"}
              tone="them"
              {...(finalEstimate !== null && closePrice !== null ? { caption: `final estimate · the opponent closed at ${formatNumber(closePrice, { locale: "en" })}` } : {})}
            />
            <DataTable columns={EST_COLUMNS} rows={estRows} />
          </Card>
        </div>
        <Card title="Messages">
          <div ref={messagesContainerRef} className="nr-chat nr-chat-scroll is-tall">
            {chat.map((c, i) => {
              const roundPanel = model.rounds.find((p) => p.round === c.round) ?? null;
              const flags = [
                ...(c.side === "us" && roundPanel?.template ? [{ kind: "fallback" as const, label: "template" }] : []),
                ...chatFlags(c.side === "us" ? "agent" : "rival", roundPanel),
              ];
              return (
                <ChatMessage
                  key={i}
                  side={c.side}
                  round={c.round}
                  {...(c.offer !== undefined ? { offer: c.offer } : {})}
                  text={c.text}
                  {...(flags.length > 0 ? { flags } : {})}
                  highlighted={c.round === selectedRound}
                />
              );
            })}
          </div>
        </Card>
      </div>
      <DecisionPanel hasTrace panel={panel} rounds={roundNumbers} selectedRound={selectedRound} onSelectRound={setSelectedRound} />
    </section>
  );
}
