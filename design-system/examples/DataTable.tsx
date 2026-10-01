import { DataTable } from "@negotiation-ring/design-system";

export function DataTableExample() {
  return (
    <DataTable
      columns={[
        { key: "metric", label: "Metric" },
        { key: "champion", label: "champion-v3", numeric: true },
        { key: "challenger", label: "challenger-v4", numeric: true },
        { key: "change", label: "Change" },
      ]}
      rows={[
        { metric: "Surplus / ZOPA (mean)", champion: "0.58", challenger: "0.64", change: { value: "+0.06", tone: "better" } },
        { metric: "Deal rate", champion: "86%", challenger: "84%", change: { value: "−2 pp", tone: "worse" } },
        { metric: "Mandate violations", champion: "0", challenger: "0", change: "=" },
        { metric: "Rounds to close (mean)", champion: "6.1", challenger: "7.4", change: "+1.3" },
        { metric: "Walk-aways with existing ZOPA", champion: "3%", challenger: "5%", change: { value: "+2 pp", tone: "worse" } },
      ]}
    />
  );
}
