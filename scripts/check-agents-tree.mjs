#!/usr/bin/env node
// Árbol de AGENTS.md (parte de `pnpm docs:check`). Falla si una carpeta:
//   - tiene más de MAX_FILES ficheros versionados (`git ls-files`, también los ya añadidos) directamente dentro;
//   - no tiene AGENTS.md;
//   - tiene una subcarpeta cuyo AGENTS.md no enlaza desde el suyo, o su AGENTS.md no enlaza al del padre.
// Exenciones (documentadas también en el AGENTS.md raíz):
//   - la raíz no cuenta para el tope: la configuración de las herramientas tiene que vivir ahí;
//   - `results/` (trazas en vivo), `design-system/.design-sync/` (generado) y `docs/bazaar/bundles/assets/`
//     (copia literal del frontend del Bazaar) quedan fuera de todo,
//     y no llevan AGENTS.md propio por subcarpeta.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_FILES = 10;
const COUNT_EXEMPT = new Set(["."]);
const TREE_EXEMPT = ["results", "design-system/.design-sync", "docs/bazaar/bundles/assets"];

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

/** Rutas (relativas a la raíz) a las que apuntan los enlaces markdown de un AGENTS.md. */
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
  if (!COUNT_EXEMPT.has(dir) && count > MAX_FILES) issues.push(`${dir}/: ${count} ficheros (máximo ${MAX_FILES}); divide por concepto en subcarpetas`);
  if (!hasAgents(dir)) {
    issues.push(`${dir}/: falta AGENTS.md`);
    continue;
  }
  const targets = linkTargets(dir);
  for (const child of children.get(dir) ?? []) {
    if (isTreeExempt(child) && !hasAgents(child)) continue;
    if (!targets.has(agentsOf(child))) issues.push(`${agentsOf(dir)}: no enlaza a ${agentsOf(child)}`);
  }
  if (dir !== "." && !targets.has(agentsOf(posix.dirname(dir)))) issues.push(`${agentsOf(dir)}: no enlaza al padre ${agentsOf(posix.dirname(dir))}`);
}

console.log(`\n✓ Árbol de AGENTS.md (máx. ${MAX_FILES} ficheros por carpeta)`);
console.log(`  Carpetas: ${[...counts.keys()].filter((d) => !isTreeExempt(d)).length}, problemas: ${issues.length}\n`);
for (const issue of issues) console.log(`  ${issue}`);
process.exit(issues.length > 0 ? 1 : 0);
