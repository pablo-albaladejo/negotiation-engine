import { realpath } from "node:fs/promises";
import { join, sep } from "node:path";

/** Run, game or session identifier: a single segment, no `..` (design.md §4). */
const SAFE_ID = /^[A-Za-z0-9_.-]{1,128}$/;

export function isSafeId(id: string): boolean {
  return SAFE_ID.test(id) && !id.includes("..");
}

/**
 * Real path of `root/...parts` only if it exists and, once symlinks are resolved, stays inside
 * `root`; otherwise `null` (the caller answers 404 without revealing the path).
 */
export async function resolveInside(root: string, ...parts: string[]): Promise<string | null> {
  try {
    const rootReal = await realpath(root);
    const real = await realpath(join(rootReal, ...parts));
    return real === rootReal || real.startsWith(rootReal + sep) ? real : null;
  } catch {
    return null;
  }
}
