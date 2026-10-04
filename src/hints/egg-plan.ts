import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalize } from "../flags/flags.js";
import { PROBE_WINDOW_TICKS, type EggFind } from "../state/world.js";

/**
 * The egg probe plan Pablo approved for Sunday (deep dive, 4 Oct; `.omc/specs/deep-dive-eggs-resto.md`): which literal
 * phrase goes to which dealer, the odds, what we stand to win and what it costs. An egg fires when our message contains
 * its phrase literally (accents and case ignored, docs/bazaar/personas.md §6), so each item carries `key`, the substring
 * that must appear. Never a figure: the stakes and costs are prose, and the phrases carry no digit.
 */

export type EggPlanRoute = "play" | "manual" | "excluded";

export interface EggPlanItem {
  n: number;
  persona: string;
  /** How it is sent: inside a play counteroffer, by hand with `results/probe.sh`, or not at all. */
  route: EggPlanRoute;
  /** The whole line we send. */
  line: string;
  /** The literal substring the egg needs; a message of ours to `persona` that contains it counts as this probe. */
  key: string;
  odds: string;
  stake: string;
  cost: string;
  note?: string;
}

export type EggPlanStatus = "pending" | "sent" | "hit" | "miss" | "excluded";

export interface EggPlanRow extends EggPlanItem {
  status: EggPlanStatus;
  /** Tick of our message that carried `key`, if any. */
  sentTick?: number;
  /** Tick of the egg it fired. */
  hitTick?: number;
  /** Earliest tick for the next manual probe to this persona (≥ 5 ticks after our last plan probe there). */
  nextAllowedTick?: number;
}

/** Ticks between two manual probes to the same dealer (the auditor flags dealer-spam below it). */
export const EGG_PLAN_SPACING_TICKS = 5;

export const EGG_PLAN: readonly EggPlanItem[] = [
  {
    n: 1,
    persona: "chato",
    route: "manual",
    // Hit at t1814 (4 Oct, thread 2684): t12's hit showed Chato reacting to the phrase in `line` (game text); the
    // "Plaza Mayor, con caña" line rivals saw was the egg's fixed reply, and sending it missed four times.
    line: "Plaza Mayor, bocadillo, caña bien tirada. Un bocadillo de calamares en la Plaza Mayor y una caña bien tirada.", // game text
    key: "caña bien tirada", // game text
    odds: "won t1814",
    stake: "sobre_barrio",
    cost: "0 P, 1 probe",
  },
  {
    n: 2,
    persona: "abuela",
    route: "manual",
    line: "Abuela, cocido con tres vuelcos; cocido madrileño con sus tres vuelcos, como Dios manda.", // game text
    key: "cocido con tres vuelcos", // game text
    odds: "high: 3 finds today (t18, t09, t16), still alive",
    stake: "a card (rivals got LAV-08, SAL-06, LAT-06)",
    cost: "0 P, 1 probe",
  },
  {
    n: 3,
    persona: "pilar",
    route: "manual",
    line: "Doña Pilar, ¿era el lince su cromo imposible, el que nunca salía en Vida y Color, y sus láminas siguen bajo llave en la caja fuerte desde los sesenta?", // game text
    key: "cromo imposible", // game text
    odds: "~15-20 %",
    stake: "unknown",
    cost: "0 P, 1 probe",
    note: "if it misses, Pilar is closed",
  },
  {
    n: 4,
    persona: "picaros",
    route: "manual",
    line: "Hermanos, conozco el timo del nazareno y el del tocomocho.", // game text
    key: "timo del nazareno", // game text
    odds: "~8 %",
    stake: "unknown",
    cost: "0 P, 1 probe",
  },
  {
    n: 5,
    persona: "abuela",
    route: "manual",
    line: "Abuela, ¿la caja de galletas donde Antonio guardó la chulapa dorada?", // game text
    key: "caja de galletas", // game text
    odds: "~10 %",
    stake: "unknown",
    cost: "0 P, ≥ 5 ticks after no. 2",
  },
  {
    n: 0,
    persona: "banco",
    route: "excluded",
    line: "Poderoso caballero es don Dinero, don Ernesto.", // game text
    key: "poderoso caballero", // game text
    odds: "~12 %",
    stake: "—",
    cost: "excluded: Pablo decided no threads with the banco",
  },
];

/** One message of ours to a persona, from the recorded team stream (our own text). */
export interface OurPersonaMessage {
  tick: number;
  persona: string;
  text: string;
}

/** Our messages to personas recorded today (`stream-team.jsonl`, sender = our team, kind persona). Never throws. */
export function recordedOurPersonaMessages(dayDir: string, team: string | undefined): OurPersonaMessage[] {
  if (!team) return [];
  let raw: string;
  try {
    raw = readFileSync(join(dayDir, "stream-team.jsonl"), "utf8");
  } catch {
    return [];
  }
  const out: OurPersonaMessage[] = [];
  for (const line of raw.split("\n")) {
    if (!line.includes('"thread.message"') || !line.includes(`"sender":"${team}"`)) continue;
    try {
      const data = (JSON.parse(line) as { data?: { tick?: unknown; payload?: Record<string, unknown> } }).data;
      const p = data?.payload;
      if (!p || p.kind !== "persona" || typeof p.text !== "string" || typeof p.with !== "string" || typeof data?.tick !== "number") continue;
      out.push({ tick: data.tick, persona: p.with, text: p.text });
    } catch {
      // truncated line (the recorder may be writing it): skipped
    }
  }
  return out;
}

/**
 * Status of each plan item from our messages and our eggs: sent if a message of ours to that persona contains its key,
 * hit if an egg of ours at that persona came within `PROBE_WINDOW_TICKS` after it, miss once that window has passed.
 */
export function eggPlanRows(input: { messages: readonly OurPersonaMessage[]; ourEggs: readonly EggFind[]; tick: number; plan?: readonly EggPlanItem[] }): EggPlanRow[] {
  const plan = input.plan ?? EGG_PLAN;
  const rows: EggPlanRow[] = plan.map((item) => {
    if (item.route === "excluded") return { ...item, status: "excluded" };
    const key = normalize(item.key);
    const sent = input.messages.filter((m) => m.persona === item.persona && normalize(m.text).includes(key)).sort((a, b) => a.tick - b.tick)[0];
    if (!sent) return { ...item, status: "pending" };
    const hit = input.ourEggs.find((e) => e.persona === item.persona && e.tick >= sent.tick && e.tick <= sent.tick + PROBE_WINDOW_TICKS);
    if (hit) return { ...item, status: "hit", sentTick: sent.tick, hitTick: hit.tick };
    return { ...item, status: input.tick > sent.tick + PROBE_WINDOW_TICKS ? "miss" : "sent", sentTick: sent.tick };
  });
  // Spacing: a pending manual probe waits ≥ 5 ticks after our last plan probe to the same persona.
  for (const r of rows) {
    if (r.status !== "pending" || r.route !== "manual") continue;
    const last = Math.max(-Infinity, ...rows.filter((x) => x.persona === r.persona && x.sentTick !== undefined).map((x) => x.sentTick!));
    if (Number.isFinite(last)) r.nextAllowedTick = last + EGG_PLAN_SPACING_TICKS;
  }
  return rows;
}
