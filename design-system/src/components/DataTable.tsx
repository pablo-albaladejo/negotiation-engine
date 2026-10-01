import type { ReactNode } from "react";

export interface DataTableColumn {
  key: string;
  label: string;
  numeric?: boolean;
}

export type DataTableCell = {
  value: ReactNode;
  tone?: "better" | "worse";
};

export type DataTableRow = Record<string, ReactNode | DataTableCell>;

export interface DataTableProps {
  columns: DataTableColumn[];
  rows: DataTableRow[];
}

function isCell(value: ReactNode | DataTableCell): value is DataTableCell {
  return typeof value === "object" && value !== null && "value" in (value as object);
}

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="nr-table-wrap">
      <table className="nr-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.numeric ? "num" : undefined}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => {
                const raw = row[column.key];
                const cell = isCell(raw) ? raw : { value: raw };
                const toneClass = cell.tone === "better" ? "nr-better" : cell.tone === "worse" ? "nr-worse" : "";
                const classes = [column.numeric ? "num" : "", toneClass].filter(Boolean).join(" ");
                return (
                  <td key={column.key} className={classes || undefined}>
                    {cell.value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
