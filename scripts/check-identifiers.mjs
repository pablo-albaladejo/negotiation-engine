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
  "AGENTS",          // filename, not a code identifier
  "CLAUDE",          // filename, not a code identifier
  "pnpm",            // CLI command
  "README",          // prose word (filename)
  "NOTES",           // prose word (filename)
  "FIXED",           // prose word (past tense)
  // Built-ins and standard globals
  "Math", "window", "NegotiationRing", "Root",  // JavaScript built-ins and configured globals
  "parse", "strict", // common method names on built-ins or standard objects
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
  "config", "timeoutMs", "trace",
  // Fixture/test data
  "fixture", "input",
  // Bazaar thread-status literals and design-system fields
  "walked", "end",
]);

// Standard tool flags to skip in code blocks
const standardFlags = new Set([
  "--frozen-lockfile",
  "--dir",
  "--help",
  "--version",
]);

function isCodeIdentifier(text) {
  // Must match one of these patterns to be considered a code identifier
  const codePatterns = [
    /^[A-Z][a-zA-Z0-9]*\(?\)?$/, // PascalCase with optional ()
    /^[a-z_][a-zA-Z0-9_]*\(?\)?$/, // camelCase/snake_case with optional ()
  ];

  if (!codePatterns.some(p => p.test(text))) return false;

  return true;
}

function isCapsName(text) {
  return /^[A-Z0-9_]{4,}$/.test(text);
}

function isFlagName(text) {
  return /^--[a-z0-9][a-z0-9-]*$/i.test(text);
}

// Read all source files once into memory to search efficiently
function loadSourceFiles() {
  const camelPascal = new Map(); // camelCase/PascalCase -> Set of files
  const capsNames = new Map(); // ALL_CAPS -> Set of files
  const flagNames = new Set(); // --flag names
  const cssVars = new Set(); // CSS custom properties

  function scanDir(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if ([".git", "node_modules", "dist", "results", ".claude", "handoff"].includes(entry.name)) continue;
        scanDir(fullPath);
      } else if ((entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") || entry.name.endsWith(".mjs")) &&
                 (fullPath.includes("/src/") || fullPath.includes("/test/") ||
                  fullPath.includes("/scripts/") || fullPath.includes("/viewer/") ||
                  fullPath.includes("/design-system/src"))) {
        const content = readFileSync(fullPath, "utf-8");

        // Find all declarations (exported or not)
        // const X, function X, class X, interface X, type X, async function X
        const declRegex = /(?:export\s+)?(?:const|function|class|interface|type|async\s+function)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let match;
        while ((match = declRegex.exec(content)) !== null) {
          const identifier = match[1];
          if (isCapsName(identifier)) {
            if (!capsNames.has(identifier)) capsNames.set(identifier, new Set());
            capsNames.get(identifier).add(fullPath.slice(root.length + 1));
          } else {
            if (!camelPascal.has(identifier)) camelPascal.set(identifier, new Set());
            camelPascal.get(identifier).add(fullPath.slice(root.length + 1));
          }
        }

        // Find interface/type property/method names: "name: Type" or "method(...)"
        // Match lines like: narrate(input: NarratorInput, signal: AbortSignal): Promise<...>;
        const propertyRegex = /^\s*(?:(?:get|set)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\??\s*[:(]/gm;
        while ((match = propertyRegex.exec(content)) !== null) {
          const identifier = match[1];
          if (isCapsName(identifier)) {
            if (!capsNames.has(identifier)) capsNames.set(identifier, new Set());
            capsNames.get(identifier).add(fullPath.slice(root.length + 1) + " (property)");
          } else {
            if (!camelPascal.has(identifier)) camelPascal.set(identifier, new Set());
            camelPascal.get(identifier).add(fullPath.slice(root.length + 1) + " (property)");
          }
        }

        // Find ALL_CAPS variable assignments (const X = ..., let X = ..., var X = ...)
        const assignRegex = /(?:const|let|var)\s+([A-Z0-9_]{4,})\s*=/g;
        while ((match = assignRegex.exec(content)) !== null) {
          const identifier = match[1];
          if (!capsNames.has(identifier)) capsNames.set(identifier, new Set());
          capsNames.get(identifier).add(fullPath.slice(root.length + 1));
        }

        // Find process.env.NAME references and env.NAME references (where env is a parameter)
        const envRegex = /(?:process\.env|env)\.([A-Z0-9_]+)/g;
        while ((match = envRegex.exec(content)) !== null) {
          const identifier = match[1];
          if (!capsNames.has(identifier)) capsNames.set(identifier, new Set());
          capsNames.get(identifier).add(fullPath.slice(root.length + 1) + " (env ref)");
        }

        // Find parseArgs option names (with or without quotes)
        const parseArgsRegex = /(?:["']([a-z0-9][a-z0-9-]*?)["']|([a-z0-9][a-z0-9-]*))\s*:\s*\{\s*type/g;
        while ((match = parseArgsRegex.exec(content)) !== null) {
          const flagName = match[1] || match[2];
          if (flagName) flagNames.add("--" + flagName);
        }

        // Find literal "--flag" strings
        const literalFlagRegex = /["'](--[a-z0-9][a-z0-9-]*?)["']/g;
        while ((match = literalFlagRegex.exec(content)) !== null) {
          const flagName = match[1];
          flagNames.add(flagName);
        }
      } else if (entry.name.endsWith(".sh") && fullPath.includes("/scripts/")) {
        const content = readFileSync(fullPath, "utf-8");

        // Find literal "--flag" strings in shell scripts
        const literalFlagRegex = /(--[a-z0-9][a-z0-9-]*)/g;
        let match;
        while ((match = literalFlagRegex.exec(content)) !== null) {
          const flagName = match[1];
          flagNames.add(flagName);
        }
      } else if (entry.name.endsWith(".css") && fullPath.includes("/design-system/src")) {
        const content = readFileSync(fullPath, "utf-8");

        // Find CSS custom properties (--var-name)
        const cssVarRegex = /(--[a-z0-9][a-z0-9-]*)/g;
        let match;
        while ((match = cssVarRegex.exec(content)) !== null) {
          const varName = match[1];
          cssVars.add(varName);
        }
      }
    }
  }

  // Load .env.example for ALL_CAPS env var names
  try {
    const envExample = readFileSync(join(root, ".env.example"), "utf-8");
    const envRegex = /^([A-Z0-9_]+)=/gm;
    let match;
    while ((match = envRegex.exec(envExample)) !== null) {
      const identifier = match[1];
      if (!capsNames.has(identifier)) capsNames.set(identifier, new Set());
      capsNames.get(identifier).add(".env.example");
    }
  } catch (e) {
    // .env.example might not exist
  }

  scanDir(root);
  return { camelPascal, capsNames, flagNames, cssVars };
}

function checkAgentsMdFiles(dir, sources) {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if ([".git", "node_modules", "dist", "results", ".claude", "handoff"].includes(entry.name)) continue;
      checkAgentsMdFiles(fullPath, sources);
    } else if (entry.name === "AGENTS.md" || entry.name === "CLAUDE.md") {
      checkIdentifiersInFile(fullPath, sources);
    }
  }
}

function extractIdentifiers(text) {
  const identifiers = [];

  // Handle dotted forms: config.turnBudgetMs -> ["config", "turnBudgetMs"]
  if (text.includes(".")) {
    const parts = text.split(".");
    for (const part of parts) {
      if (isCodeIdentifier(part) && !allowlist.has(part)) {
        identifiers.push(part);
      }
    }
  }

  // Handle call forms: narrate(a, b) -> ["narrate", "a", "b"]
  const callMatch = text.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.*)\)$/);
  if (callMatch) {
    const funcName = callMatch[1];
    if (isCodeIdentifier(funcName) && !allowlist.has(funcName)) {
      identifiers.push(funcName);
    }
    const args = callMatch[2].split(",").map(s => s.trim());
    for (const arg of args) {
      if (arg && isCodeIdentifier(arg) && !allowlist.has(arg)) {
        identifiers.push(arg);
      }
    }
  }

  // If no complex form, just add the text itself if it's an identifier
  if (!text.includes(".") && !callMatch && isCodeIdentifier(text) && !allowlist.has(text)) {
    identifiers.push(text);
  }

  return identifiers;
}

function isFilePath(text) {
  // Skip file paths: contain / or . at the end with extension
  if (text.includes("/")) return true;
  if (/\.(ts|tsx|js|jsx|mjs|json|jsonl|css|scss|md|yaml|yml|lock|example|gitignore|sh)$/.test(text)) return true;
  // Also skip plain filenames that are obviously files
  if (/^[a-z-]+\.(sh|ts|tsx|js|json|md)$/.test(text)) return true;
  return false;
}

function checkIdentifiersInFile(filePath, sources) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  let inCodeBlock = false;
  const counts = { camelPascal: 0, capsNames: 0, flags: 0, dotted: 0, calls: 0 };

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];

    // Track code blocks
    if (line.trim().startsWith("```") || line.trim().startsWith("~~~")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    // Extract backtick items
    const backtickRegex = /`([^`\n]+?)`/g;
    let match;
    while ((match = backtickRegex.exec(line)) !== null) {
      let text = match[1].trim();
      const originalText = text;

      // Skip if it's a file path
      if (isFilePath(text)) continue;

      // Check if this is a call form (with arguments in parens)
      let hasParens = /\(.*\)$/.test(text);
      let isCallForm = hasParens;

      // Check for flags first
      if (isFlagName(text)) {
        counts.flags++;
        if (!sources.flagNames.has(text) && !standardFlags.has(text) && !sources.cssVars.has(text)) {
          results.push({
            file: filePath.slice(root.length + 1),
            identifier: originalText,
            lineNum: lineNum + 1,
            category: "flag",
            found: false,
          });
        }
        continue;
      }

      // Check for ALL_CAPS names
      if (isCapsName(text)) {
        counts.capsNames++;
        if (!allowlist.has(text) && !sources.capsNames.has(text)) {
          results.push({
            file: filePath.slice(root.length + 1),
            identifier: originalText,
            lineNum: lineNum + 1,
            category: "ALL_CAPS",
            found: false,
          });
        }
        continue;
      }

      // Check for call forms first (before dotted) to avoid splitting on dots inside parens
      if (isCallForm) {
        counts.calls++;
        // Extract function name and check arguments
        const beforeParen = originalText.split("(")[0];
        const insideParen = originalText.slice(beforeParen.length + 1, -1);

        let foundMissing = false;

        // Check the function/method name part (may contain dots like obj.method)
        const nameParts = beforeParen.split(".");
        for (const part of nameParts) {
          if (part && isCodeIdentifier(part) && !allowlist.has(part) && !sources.camelPascal.has(part)) {
            foundMissing = true;
            break;
          }
        }

        // Check arguments if function name is OK
        if (!foundMissing) {
          const args = insideParen.split(",").map(s => {
            // Remove type annotation (everything after :)
            const argName = s.split(":")[0].trim();
            return argName;
          });
          for (const arg of args) {
            if (arg && isCodeIdentifier(arg) && !allowlist.has(arg) && !sources.camelPascal.has(arg)) {
              foundMissing = true;
              break;
            }
          }
        }

        if (foundMissing) {
          results.push({
            file: filePath.slice(root.length + 1),
            identifier: originalText,
            lineNum: lineNum + 1,
            category: "call",
            found: false,
          });
        }
        continue;
      }

      // Check for dotted forms (config.turnBudgetMs style)
      // Only for code references, not file paths
      if (text.includes(".") && !isFilePath(text)) {
        counts.dotted++;
        const parts = text.split(".");
        let foundMissing = false;
        for (const part of parts) {
          if (isCodeIdentifier(part) && !allowlist.has(part) && !sources.camelPascal.has(part)) {
            foundMissing = true;
            break;
          }
        }
        if (foundMissing) {
          results.push({
            file: filePath.slice(root.length + 1),
            identifier: originalText,
            lineNum: lineNum + 1,
            category: "dotted",
            found: false,
          });
        }
        continue;
      }

      // Regular camelCase/PascalCase identifier
      if (isCodeIdentifier(text) && !allowlist.has(text)) {
        counts.camelPascal++;
        if (!sources.camelPascal.has(text)) {
          results.push({
            file: filePath.slice(root.length + 1),
            identifier: originalText,
            lineNum: lineNum + 1,
            category: "camelPascal",
            found: false,
          });
        }
      }
    }
  }
}

// Main
const sources = loadSourceFiles();
const sourceSymbolCount = sources.camelPascal.size + sources.capsNames.size;
checkAgentsMdFiles(root, sources);

console.log(`\n✓ Identifier Check Results`);
console.log(`  Source symbols indexed: ${sourceSymbolCount} (camelCase: ${sources.camelPascal.size}, ALL_CAPS: ${sources.capsNames.size})`);
console.log(`  CLI flags found: ${sources.flagNames.size}`);
console.log(`  CSS custom properties found: ${sources.cssVars.size}`);
console.log(`  Issues found: ${results.length}\n`);

if (results.length > 0) {
  console.log("Missing identifiers:");
  for (const r of results) {
    const detail = r.part ? ` (part: ${r.part})` : "";
    console.log(`  ${r.file}:${r.lineNum}: ${r.category} identifier \`${r.identifier}\` not found in source${detail}`);
  }
  process.exit(1);
} else {
  console.log("✓ All identifiers found in source!");
  process.exit(0);
}
