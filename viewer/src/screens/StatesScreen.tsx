import { Card, ChatMessage, Legend, OfferChart } from "@negotiation-ring/design-system";
import { EmptyStateCard, EmptyZopaBanner, InvalidLogBanner, LoadingCard, ProtocolBreakBanner, TemplateBanner } from "../ui/states.js";

const TEMPLATE_FLAG = [{ kind: "fallback" as const, label: "template · LLM down" }];

/**
 * P8: estados límite (log inválido, run vacío, carga en curso, rival que rompe el protocolo, ZOPA
 * vacía con retirada, LLM caído). Las pantallas P3/P4 usan los mismos componentes con datos reales. Ninguno deja la pantalla
 * en blanco. Datos de ejemplo iguales en forma a los que produce la API real (`ReadError`).
 */
export function StatesScreen() {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <h2 className="nr-heading">States and edge cases</h2>
        <span className="nr-muted">How the viewer behaves when the logs or the match go off the happy path.</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "var(--space-4)", alignItems: "start" }}>
        <Card title="Invalid log">
          <InvalidLogBanner
            errors={[{ file: "results/r-1003.jsonl", line: 1834, path: "offer.value", message: "expected number, got string \"one hundred four\"" }]}
            validCount={1833}
          />
        </Card>
        <Card title="Opponent breaks protocol">
          <ProtocolBreakBanner
            round={3}
            title="ring-session-7 · tournament · R3"
            detail="rivalOffer.pct (invalid_type)"
            rivalText="I'll pay you ten percent of the cargo value, whenever that arrives."
            decision={{ kind: "fallback", label: "fallback offer" }}
          />
        </Card>
        <Card title="Empty ZOPA → walk">
          <EmptyZopaBanner ours="80" rival="76" walked />
          <OfferChart
            rounds={10}
            yDomain={[60, 140]}
            ourOffers={[{ round: 1, value: 124 }, { round: 2, value: 112 }, { round: 3, value: 104 }]}
            theirOffers={[{ round: 1, value: 64 }, { round: 2, value: 68 }, { round: 3, value: 70 }]}
            ourReserve={80}
            theirReserve={76}
            end={{ round: 3, kind: "walk", label: "walk" }}
          />
          <Legend
            items={[
              { kind: "us", label: "Our offers" },
              { kind: "them", label: "Opponent offers" },
              { kind: "reserve-us", label: "Our reserve" },
              { kind: "reserve-them", label: "Their reserve" },
            ]}
          />
        </Card>
        <Card title="LLM down">
          <TemplateBanner templateCount={5} ourMessageCount={5} provider="claude-cli" />
          <div className="nr-chat" style={{ marginTop: "var(--space-3)" }}>
            <ChatMessage side="us" round={4} offer={124} text="Our offer this round is 124." flags={TEMPLATE_FLAG} />
            <ChatMessage side="us" round={5} offer={119} text="Our offer this round is 119." flags={TEMPLATE_FLAG} />
          </div>
        </Card>
        <EmptyStateCard title="r-1005 has no matches" body="The log has a config header but 0 match lines. Check" command="pnpm arena --matches" />
        <LoadingCard label="Reading results/r-1001.jsonl" />
        <LoadingCard label="Reading results/r-1002.jsonl · 1500 / 2000 matches" current={1500} total={2000} />
      </div>
    </section>
  );
}
