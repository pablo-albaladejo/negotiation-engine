import type { ReactNode } from "react";
import { Root, Scoreboard } from "@negotiation-ring/design-system";

// Scoreboard is sized for the 1920×1080 projector view (see the product's
// live screen), which always scales the whole Root down to fit the
// viewport via a CSS transform on the host page — the component itself is
// never responsive. This frame reproduces that scaling so the preview card
// doesn't clip the large projector type.
const PROJECTOR_WIDTH = 1400;
const PROJECTOR_HEIGHT = 170;
const SCALE = 0.42;

function ProjectorFrame({ children }: { children: ReactNode }) {
  return (
    <div style={{ overflow: "hidden", borderRadius: "var(--radius-lg)", height: PROJECTOR_HEIGHT * SCALE }}>
      <Root
        theme="dark"
        style={{
          width: PROJECTOR_WIDTH,
          padding: 24,
          transform: `scale(${SCALE})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </Root>
    </div>
  );
}

export function LiveMatch() {
  return (
    <ProjectorFrame>
      <Scoreboard badge="LIVE" us="Team 2" rival="Team 5" round={4} rounds={10} attacksBlocked={2} />
    </ProjectorFrame>
  );
}

export function MatchEndingSoon() {
  return (
    <ProjectorFrame>
      <Scoreboard badge="LIVE" us="Team 2" rival="Team 8" round={9} rounds={10} attacksBlocked={5} />
    </ProjectorFrame>
  );
}
