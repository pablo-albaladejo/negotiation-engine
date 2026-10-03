import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

/**
 * Grants from the organisers (`admin.grant` on our team stream, `<day>/stream-team.jsonl` from the recorder): cash,
 * packs and cards every team receives (daily allowance, news prizes, the +400 / +150 P top-ups). The viewer labels
 * them as a grant so a cash jump never reads as a trade or an error. Only lines naming the event are parsed, and each
 * file is re-read only when its size changes. Read-only.
 */

const num = z.number();
const str = z.string();
const LineSchema = z.looseObject({
  data: z.looseObject({
    id: num.nullish(),
    tick: num.nullish(),
    type: str.nullish(),
    actor: str.nullish(),
    payload: z.looseObject({ team: str.nullish(), cash: num.nullish(), packs: z.array(z.unknown()).nullish(), cards: z.array(z.unknown()).nullish(), reason: str.nullish() }).nullish(),
  }),
});

export interface Grant {
  day: string;
  tick: number | null;
  /** schedule | news | … (who granted it). */
  actor: string | null;
  cash: number;
  packs: string[];
  cards: string[];
  reason: string | null;
}

const cache = new Map<string, { size: number; grants: Grant[] }>();
const strings = (xs: readonly unknown[] | null | undefined) => (xs ?? []).flatMap((x) => (typeof x === "string" ? [x] : []));

async function grantsInFile(path: string, day: string, team: string): Promise<Grant[]> {
  let size: number;
  try {
    size = (await stat(path)).size;
  } catch {
    return [];
  }
  const hit = cache.get(path);
  if (hit && hit.size === size) return hit.grants;
  const text = await readFile(path, "utf8").catch(() => "");
  const seen = new Set<number>();
  const grants: Grant[] = [];
  for (const line of text.split("\n")) {
    if (!line.includes('"admin.grant"')) continue;
    let raw: unknown;
    try {
      raw = JSON.parse(line);
    } catch {
      continue;
    }
    const p = LineSchema.safeParse(raw);
    if (!p.success || p.data.data.type !== "admin.grant") continue;
    const d = p.data.data;
    if (d.id != null && seen.has(d.id)) continue;
    if (d.id != null) seen.add(d.id);
    if (d.payload?.team && d.payload.team !== team) continue;
    grants.push({ day, tick: d.tick ?? null, actor: d.actor ?? null, cash: d.payload?.cash ?? 0, packs: strings(d.payload?.packs), cards: strings(d.payload?.cards), reason: d.payload?.reason ?? null });
  }
  cache.set(path, { size, grants });
  return grants;
}

/** Every grant to us, oldest first, across the recorder's day folders. */
export async function grantsOf(bazaarDir: string, team: string): Promise<Grant[]> {
  let days: string[];
  try {
    days = (await readdir(bazaarDir)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  } catch {
    return [];
  }
  const out: Grant[] = [];
  for (const day of days) out.push(...(await grantsInFile(join(bazaarDir, day, "stream-team.jsonl"), day, team)));
  return out;
}
