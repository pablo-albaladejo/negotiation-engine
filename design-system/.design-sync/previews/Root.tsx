import { Root, Card, KpiStrip } from "@negotiation-ring/design-system";

export function LightTheme() {
  return (
    <Root theme="light" style={{ padding: 16 }}>
      <h1 className="nr-title">Arena viewer</h1>
      <Card title="Offers by round" caption="Summary of match m-0107.">
        <KpiStrip items={[{ label: "Surplus / ZOPA", value: "0.97" }, { label: "Result", value: "Deal", tone: "deal" }]} />
      </Card>
    </Root>
  );
}

export function DarkTheme() {
  return (
    <Root theme="dark" style={{ padding: 16 }}>
      <h1 className="nr-title">Arena viewer</h1>
      <Card title="Offers by round" caption="Summary of match m-0188.">
        <KpiStrip items={[{ label: "Surplus / ZOPA", value: "0" }, { label: "Result", value: "Walk away", tone: "walk" }]} />
      </Card>
    </Root>
  );
}
