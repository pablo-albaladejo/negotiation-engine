import { Card, ChatMessage, DataTable, type DataTableColumn, type DataTableRow, KpiStrip, Legend, ModeBadge, OfferChart, formatNumber } from "@negotiation-ring/design-system";
import type { TournamentReplayModel } from "../model/index.js";
import { offerDomain, toOfferPoints, toTargetOfferPoints } from "../ui/chart.js";
import { offerValue } from "../ui/offer.js";
import { ProtocolBreakBanner, TemplateBanner } from "../ui/states.js";

const EST_COLUMNS: DataTableColumn[] = [
  { key: "r", label: "Round" },
  { key: "th", label: "Their offer", numeric: true },
  { key: "e", label: "Estimated reserve", numeric: true },
  { key: "us", label: "Our offer", numeric: true },
];

export interface TournamentReplayScreenProps {
  model: TournamentReplayModel;
  games?: Array<{ gameId: string }>;
  onSelectGame?: (gameId: string) => void;
}

/** P4: replay en modo torneo. Privacidad: nunca ZOPA ni reserva del rival; la nuestra solo si el escenario local coincide. */
export function TournamentReplayScreen({ model, games, onSelectGame }: TournamentReplayScreenProps) {
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

  const estRows: DataTableRow[] = model.rounds.map((p) => {
    const estimateForRound = model.explain.find((e) => e.round === p.round);
    return {
      r: `R${p.round}`,
      th: offerValue(p.rivalOffer) ?? "—",
      e: estimateForRound ? (offerValue(estimateForRound.rivalReserveEstimate) ?? "not logged") : "not logged",
      us: offerValue(p.ourOffer) ?? "accept",
    };
  });

  const chat = model.rounds.flatMap((p) => {
    const entries: { side: "us" | "them"; round: number; text: string; offer: number | undefined; template: boolean }[] = [];
    if (p.rivalText !== null) entries.push({ side: "them", round: p.round, text: p.rivalText, offer: offerValue(p.rivalOffer) ?? undefined, template: false });
    if (p.ourText !== null) entries.push({ side: "us", round: p.round, text: p.ourText, offer: offerValue(p.ourOffer) ?? undefined, template: p.template });
    return entries;
  });

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <ModeBadge mode="tournament" />
          <h2 className="nr-heading">{model.sessionId}</h2>
        </div>
        <span className="nr-muted">{model.role ?? "not logged"} · scenario {model.scenario.id}</span>
      </div>
      <KpiStrip
        items={[
          { label: "Role", value: model.role ?? "not logged" },
          { label: "Rounds", value: formatNumber(rounds, { locale: "en" }) },
          { label: "Our reserve", value: ourReserve !== undefined ? formatNumber(ourReserve, { locale: "en" }) : "not available" },
          { label: "Template", value: `${model.templateCount} of ${model.ourMessageCount}` },
        ]}
      />
      {model.protocol.map((b, i) => (
        <ProtocolBreakBanner key={i} round={b.round} detail={b.issues.length > 0 ? b.issues.map((x) => `${x.path || "(root)"} (${x.code})`).join(", ") : "not logged"} />
      ))}
      {model.templateCount > 0 ? <TemplateBanner templateCount={model.templateCount} ourMessageCount={model.ourMessageCount} provider={model.provider} /> : null}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(320px, 1fr)", gap: "var(--space-4)", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", minWidth: 0 }}>
          <Card title="Offers by round" caption="In a tournament the opponent's reserve is unknown: no ZOPA and no surplus, only our estimate.">
            <OfferChart rounds={rounds} yDomain={yDomain} ourOffers={ourOffers} theirOffers={theirOffers} target={target} estimate={estimate} {...(ourReserve !== undefined ? { ourReserve } : {})} />
            <Legend
              items={[
                { kind: "us", label: "Our offers" },
                { kind: "them", label: "Opponent offers" },
                { kind: "estimate", label: "Estimate of their reserve" },
                { kind: "target", label: "Target curve" },
                { kind: "reserve-us", label: "Our reserve" },
              ]}
            />
          </Card>
          <Card title="Estimate of their reserve by round">
            <DataTable columns={EST_COLUMNS} rows={estRows} />
          </Card>
        </div>
        <Card title="Messages">
          <div className="nr-chat">
            {chat.map((c, i) => (
              <ChatMessage key={i} side={c.side} round={c.round} {...(c.offer !== undefined ? { offer: c.offer } : {})} text={c.text} {...(c.template ? { flags: [{ kind: "fallback" as const, label: "template" }] } : {})} />
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
