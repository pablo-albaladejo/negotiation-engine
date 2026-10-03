import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { FeedEvent } from "../../state/world.js";

/**
 * Assets we received from another team today (Pablo/coordinator, 3 Oct: MAL-10 bought from t13 at 30 scored +50.2 neg;
 * selling it to a dealer scores 0 and loses the copy). The dealers planner never offers them to a dealer. Read from the
 * feed's settlements each tick and, the first time, from the recorder's `stream-public.jsonl`; kept in
 * team-received.json in the day folder so a restart keeps them.
 */

const obj = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
const TEAM = /^t\d+$/;

/** Asset ids a settlement hands to `team` from another team (not a dealer, not a grant). */
export function receivedFromTeams(payload: Record<string, unknown>, team: string): number[] {
  if (typeof payload.persona === "string" && payload.persona) return [];
  return (Array.isArray(payload.items) ? payload.items : [])
    .map(obj)
    .filter((i) => i.kind === "card" && i.to === team && typeof i.frm === "string" && TEAM.test(i.frm) && i.frm !== team && typeof i.id === "number")
    .map((i) => i.id as number);
}

const seen = new Map<string, Set<number>>();

function seed(dir: string, team: string): Set<number> {
  const out = new Set<number>();
  try {
    const saved = join(dir, "team-received.json");
    if (existsSync(saved)) for (const id of JSON.parse(readFileSync(saved, "utf8")).assets as number[]) out.add(id);
    const stream = join(dir, "stream-public.jsonl");
    if (existsSync(stream)) {
      for (const line of readFileSync(stream, "utf8").split("\n")) {
        if (!line.includes('"settlement"') || !line.includes(`"${team}"`)) continue;
        try {
          for (const id of receivedFromTeams(obj(obj(obj(JSON.parse(line)).data).payload), team)) out.add(id);
        } catch {
          // A torn line at the end of the recorder's file.
        }
      }
    }
  } catch {
    // No history yet: the feed fills it from now on.
  }
  return out;
}

/** Adds this tick's settlements and returns every asset id received from a team today (best-effort save). */
export function updateTeamReceived(dir: string, team: string, events: readonly FeedEvent[]): ReadonlySet<number> {
  const key = `${dir}|${team}`;
  let ids = seen.get(key);
  if (!ids) seen.set(key, (ids = seed(dir, team)));
  const before = ids.size;
  for (const e of events) if (e.type === "settlement") for (const id of receivedFromTeams(e.payload, team)) ids.add(id);
  if (ids.size !== before || !existsSync(join(dir, "team-received.json"))) {
    try {
      mkdirSync(dir, { recursive: true });
      const path = join(dir, "team-received.json");
      writeFileSync(`${path}.tmp`, JSON.stringify({ team, assets: [...ids] }));
      renameSync(`${path}.tmp`, path);
    } catch {
      // The file is a cache; the in-memory set still serves this run.
    }
  }
  return ids;
}
