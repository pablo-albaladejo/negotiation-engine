- TraceRecord shape: `sessionId, round, box, input, output, result, latencyMs, seed?, configVersion?, provider?, error?` — box.ts:18-30. Every record is built at pipeline.ts:207-223; `provider: deps.provider ?? "none"` on every entry (pipeline.ts:218); `error` appended only on failure (pipeline.ts:220, 241).

- Sanitization applies only to boxes named `parser`, `narrator`, `validator`, `leak` (pipeline.ts:167-205). All other boxes store input/output raw.

Per box (input → output):
- `input` (pipeline.ts:252): in `{rivalAction, hasOffer, hasText}` → out `{round, roundLimit}`. Rival offer itself not stored, only `hasOffer` boolean; rival text only `hasText` boolean.
- `parser` (pipeline.ts:263-269; empty case 278): in `{text}` → sanitized to `{textLength}` (pipeline.ts:172-175); out = full `ParserOutput` raw (claims/offer/intent/tactics) — output is not sanitized.
- `reconcile` (pipeline.ts:300-306): in `{structured, parserOffer, deterministicOffer, dual}` → out `{offer, unconfirmed}`.
- `binding` (pipeline.ts:318): in `{rivalAction}` → out `BindingResult` (`kind`, plus `offer

[bulk-read: fireworks/deepseek-v4.1-flash · 12773 in / 2500 out · $0.0045 · 31950 ms]
