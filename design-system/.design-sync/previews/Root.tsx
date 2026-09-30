import { Root, Card, KpiStrip } from "@negotiation-ring/design-system";

export function TemaClaro() {
  return (
    <Root theme="light" style={{ padding: 16 }}>
      <h1 className="nr-title">Visor de la arena</h1>
      <Card title="Ofertas por ronda" caption="Resumen de la partida m-0107.">
        <KpiStrip items={[{ label: "Excedente / ZOPA", value: "0,97" }, { label: "Resultado", value: "Trato", tone: "deal" }]} />
      </Card>
    </Root>
  );
}

export function TemaOscuro() {
  return (
    <Root theme="dark" style={{ padding: 16 }}>
      <h1 className="nr-title">Visor de la arena</h1>
      <Card title="Ofertas por ronda" caption="Resumen de la partida m-0188.">
        <KpiStrip items={[{ label: "Excedente / ZOPA", value: "0" }, { label: "Resultado", value: "Retirada", tone: "walk" }]} />
      </Card>
    </Root>
  );
}
