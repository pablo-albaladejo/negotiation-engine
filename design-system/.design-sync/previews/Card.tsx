import { Card } from "@negotiation-ring/design-system";

export function ConTituloYPie() {
  return (
    <Card title="champion-v3 vs challenger-v4 · 800 partidas" caption="Una tarjeta agrupa una pregunta: un gráfico, una tabla o el chat de una partida.">
      <div className="nr-cfg">run challenger-v4 · β=0,35 · ruido 2 % · persona «cálida-firme»</div>
    </Card>
  );
}

export function SoloContenido() {
  return (
    <Card>
      <p className="nr-muted" style={{ margin: 0 }}>
        Sin título ni pie: solo contenido libre dentro de la superficie de la tarjeta.
      </p>
    </Card>
  );
}
