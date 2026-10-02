export interface HeatmapCell {
  label: string;
  /** Sin valor (null/undefined): celda neutra rotulada "n/a", nunca con banda. */
  value?: number | null;
}

export interface HeatmapRow {
  /** @deprecated use `label`; kept for backward compatibility. */
  rival?: string;
  label?: string;
  cells: HeatmapCell[];
}

export interface HeatmapProps {
  rows: HeatmapRow[];
  columns: string[];
  /** Header for the leftmost column (the row label); defaults to "Opponent". */
  rowHeader?: string;
}

export function heatmapBand(value: number | null | undefined): "good" | "mid" | "bad" | "none" {
  if (value === null || value === undefined || Number.isNaN(value)) return "none";
  if (value >= 0.6) return "good";
  if (value >= 0.45) return "mid";
  return "bad";
}

export function Heatmap({ rows, columns, rowHeader = "Opponent" }: HeatmapProps) {
  return (
    <div className="nr-table-wrap">
      <table className="nr-table nr-heat">
        <thead>
          <tr>
            <th>{rowHeader}</th>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const rowLabel = row.label ?? row.rival ?? "";
            return (
              <tr key={rowLabel || rowIndex}>
                <td>{rowLabel}</td>
                {row.cells.map((cell, index) => {
                  const band = heatmapBand(cell.value);
                  return (
                    <td key={`${rowLabel}-${index}`} className={`nr-heat-cell ${band}`}>
                      {band === "none" ? "n/a" : cell.label}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
