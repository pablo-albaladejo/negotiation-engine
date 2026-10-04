# viewer/src/screens/goals/ — Goals and strategy registry

- **`GoalsView.tsx`** — the "Goals" tab: what `GameState.goals` carries (goals.json and strategies.json, written by the "goals" session). At the top the gaps and conflicts; then the goals by priority (weight, now, Δ of the day and of the tick, status, until which tick, target, why and the collapsed "do not"s), the open proposals (proposed or approved: pros, cons, recommendation, who gives the OK) and all the strategies grouped by goal (owner, status, Pablo's OK, commit and flag, evidence, conflicts).

Display only: no route decides with this. `figures_for_humans` is shown as text with the label "for humans, not a price"; an offer's figure always comes from the route's code.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
