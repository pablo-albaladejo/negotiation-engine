# Flag
A small mono chip on a chat message's meta line. It marks what the parser, engine or validator logged about that turn.

| class | meaning | example |
| --- | --- | --- |
| `.nr-flag` | neutral: a detected tactic, our target, our estimate of their reservation | `ancla extrema`, `objetivo 118,4` |
| `.nr-flag.injection` | the parser flagged prompt injection | `inyección` |
| `.nr-flag.decision` | the engine accepted, with the rule that fired | `AC_next · acepta` |
| `.nr-flag.walk` | the engine walked away | `se retira` |
| `.nr-flag.fallback` | the narrator failed and the deterministic template answered | `plantilla · timeout LLM` |

Write the chip text in lowercase Spanish, with `·` between parts. A chip only shows a logged field; it never shows a value the UI computed.
