# OfferChart
Hand-drawn SVG (`svg.nr-chart`) of offers per round, with the round on X and price on Y. When a scenario has more than one issue, Y is utility and the tooltip shows the offer tuple. Every mark takes a class bound to a token:

| class | draws |
| --- | --- |
| `.us-line` / `.dot-us` | our offers (`--us`) |
| `.them-line` / `.dot-them` | the rival's offers (`--them`) |
| `.dot-injection` | a rival turn flagged as injection (`--warn`, r=6) |
| `.target` | our Boulware target curve, dashed |
| `.estimate` | the engine's estimate of their reservation, dotted |
| `.reserve-us` / `.reserve-them` | reservation lines. Theirs is drawn in arena mode only. |
| `.zopa` | the band between both reservations. Arena mode only. |
| `.deal-ring` / `.deal-label` | the closing point: "AC_next → trato a 112" |
| `.grid` / `.axis-label` | hairline grid and mono axis labels |

- Use one linear scale per axis, and every tick label names a value that is on the axis.
- Clicking a dot highlights the matching ChatMessage.
- Always pair the chart with `.nr-legend`.
- In tournament mode there is no ZOPA and no hidden reservation: draw only what was logged.
