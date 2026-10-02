# Card
The only container: a surface ground with a 1px `--line` border, `--radius-lg` corners and `--space-4` padding. There is no shadow.

- One card holds one question, with a heading (`.nr-heading`), content, and optionally a `.nr-muted` caption.
- Lay cards out with grid or flex and `gap: var(--space-4)`.
- On a wide screen the replay view is a two-column split: the chart card and the chat card, 1.35fr and 1fr. It stacks below 900px.
- Don't nest cards.
