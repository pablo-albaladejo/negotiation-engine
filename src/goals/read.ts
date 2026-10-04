import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { GoalsFile, StrategiesFile } from "./goals.js";

/** Goals and strategy registry as `GameState` carries them: shown only, no route decides from them (phase 1). */
export interface GoalsState {
  goals: GoalsFile | null;
  strategies: StrategiesFile | null;
}

/** Folder of goals.json and strategies.json (out of git). */
export const goalsStateDir = (root: string = process.cwd()): string => join(root, "results", "state");

function readFile<T extends { version?: unknown }>(file: string): T | null {
  if (!existsSync(file)) return null;
  try {
    const data = JSON.parse(readFileSync(file, "utf8")) as T;
    return data && data.version === 1 ? data : null;
  } catch {
    // A file caught mid-write (or hand-edited badly) is skipped this tick; the next one reads it again.
    return null;
  }
}

/** Reads both files; a missing or unreadable one is null. */
export function readGoalsState(dir: string = goalsStateDir()): GoalsState {
  return { goals: readFile<GoalsFile>(join(dir, "goals.json")), strategies: readFile<StrategiesFile>(join(dir, "strategies.json")) };
}
