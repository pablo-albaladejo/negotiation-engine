import { Card, ChatMessage, KpiStrip, OfferChart } from "@negotiation-ring/design-system";
import { gridCols } from "../ui/grid.js";
import { EmptyStateCard, InvalidLogBanner, LoadingCard, TemplateBanner } from "../ui/states.js";
import { PageTitle } from "../ui/page-title.js";

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
        <PageTitle>States and edge cases</PageTitle>
        <span className="nr-muted">How the viewer behaves when the logs or the match go off the happy path.</span>
      </div>
      <div className="nr-grid" style={gridCols("repeat(2, minmax(0, 1fr))")}>
        <Card title="Invalid log">
          <InvalidLogBanner
            errors={[{ file: "results/r-1003.jsonl", line: 1834, path: "offer.value", message: "expected number, got string \"one hundred four\"" }]}
            validCount={1833}
            skippedMatchId="m-0917"
          />
        </Card>
        <Card title="Opponent breaks protocol">
          <span className="nr-cfg">m-0356 · vs text-only · seller · R3</span>
          <div className="nr-chat" style={{ marginTop: "var(--space-3)" }}>
            <ChatMessage
              side="them"
              round={3}
              text="I'll email you the PDF with the counteroffer, take a look and let me know."
              flags={[{ kind: "walk", label: "breaks protocol · no offer" }]}
            />
          </div>
          <div style={{ marginTop: "var(--space-3)" }}>
            <KpiStrip
              items={[
                { label: "Outcome", value: "Opponent error", tone: "walk" },
                { label: "Rounds", value: "3/10" },
                { label: "Our last offer", value: "127" },
              ]}
            />
          </div>
        </Card>
        <Card title="Empty ZOPA → walk" caption="m-0188 vs extreme-anchor · their reserve (76) sits below ours (80): no deal is possible.">
          <div style={{ margin: "var(--space-2) 0" }}>
            <OfferChart
              rounds={10}
              yDomain={[60, 140]}
              ourOffers={[{ round: 1, value: 124 }, { round: 2, value: 112 }, { round: 3, value: 104 }]}
              theirOffers={[{ round: 1, value: 64 }, { round: 2, value: 68 }, { round: 3, value: 70 }]}
              ourReserve={80}
              theirReserve={76}
              end={{ round: 3, kind: "walk", label: "walk" }}
            />
          </div>
        </Card>
        <Card title="LLM down · everything on template">
          <TemplateBanner templateCount={5} ourMessageCount={5} provider="claude-cli" />
          <div className="nr-chat" style={{ marginTop: "var(--space-3)" }}>
            <ChatMessage side="them" round={4} offer={91} text="I'll go up to 91, but I need something in return." />
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
