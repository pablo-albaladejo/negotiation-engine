export interface HeatmapCell {
  label: string;
  value: number;
}

export interface HeatmapRow {
  rival: string;
  cells: HeatmapCell[];
}

export interface HeatmapProps {
  rows: HeatmapRow[];
  columns: string[];
}

export function heatmapBand(value: number): "good" | "mid" | "bad" {
  if (value >= 0.6) return "good";
  if (value >= 0.45) return "mid";
  return "bad";
}

export function Heatmap({ rows, columns }: HeatmapProps) {
  return (
    <div className="nr-table-wrap">
      <table className="nr-table">
        <thead>
          <tr>
            <th>Rival</th>
            {columns.map((column) => (
              <th key={column} style={{ textAlign: "center" }}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.rival}>
              <td>{row.rival}</td>
              {row.cells.map((cell, index) => (
                <td key={`${row.rival}-${index}`} className={`nr-heat-cell ${heatmapBand(cell.value)}`}>
                  {cell.label}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
