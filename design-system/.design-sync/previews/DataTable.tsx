import { DataTable } from "@negotiation-ring/design-system";

export function ComparativaCampeonCandidato() {
  return (
    <DataTable
      columns={[
        { key: "metric", label: "Métrica" },
        { key: "champion", label: "champion-v3", numeric: true },
        { key: "challenger", label: "challenger-v4", numeric: true },
        { key: "change", label: "Cambio" },
      ]}
      rows={[
        { metric: "Excedente / ZOPA (media)", champion: "0,58", challenger: "0,64", change: { value: "+0,06", tone: "better" } },
        { metric: "Tasa de acuerdo", champion: "86 %", challenger: "84 %", change: { value: "−2 pp", tone: "worse" } },
        { metric: "Violaciones del mandato", champion: "0", challenger: "0", change: "=" },
        { metric: "Rondas hasta cerrar (media)", champion: "6,1", challenger: "7,4", change: "+1,3" },
        { metric: "Retiradas con ZOPA existente", champion: "3 %", challenger: "5 %", change: { value: "+2 pp", tone: "worse" } },
      ]}
    />
  );
}

export function MetricasPorRival() {
  return (
    <DataTable
      columns={[
        { key: "rival", label: "Rival" },
        { key: "surplus", label: "Excedente / ZOPA", numeric: true },
        { key: "rounds", label: "Rondas", numeric: true },
      ]}
      rows={[
        { rival: "Boulware", surplus: "0,71", rounds: "6" },
        { rival: "Inject+Voss", surplus: "0,69", rounds: "8" },
        { rival: "Ancla extrema", surplus: { value: "0,38", tone: "worse" }, rounds: "10" },
      ]}
    />
  );
}
