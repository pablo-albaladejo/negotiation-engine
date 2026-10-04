import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Per-counterparty score room. Payday caps the neg_points a team trade scores, and the cap is per counterparty and
 * cumulative: t05 gave +50 (CHA-05 sale) and then 0 for RET-11 bought at 240 against a value of 288 (score-audit,
 * 4 Oct t1585 and t1730); t13 gave +50.2 (MAL-10). Room = cap − what score-audit already credited to that team.
 * Pure except `loadCounterpartyRoom`, which only reads the score-audit files.
 */
export const COUNTERPARTY_CAP = 50;
/** Below this much room left a team trade is not worth making for points (fees and noise eat it). */
export const MIN_ROOM = 10;

interface AuditLine {
  delta?: number;
  deals?: { source?: string; counterparty?: string; expected?: number }[];
}

/**
 * Score used per counterparty: a record whose only deals are team deals with one team credits its whole Δ to that
 * team; a mixed record credits each team deal its expected gain (conservative: it may overstate what was used).
 */
export function counterpartyUsed(records: readonly AuditLine[]): Map<string, number> {
  const used = new Map<string, number>();
  const add = (team: string, x: number) => used.set(team, (used.get(team) ?? 0) + Math.max(0, x));
  for (const r of records) {
    const deals = r.deals ?? [];
    const team = deals.filter((d) => d.source === "team" && d.counterparty);
    if (!team.length) continue;
    const teams = new Set(team.map((d) => d.counterparty!));
    if (team.length === deals.length && teams.size === 1) add(team[0]!.counterparty!, r.delta ?? 0);
    else for (const d of team) add(d.counterparty!, d.expected ?? 0);
  }
  return used;
}

/** Room left per counterparty (never below 0); a team with no record has the full cap. */
export function counterpartyRoom(records: readonly AuditLine[], cap = COUNTERPARTY_CAP): Map<string, number> {
  const room = new Map<string, number>();
  for (const [team, u] of counterpartyUsed(records)) room.set(team, Math.max(0, Math.round((cap - u) * 10) / 10));
  return room;
}

export const roomOf = (room: ReadonlyMap<string, number> | undefined, team: string, cap = COUNTERPARTY_CAP): number => room?.get(team) ?? cap;

/** Every day's score-audit.jsonl under results/bazaar-live/ (the cap spans days). Unreadable lines are skipped. */
export function loadCounterpartyRoom(root: string, cap = COUNTERPARTY_CAP): Map<string, number> {
  const dir = join(root, "results", "bazaar-live");
  const records: AuditLine[] = [];
  if (!existsSync(dir)) return new Map();
  for (const day of readdirSync(dir)) {
    const file = join(dir, day, "score-audit.jsonl");
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        records.push(JSON.parse(line) as AuditLine);
      } catch {
        // partial line while the writer appends
      }
    }
  }
  return counterpartyRoom(records, cap);
}
