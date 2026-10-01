export interface KpiItem {
  label: string;
  value: string;
  tone?: "deal" | "walk";
}

export interface KpiStripProps {
  items: KpiItem[];
}

export function KpiStrip({ items }: KpiStripProps) {
  return (
    <div className="nr-card nr-kpis">
      {items.map((item, index) => {
        const toneClass = item.tone === "deal" ? "nr-deal" : item.tone === "walk" ? "nr-walk" : "";
        const valueClass = ["nr-kpi-value", toneClass].filter(Boolean).join(" ");
        return (
          <div className="nr-kpi" key={`${item.label}-${index}`}>
            <span className={valueClass}>{item.value}</span>
            <span className="nr-kpi-label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
