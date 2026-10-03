#!/usr/bin/env node
// AGENTS.md tree (part of `pnpm docs:check`). Fails if a folder:
//   - has more than MAX_FILES versioned files (`git ls-files`, including already-added ones) directly inside;
//   - has no AGENTS.md;
//   - has a subfolder whose AGENTS.md is not linked from its own, or its AGENTS.md does not link to the parent's.
// Exemptions (also documented in the root AGENTS.md):
//   - the root does not count towards the cap: tool configuration has to live there;
//   - `results/` (live traces), `design-system/.design-sync/` (generated), `docs/bazaar/bundles/assets/`
//     (literal copy of the Bazaar frontend) and `docs/bazaar/bundles/pretty/assets/` (its readable version) are left out of everything,
//     and do not carry their own per-subfolder AGENTS.md.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_FILES = 10;
const COUNT_EXEMPT = new Set(["."]);
const TREE_EXEMPT = ["results", "design-system/.design-sync", "docs/bazaar/bundles/assets", "docs/bazaar/bundles/pretty/assets"];

const isTreeExempt = (dir) => TREE_EXEMPT.some((e) => dir === e || dir.startsWith(`${e}/`));

const files = [
  ...new Set(
    execFileSync("git", ["ls-files", "--cached"], { cwd: root, encoding: "utf8" })
      .split("\n")
      .filter((f) => f && existsSync(join(root, f))),
  ),
];

const counts = new Map([[".", 0]]);
const children = new Map();
for (const file of files) {
  const dir = posix.dirname(file);
  counts.set(dir, (counts.get(dir) ?? 0) + 1);
  for (let d = dir; d !== "."; d = posix.dirname(d)) {
    if (!counts.has(d)) counts.set(d, 0);
    const parent = posix.dirname(d);
    if (!children.has(parent)) children.set(parent, new Set());
    children.get(parent).add(d);
  }
}

/** Paths (relative to the root) that the markdown links of an AGENTS.md point to. */
function linkTargets(dir) {
  const text = readFileSync(join(root, dir, "AGENTS.md"), "utf8");
  const targets = new Set();
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
    if (/^[a-z]+:/i.test(m[1])) continue;
    targets.add(posix.normalize(posix.join(dir, m[1])));
  }
  return targets;
}

const agentsOf = (dir) => (dir === "." ? "AGENTS.md" : `${dir}/AGENTS.md`);
const hasAgents = (dir) => existsSync(join(root, agentsOf(dir)));
const issues = [];

for (const [dir, count] of [...counts].sort(([a], [b]) => a.localeCompare(b))) {
  if (isTreeExempt(dir)) continue;
  if (!COUNT_EXEMPT.has(dir) && count > MAX_FILES) issues.push(`${dir}/: ${count} files (max ${MAX_FILES}); split by concept into subfolders`);
  if (!hasAgents(dir)) {
    issues.push(`${dir}/: missing AGENTS.md`);
    continue;
  }
  const targets = linkTargets(dir);
  for (const child of children.get(dir) ?? []) {
    if (isTreeExempt(child) && !hasAgents(child)) continue;
    if (!targets.has(agentsOf(child))) issues.push(`${agentsOf(dir)}: does not link to ${agentsOf(child)}`);
  }
  if (dir !== "." && !targets.has(agentsOf(posix.dirname(dir)))) issues.push(`${agentsOf(dir)}: does not link to the parent ${agentsOf(posix.dirname(dir))}`);
}

console.log(`\n✓ AGENTS.md tree (max ${MAX_FILES} files per folder)`);
console.log(`  Folders: ${[...counts.keys()].filter((d) => !isTreeExempt(d)).length}, problems: ${issues.length}\n`);
for (const issue of issues) console.log(`  ${issue}`);
process.exit(issues.length > 0 ? 1 : 0);
