import type { CSSProperties } from "react";

/** `style` for a `.nr-grid` with a content-specific column ratio, via the `--nr-grid-cols` custom property (D1). */
export function gridCols(value: string): CSSProperties {
  return { "--nr-grid-cols": value } as CSSProperties;
}
