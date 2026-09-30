import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function collectFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) return collectFiles(fullPath);
    if (/\.(tsx?|jsx?)$/.test(entry)) return [fullPath];
    return [];
  });
}

describe("no dangerouslySetInnerHTML in the package", () => {
  it("does not use dangerouslySetInnerHTML anywhere in src", () => {
    const srcDir = join(__dirname, "..", "src");
    const files = collectFiles(srcDir);
    const offenders = files.filter((file) => readFileSync(file, "utf8").includes("dangerouslySetInnerHTML"));
    expect(offenders).toEqual([]);
  });
});
