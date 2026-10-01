import { KpiStrip } from "@negotiation-ring/design-system";

export function KpiStripExample() {
  return (
    <KpiStrip
      items={[
        { label: "Resultado", value: "Trato", tone: "deal" },
        { label: "Precio", value: "112" },
        { label: "Excedente / ZOPA", value: "0,97" },
        { label: "Rondas", value: "7 / 10" },
        { label: "Rol · reserva", value: "vendedor · 80" },
        { label: "Inyecciones detectadas", value: "0" },
      ]}
    />
  );
}
