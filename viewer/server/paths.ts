import { realpath } from "node:fs/promises";
import { join, sep } from "node:path";

/** Identificador de run, partida o sesión: un solo segmento, sin `..` (design.md §4). */
const SAFE_ID = /^[A-Za-z0-9_.-]{1,128}$/;

export function isSafeId(id: string): boolean {
  return SAFE_ID.test(id) && !id.includes("..");
}

/**
 * Ruta real de `root/...parts` solo si existe y, resueltos los enlaces simbólicos, queda dentro de
 * `root`; si no, `null` (el llamador responde 404 sin revelar la ruta).
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
