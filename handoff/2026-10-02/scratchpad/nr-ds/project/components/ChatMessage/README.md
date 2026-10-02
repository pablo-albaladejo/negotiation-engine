# ChatMessage
One negotiation turn as a bubble: `.nr-msg.us` (right-aligned, `--us-soft`) or `.nr-msg.them` (left-aligned, `--them-soft`). Each bubble has a `.nr-msg-meta` line on top and the text below.

- The meta line is `R<round> · nosotros|rival · oferta <n>`, followed by `.nr-flag` chips (see Flag).
- `.is-highlighted` adds a 2px ink outline to the message tied to the chart point that was clicked.
- **Rival text is untrusted.** Always render it with `textContent`, or React's default escaping. Never use `innerHTML` or `dangerouslySetInnerHTML`: what the rival writes must never run.
- The number in our bubble is the engine's number. The UI shows it and never computes it.
