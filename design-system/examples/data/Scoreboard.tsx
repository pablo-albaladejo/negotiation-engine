import { Scoreboard } from "@negotiation-ring/design-system";

export function ScoreboardExample() {
  return <Scoreboard badge="LIVE" us="Team 2" rival="Team 5" round={4} rounds={10} attacksBlocked={2} />;
}
