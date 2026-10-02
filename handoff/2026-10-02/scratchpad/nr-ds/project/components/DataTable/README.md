# DataTable
A metrics table: `.nr-table` inside `.nr-table-wrap`, which scrolls sideways on a phone.

- Headers are mono, 11px, uppercase and muted. Rows are separated by `--line` hairlines. There are no zebra stripes.
- Numeric columns use `.num`, right-aligned with tabular-nums.
- The change column uses `.nr-better` (green) or `.nr-worse` (red). A neutral change ("=", or rounds, which have no better direction) stays ink.
- Differences in percentages are written in points: "−2 pp".
