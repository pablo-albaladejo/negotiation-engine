import { Card } from "@negotiation-ring/design-system";
import { EmptyStateCard, InvalidLogBanner, LoadingCard } from "../ui/states.js";

/**
 * P8: estados límite del minuto 0 (log inválido, run vacío, carga en curso). Ninguno deja la pantalla
 * en blanco. Datos de ejemplo iguales en forma a los que produce la API real (`ReadError`).
 */
export function StatesScreen() {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <h2 className="nr-heading">States and edge cases</h2>
        <span className="nr-muted">How the viewer behaves when the logs or the match go off the happy path.</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "var(--space-4)", alignItems: "start" }}>
        <Card title="Invalid log">
          <InvalidLogBanner
            errors={[{ file: "results/r-1003.jsonl", line: 1834, path: "offer.value", message: "expected number, got string \"one hundred four\"" }]}
            validCount={1833}
          />
        </Card>
        <Card title="Run with no matches">
          <EmptyStateCard title="r-1005 has no matches" body="The log has a config header but 0 match lines. Check" command="pnpm arena --matches" />
        </Card>
        <LoadingCard label="Reading results/r-1001.jsonl · 1240 / 2646 matches" />
      </div>
    </section>
  );
}
