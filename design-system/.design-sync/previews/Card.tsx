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
