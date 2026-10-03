#!/usr/bin/env node
// Checks that code comments are in English (team rule: code, comments and dev strings in English; *.md stays Spanish).
// Heuristic: a comment fails if it has Spanish accents/punctuation or at least two Spanish stopwords.
// Game text (templates, probe phrases, regexes over dealer text) is data: mark it with "game text" in a comment
// on the same line or the line above to skip it. Strings are not checked, only comments.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname;
const SKIP = [/^design-system\/\.design-sync\//, /^docs\/bazaar\/bundles\//, /^results\//];
const files = execFileSync("git", ["ls-files", "*.ts", "*.tsx", "*.mjs", "*.js", "*.css"], { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .filter((f) => f && !SKIP.some((re) => re.test(f)));

const ACCENTS = /[áéíóúñ¿¡]/i;
const STOP = new Set(["el", "la", "los", "las", "del", "para", "una", "que", "con", "por", "sin", "nunca", "solo", "cuando", "cada", "pero", "porque", "hay", "está", "como", "se", "lo", "al", "y", "o", "es", "si"]);
const ENGLISH_HINT = /\b(the|and|of|to|is|in|for|with|not|only|never|each|when)\b/i;

/** Comment text on a line: after `//` (outside obvious URLs), or a block-comment line. */
function commentOf(line, inBlock) {
  const t = line.trim();
  if (inBlock || t.startsWith("/*") || t.startsWith("*")) return t.replace(/^\/?\*+\/?/, "");
  const m = line.match(/(?:^|[\s;,){}])\/\/(?!\/)(.*)$/);
  return m && !/https?:$/.test(line.slice(0, m.index + 1)) ? m[1] : undefined;
}

const problems = [];
for (const f of files) {
  const lines = readFileSync(`${ROOT}${f}`, "utf8").split("\n");
  let inBlock = false;
  lines.forEach((line, i) => {
    const opens = /\/\*/.test(line) && !/\*\//.test(line.slice(line.indexOf("/*") + 2));
    const text = commentOf(line, inBlock);
    if (inBlock && /\*\//.test(line)) inBlock = false;
    else if (opens) inBlock = true;
    if (!text) return;
    if (/game text/i.test(text) || /game text/i.test(lines[i - 1] ?? "")) return;
    const words = text.toLowerCase().match(/[a-záéíóúñü]+/g) ?? [];
    const stops = words.filter((w) => STOP.has(w) && !["a", "o", "y"].includes(w)).length;
    const accent = ACCENTS.test(text.replace(/[«»"'`][^«»"'`]*[«»"'`]/g, ""));
    if (accent || (stops >= 2 && !(ENGLISH_HINT.test(text) && stops < 3))) problems.push(`${f}:${i + 1}: ${text.trim().slice(0, 100)}`);
  });
}

if (problems.length) {
  console.log(`✗ Comments in Spanish (${problems.length}); write them in English or mark game text with "game text":`);
  for (const p of problems) console.log(`  ${p}`);
  process.exit(1);
}
console.log(`✓ Comments in English (${files.length} code files)`);
