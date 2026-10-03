import type { MouseEvent, ReactNode } from "react";

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
  /** Makes the whole row clickable on click, as a mouse convenience; the row itself is not a tab stop (use an inner link/button for keyboard access). Clicks starting on an interactive child (button, a, input, select, textarea, [role=button]) are ignored. */
  onRowClick?: (rowIndex: number) => void;
  /** Row index visually highlighted as "selected" (e.g. the round picked on a chart). */
  selectedRowIndex?: number;
}

function isCell(value: ReactNode | DataTableCell): value is DataTableCell {
  return typeof value === "object" && value !== null && "value" in (value as object);
}

/** True when the click originated on (or inside) an interactive child, e.g. the row's TableLink. */
function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('button, a, input, select, textarea, [role="button"]') !== null;
}

export function DataTable({ columns, rows, onRowClick, selectedRowIndex }: DataTableProps) {
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
            <tr
              key={rowIndex}
              className={[onRowClick ? "nr-table-row-clickable" : "", rowIndex === selectedRowIndex ? "is-selected" : ""].filter(Boolean).join(" ") || undefined}
              aria-current={rowIndex === selectedRowIndex ? "true" : undefined}
              {...(onRowClick
                ? {
                    onClick: (event: MouseEvent<HTMLTableRowElement>) => {
                      if (isInteractiveTarget(event.target)) return;
                      onRowClick(rowIndex);
                    },
                  }
                : {})}
            >
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
