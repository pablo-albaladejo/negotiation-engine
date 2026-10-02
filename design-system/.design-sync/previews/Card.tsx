import { Card } from "@negotiation-ring/design-system";

export function WithTitleAndCaption() {
  return (
    <Card title="champion-v3 vs challenger-v4 · 800 matches" caption="A card groups one question: a chart, a table or a match's chat.">
      <div className="nr-cfg">run challenger-v4 · β=0.35 · noise 2% · persona "warm-firm"</div>
    </Card>
  );
}

export function ContentOnly() {
  return (
    <Card>
      <p className="nr-muted" style={{ margin: 0 }}>
        No title or caption: just free content inside the card's surface.
      </p>
    </Card>
  );
}

/** S4: `level` picks the title's heading tag (2|3|4, default 3) -- use 2 only for a card that is
 * itself the top heading of a screen section, never nested under another Card's title. */
export function TopLevelCard() {
  return (
    <Card title="Champion v3 vs candidate v4" level={2}>
      <p className="nr-muted" style={{ margin: 0 }}>
        This card's title renders as an &lt;h2&gt;, for a screen section with no higher heading above it.
      </p>
    </Card>
  );
}
