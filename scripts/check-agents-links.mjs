#!/usr/bin/env node

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const results = [];

function checkAgentsMdFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    // Skip ignored directories
    if (entry.isDirectory()) {
      if ([".git", "node_modules", "dist", ".ds-sync", "results", ".claude"].includes(entry.name)) {
        continue;
      }
      checkAgentsMdFiles(fullPath);
    } else if (entry.name === "AGENTS.md") {
      checkLinksInFile(fullPath);
    }
  }
}

function checkLinksInFile(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const dir = dirname(filePath);

  // Match markdown links [text](path)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const link = match[2];
    if (!link) continue;

    // Skip http(s) links
    if (link.startsWith("http")) continue;

    // Resolve relative path
    const resolvedPath = resolve(dir, link);
    const exists = existsSync(resolvedPath);

    if (!exists) {
      results.push({
        file: filePath.slice(root.length + 1),
        link,
        valid: false,
      });
    }
  }
}

checkAgentsMdFiles(root);

// Print results
console.log(`\n✓ Link Check Results`);
console.log(`  Invalid links: ${results.length}\n`);

if (results.length > 0) {
  console.log("Invalid links found:");
  for (const r of results) {
    console.log(`  ${r.file}: [${r.link}]`);
  }
  process.exit(1);
} else {
  console.log("✓ All links valid!");
  process.exit(0);
}
