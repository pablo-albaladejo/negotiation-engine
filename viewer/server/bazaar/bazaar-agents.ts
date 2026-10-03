import { open, readdir, stat } from "node:fs/promises";
import { isSafeId, resolveInside } from "../paths.js";

/**
 * Liveness signal of each agent: when it last wrote its trace in
 * `results/bazaar-live/<date>/`. Read-only (stat + file tail).
 */

export interface AgentStatus {
  agent: "dealers" | "duels" | "broker" | "trades";
  /** Last write (ISO) or `null` if there is no trace. */
  last_at: string | null;
  last_tick: number | null;
  /** Last human-readable action (e.g."counter · rule adaptive" o "dry-run"). */
  detail: string | null;
}

const FILES: { agent: AgentStatus["agent"]; files: string[] }[] = [
  { agent: "dealers", files: ["decisions.jsonl"] },
  { agent: "duels", files: ["duels-state.json"] },
  { agent: "broker", files: ["broker.jsonl", "bench.jsonl"] },
];

async function lastLine(path: string, bytes = 8_192): Promise<Record<string, unknown> | null> {
  try {
    const fh = await open(path, "r");
    try {
      const size = (await fh.stat()).size;
      const start = Math.max(0, size - bytes);
      const buf = Buffer.alloc(size - start);
      await fh.read(buf, 0, buf.length, start);
      const lines = buf.toString("utf8").trim().split("\n");
      const parsed: unknown = JSON.parse(lines[lines.length - 1] ?? "");
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } finally {
      await fh.close();
    }
  } catch {
    return null;
  }
}

function describe(line: Record<string, unknown> | null): { tick: number | null; detail: string | null } {
  if (!line) return { tick: null, detail: null };
  const tick = typeof line.tick === "number" ? line.tick : null;
  const parts = [line.dryRun === true ? "dry-run" : null, typeof line.action === "string" ? line.action : null, typeof line.rule === "string" && line.rule !== "dry-run" ? `rule ${line.rule}` : null];
  const detail = parts.filter(Boolean).join(" · ");
  return { tick, detail: detail || null };
}

/** Status of dealers, duels and broker from their traces (the most recent date each file has). */
export async function agentStatuses(bazaarDir: string): Promise<AgentStatus[]> {
  let dates: string[] = [];
  try {
    dates = (await readdir(bazaarDir)).filter((d) => isSafeId(d) && /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse();
  } catch {
    dates = [];
  }
  const out: AgentStatus[] = [];
  for (const { agent, files } of FILES) {
    let best: { mtime: Date; path: string; file: string } | null = null;
    for (const date of dates) {
      for (const file of files) {
        const path = await resolveInside(bazaarDir, date, file);
        if (!path) continue;
        try {
          const s = await stat(path);
          if (!best || s.mtime > best.mtime) best = { mtime: s.mtime, path, file };
        } catch {
          // no file on that date
        }
      }
      if (best) break;
    }
    if (!best) {
      out.push({ agent, last_at: null, last_tick: null, detail: null });
      continue;
    }
    const { tick, detail } = best.file.endsWith(".jsonl") ? describe(await lastLine(best.path)) : { tick: null, detail: null };
    out.push({ agent, last_at: best.mtime.toISOString(), last_tick: tick, detail });
  }
  // The shadow broker only writes bench.jsonl during a bench: its heartbeat (every poll) says whether it is alive.
  const hb = await brokerHeartbeat(bazaarDir);
  const i = out.findIndex((a) => a.agent === "broker");
  const prev = i >= 0 ? out[i]!.last_at : null;
  if (hb?.last_at && i >= 0 && (prev === null || Date.parse(hb.last_at) > Date.parse(prev))) out[i] = hb;
  return out;
}

/** `broker-heartbeat.json` at the root of `results/bazaar-live/` ({ts, tick, mode, mechanism}); null if missing or unreadable. */
async function brokerHeartbeat(bazaarDir: string): Promise<AgentStatus | null> {
  try {
    const path = await resolveInside(bazaarDir, "broker-heartbeat.json");
    if (!path) return null;
    const fh = await open(path, "r");
    let raw: string;
    try {
      raw = (await fh.readFile()).toString("utf8");
    } finally {
      await fh.close();
    }
    const hb = JSON.parse(raw) as { ts?: unknown; tick?: unknown; mode?: unknown; mechanism?: unknown };
    const at = typeof hb.ts === "string" && !Number.isNaN(Date.parse(hb.ts)) ? hb.ts : (await stat(path)).mtime.toISOString();
    const detail = [typeof hb.mode === "string" ? hb.mode : null, typeof hb.mechanism === "string" ? `venue ${hb.mechanism}` : null].filter(Boolean).join(" · ");
    return { agent: "broker", last_at: at, last_tick: typeof hb.tick === "number" ? hb.tick : null, detail: detail || null };
  } catch {
    return null;
  }
}
