import fc from "fast-check";
import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { newsSignalsFrom, readNewsSignals } from "../src/news/signals.js";

const ALLOWED_NUMBERS = new Set(["id", "tick", "ageTicks"]);

/** Every numeric field anywhere in the value, by key. */
function numericKeys(v: unknown, key = "", out: string[] = []): string[] {
  if (typeof v === "number") out.push(key);
  else if (Array.isArray(v)) v.forEach((x) => numericKeys(x, key, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) numericKeys(x, k, out);
  return out;
}

const itemArb = fc.record(
  {
    id: fc.oneof(fc.integer(), fc.double(), fc.string()),
    tick: fc.oneof(fc.integer(), fc.constant(null), fc.string()),
    headline: fc.oneof(fc.string(), fc.constantFrom("El Chato busca cartas de Malasaña por 300 P", "Dumping cheap cards at 5 P")),
    body: fc.string(),
    price: fc.double(),
    your_limit: fc.integer(),
    mentions: fc.array(fc.oneof(fc.string(), fc.record({ name: fc.string(), kind: fc.constantFrom("set", "card", "dealer", "venue", "x"), id: fc.string(), price: fc.integer() }))),
  },
  { requiredKeys: [] },
);

describe("news signals (hint only, never a figure)", () => {
  it("never throws and carries no numeric field beyond id, tick and ageTicks", () => {
    fc.assert(
      fc.property(fc.oneof(fc.anything(), fc.record({ items: fc.array(itemArb), summary: fc.anything(), updatedAt: fc.anything() })), fc.integer(), (parsed, now) => {
        const out = newsSignalsFrom(parsed, now);
        for (const k of numericKeys(out)) expect(ALLOWED_NUMBERS.has(k)).toBe(true);
      }),
    );
  });

  it("reads arbitrary file content without throwing", () => {
    const dir = mkdtempSync(join(tmpdir(), "news-"));
    expect(readNewsSignals(join(dir, "missing"), 1).available).toBe(false);
    fc.assert(
      fc.property(fc.string(), (content) => {
        writeFileSync(join(dir, "news-summary.json"), content);
        const out = readNewsSignals(dir, 10);
        for (const k of numericKeys(out)) expect(ALLOWED_NUMBERS.has(k)).toBe(true);
      }),
      { numRuns: 50 },
    );
  });

  it("no trading route reads GameState.news or imports src/news", () => {
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        return statSync(p).isDirectory() ? files(p) : p.endsWith(".ts") ? [p] : [];
      });
    for (const route of ["coordinator", "dealers", "duels", "trades", "broker", "engine"]) {
      for (const f of files(join(__dirname, "..", "src", route))) {
        const text = readFileSync(f, "utf8");
        expect(text, f).not.toMatch(/\.news\b/);
        expect(text, f).not.toMatch(/from\s+["'][^"']*\/news\//);
      }
    }
  });
});
