# KpiStrip
A card of key figures that goes above the chart: `.nr-card.nr-kpis` holding `.nr-kpi` items, each a `.nr-kpi-value` and a `.nr-kpi-label`.

- Values use the display face at 22px with tabular-nums. Labels are muted, 12px, and go under the value.
- A figure that is itself a state (Trato / Retirada) can take `.nr-deal` or `.nr-walk`.
- Six figures at most. The grid wraps on its own (`minmax(130px, 1fr)`).
- In tournament mode "Excedente / ZOPA" is unknown: show "—", never 0.
