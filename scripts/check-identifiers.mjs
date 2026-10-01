#!/usr/bin/env node

import { readdirSync, readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const results = [];

// Allowlist of identifiers that are intentionally non-code (document why each is here)
const allowlist = new Set([
  "PascalCase",      // example in docs of naming convention
  "camelCase",       // example in docs of naming convention
  "UPPER_SNAKE",     // example in docs of naming convention
  "LLM_PROVIDER",    // env var defined in .env.example
  "CHAMPION_FROZEN", // env var for champion freeze
  "AGENTS",          // filename, not a code identifier
  "CLAUDE",          // filename, not a code identifier
  "pnpm",            // CLI command
  // JSON/config keys from documented files
  "sessionId", "projectId", "pkg", "globalName", "buildCmd", "cssEntry",
  "provider", "overrides", "dtsPropsFor", "readmeHeader",
  // Object/Zod schema field names from NarratorInput
  "action", "offer", "rivalIntent", "tactics", "persona", "ask",
  // Protocol enum literals
  "none", "claude",
  // HTTP headers
  "Authorization",
  // Props/fields from documented interfaces
  "theme", "cardMode", "explain", "rivalText", "protocol", "mandate", "reservation",
  // TurnInput/TurnOutput fields
  "round", "rivalAction", "rivalOffer", "roundLimit", "deadline", "rivalCanRespond", "text",
  // Pipeline/config fields
  "config", "timeoutMs", "trace", "logBoxRecord",
]);

// Patterns to skip (these are not code identifiers to check)
const skipPatterns = [
  /^[a-z0-9_]+\//, // starts with path component (src/, test/, etc.)
  /\/[a-z0-9._-]+$/, // ends with file path
  /\.[a-z]+$/, // file extension
  /^--/, // command-line flag
  /^[A-Z0-9_]{4,}$/, // ALL_CAPS without parens - likely env var
  /^(GET|POST|PUT|DELETE|PATCH|HEAD)$/, // HTTP method
  /^(true|false|null|undefined)$/, // literals
  /^(replay)\(\)$/, // function name in docs (with parens)
];

function isCodeIdentifier(text) {
  // Must match one of these patterns to be considered a code identifier
  const codePatterns = [
    /^[A-Z][a-zA-Z0-9]*\(?\)?$/, // PascalCase with optional ()
    /^[a-z_][a-zA-Z0-9_]*\(?\)?$/, // camelCase/snake_case with optional ()
  ];

  if (!codePatterns.some(p => p.test(text))) return false;

  // Skip if matches any skip pattern
  if (skipPatterns.some(p => p.test(text))) return false;

  return true;
}

// Read all source files once into memory to search efficiently
function loadSourceFiles() {
  const sources = new Map(); // identifier -> Set of files where it's defined

  function scanDir(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if ([".git", "node_modules", "dist", "results", ".claude"].includes(entry.name)) continue;
        scanDir(fullPath);
      } else if ((entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
                 (fullPath.includes("/src/") || fullPath.includes("/test/") ||
                  fullPath.includes("/scripts/") || fullPath.includes("/viewer/") ||
                  fullPath.includes("/design-system/src"))) {
        const content = readFileSync(fullPath, "utf-8");

        // Find exports and declarations
        // export const X, export function X, export class X, export interface X, export type X
        const exportRegex = /export\s+(?:const|function|class|interface|type|async\s+function)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let match;
        while ((match = exportRegex.exec(content)) !== null) {
          const identifier = match[1];
          if (!sources.has(identifier)) sources.set(identifier, new Set());
          sources.get(identifier).add(fullPath.slice(root.length + 1));
        }

        // Also find default exports
        const defaultMatch = content.match(/export\s+default\s+(?:function|class)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (defaultMatch) {
          const identifier = defaultMatch[1];
          if (!sources.has(identifier)) sources.set(identifier, new Set());
          sources.get(identifier).add(fullPath.slice(root.length + 1));
        }
      }
    }
  }

  scanDir(root);
  return sources;
}

function checkAgentsMdFiles(dir, sources) {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if ([".git", "node_modules", "dist", "results", ".claude"].includes(entry.name)) continue;
      checkAgentsMdFiles(fullPath, sources);
    } else if (entry.name === "AGENTS.md" || entry.name === "CLAUDE.md") {
      checkIdentifiersInFile(fullPath, sources);
    }
  }
}

function checkIdentifiersInFile(filePath, sources) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  let inCodeBlock = false;

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];

    // Track code blocks
    if (line.trim().startsWith("```") || line.trim().startsWith("~~~")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    // Extract backtick identifiers
    const backtickRegex = /`([^`\n]+?)`/g;
    let match;
    while ((match = backtickRegex.exec(line)) !== null) {
      let text = match[1].trim();

      // Handle parentheses
      const withParens = /^([a-zA-Z_][a-zA-Z0-9_]*)\(\)$/.test(text);
      if (withParens) {
        text = text.slice(0, -2); // remove ()
      }
      const withParensVar = /^([a-zA-Z_][a-zA-Z0-9_]*)\(\.\.\.?\)$/.test(text);
      if (withParensVar) {
        text = text.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/)[1];
      }

      // Skip if not a code identifier
      if (!isCodeIdentifier(text)) continue;

      // Skip if in allowlist
      if (allowlist.has(text)) continue;

      // Check if exists in sources
      if (!sources.has(text)) {
        results.push({
          file: filePath.slice(root.length + 1),
          identifier: match[1],
          lineNum: lineNum + 1,
          found: false,
        });
      }
    }
  }
}

// Main
const sources = loadSourceFiles();
checkAgentsMdFiles(root, sources);

console.log(`\n✓ Identifier Check Results`);
console.log(`  Total checked: ${sources.size}`);
console.log(`  Issues found: ${results.length}\n`);

if (results.length > 0) {
  console.log("Missing identifiers:");
  for (const r of results) {
    console.log(`  ${r.file}:${r.lineNum}: identifier \`${r.identifier}\` not found in source`);
  }
  process.exit(1);
} else {
  console.log("✓ All identifiers found in source!");
  process.exit(0);
}
