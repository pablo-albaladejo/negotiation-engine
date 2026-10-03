import type { Schedule } from "../duels/schemas.js";
import type { Intent } from "../coordinator/coordinator.js";
import type { GameState } from "../state/game-state.js";

/**
 * Agenda: the calendar (`/api/schedule` → `upcoming`) turned into a per-action playbook, each with its
 * lead time and its effect on the routes. The coordinator looks at it BEFORE the routes propose: it can enable,
 * disable or readjust routes. Nothing here does a POST: what would need writing (open venue, open pack)
 * comes out as an agenda intent that is only printed; live it requires its CLI with --confirm and user approval.
 */

export interface AgendaItem {
  atHours: number;
  action: string;
  note?: string;
  params: Record<string, unknown>;
  /** Game hours until the event (negative if it already passed). */
  inHours: number;
  /** Game hour at which we act (event − lead time). */
  actAtHours: number;
  status: "due-now" | "due-soon" | "later";
  planned: string;
}

export interface DuelConfig {
  name: string;
  decay?: number;
  withDays: boolean;
  duelTicks?: number;
}

export interface AgendaEffects {
  /** Reason not to open new conversations (final, freeze, end of round). */
  stopOpens?: string;
  /** Duel configuration due now (0.5 h lead time). */
  duelConfig?: DuelConfig;
  /** Round ladders reset: re-plan (3 best deals per level per round). */
  replanLadder?: boolean;
  /** Set coming out: read its catalogue and our private values, and widen page targets. */
  newSet?: string;
  /** Extra cash from the grant: re-plan purchases. */
  extraCash?: number;
  /** Hard bench: firmer broker parameters. */
  firmerBroker?: boolean;
  /** Personas switching off (do not open with them). */
  disabledPersonas: string[];
  notes: string[];
  intents: Intent[];
}

interface Play {
  leadHours: number;
  planned: (p: Record<string, unknown>, note?: string) => string;
}

const name = (p: Record<string, unknown>, fallback: string) => (typeof p.name === "string" ? p.name : fallback);
const isHard = (p: Record<string, unknown>, note?: string) => /hard/i.test(name(p, "") + (note ?? ""));

/** Playbook per calendar action: lead time (game hours) and planned action. */
export const PLAYBOOK: Record<string, Play> = {
  bench: { leadHours: 1, planned: (p, n) => (isHard(p, n) ? "check the auto-vs-board decision + shadow broker, firmer broker params" : "check the auto-vs-board decision + shadow broker (dry-run intent)") },
  round: { leadHours: 0, planned: () => "re-plan the ladder (3 best deals per level per round)" },
  set_release: { leadHours: 0, planned: (p) => `read ${typeof p.set === "string" ? p.set : "new set"} catalogue + private values, update page targets` },
  grant_all: { leadHours: 0, planned: (p) => `re-plan purchases with +${typeof p.cash === "number" ? p.cash : "?"} P${Array.isArray(p.packs) && p.packs.length ? ", open the pack (dry-run intent)" : ""}` },
  duels: { leadHours: 0.5, planned: (p) => `switch duel config (${Array.isArray(p.issues) ? p.issues.join("+") : "price"}, decay ${typeof p.decay === "number" ? p.decay : "?"}, ${typeof p.duel_ticks === "number" ? p.duel_ticks : "?"} ticks)` },
  day_closes: { leadHours: 0.5, planned: () => "close or renew offers that would expire while closed" },
  day_opens: { leadHours: 0, planned: () => "doors open: routes resume" },
  announce: { leadHours: 0, planned: () => "stop opening conversations, close what is pending" },
  end_round: { leadHours: 0.5, planned: () => "stop opening conversations, close what is pending" },
  persona: { leadHours: 0.25, planned: (p) => `${typeof p.id === "string" ? p.id : "persona"} ${p.enabled === false ? "closes: no new threads" : "changes"}` },
};

/** "Soon" window: the moment to act falls within the next game hour. */
const SOON_HOURS = 1;
/** An event stays "due now" until this margin after its time. */
const GRACE_HOURS = 0.25;

export function agendaItems(schedule: Schedule | undefined, nowHours: number): AgendaItem[] {
  return (schedule?.upcoming ?? [])
    .map((u) => {
      const play = PLAYBOOK[u.action];
      const lead = play?.leadHours ?? 0;
      const params = u.params ?? {};
      const actAt = u.at_hours - lead;
      const status: AgendaItem["status"] = nowHours >= actAt && nowHours <= u.at_hours + GRACE_HOURS ? "due-now" : actAt > nowHours && actAt - nowHours <= SOON_HOURS ? "due-soon" : "later";
      return { atHours: u.at_hours, action: u.action, ...(u.note ? { note: u.note } : {}), params, inHours: Math.round((u.at_hours - nowHours) * 100) / 100, actAtHours: Math.round(actAt * 100) / 100, status, planned: play?.planned(params, u.note) ?? "no playbook entry: note only" };
    })
    .filter((i) => i.atHours + GRACE_HOURS >= nowHours)
    .sort((a, b) => a.atHours - b.atHours);
}

/** Effects of what is due now: the coordinator applies them before asking the routes for proposals. */
export function agendaEffects(items: readonly AgendaItem[], state: Pick<GameState, "env" | "ours">): AgendaEffects {
  const out: AgendaEffects = { disabledPersonas: [], notes: [], intents: [] };
  for (const i of items.filter((x) => x.status === "due-now")) {
    const p = i.params;
    const label = `${i.action}@h${i.atHours}`;
    switch (i.action) {
      case "bench":
        out.intents.push({ id: `agenda:bench:${i.atHours}`, route: "agenda", kind: "agenda", summary: `${label}: check the auto-vs-board decision (decideMechanism) + shadow broker${isHard(p, i.note) ? " (firmer params)" : ""} (switching to board needs --confirm --allow-venue-switch and user approval)` });
        if (isHard(p, i.note)) out.firmerBroker = true;
        break;
      case "round":
        out.replanLadder = true;
        out.notes.push(`${label}: ${name(p, "new round")} → ladder re-plan (3 best per level per round)`);
        break;
      case "set_release":
        if (typeof p.set === "string") out.newSet = p.set;
        out.notes.push(`${label}: ${i.note ?? "set release"} → read its catalogue + private values, update page targets`);
        break;
      case "grant_all":
        if (typeof p.cash === "number") out.extraCash = p.cash;
        out.notes.push(`${label}: +${p.cash ?? "?"} P → re-plan purchases`);
        if (Array.isArray(p.packs) && p.packs.length) out.intents.push({ id: `agenda:open-pack:${i.atHours}`, route: "agenda", kind: "agenda", summary: `${label}: open the granted pack (${p.packs.join(", ")})` });
        break;
      case "duels":
        out.duelConfig = { name: name(p, "duels"), ...(typeof p.decay === "number" ? { decay: p.decay } : {}), withDays: Array.isArray(p.issues) && p.issues.includes("days"), ...(typeof p.duel_ticks === "number" ? { duelTicks: p.duel_ticks } : {}) };
        out.notes.push(`${label}: duel config → ${PLAYBOOK.duels!.planned(p)}`);
        break;
      case "day_closes":
        out.intents.push({ id: `agenda:day-closes:${i.atHours}`, route: "agenda", kind: "agenda", summary: `${label}: review ${state.env.myOpenOffers} open offer(s): close or renew those that would expire while closed` });
        break;
      case "announce":
      case "end_round":
        out.stopOpens = `${label}: ${i.note ?? i.action}`;
        break;
      case "persona":
        if (typeof p.id === "string" && p.enabled === false) out.disabledPersonas.push(p.id);
        break;
      default:
        out.notes.push(`${label}: ${i.note ?? i.action}`);
    }
  }
  return out;
}

const hours = (h: number) => (Math.abs(h) < 1 ? `${Math.round(h * 60)} min` : `${h.toFixed(2)} h`);

/** "Duels I in 3.85 h → switch duel config … at h 6.0". */
export function formatAgendaItem(i: AgendaItem): string {
  const label = typeof i.params.name === "string" ? i.params.name : i.action;
  const when = i.inHours >= 0 ? `in ${hours(i.inHours)}` : `${hours(-i.inHours)} ago`;
  return `${i.status === "due-now" ? "DUE NOW " : i.status === "due-soon" ? "soon    " : ""}${label} (h ${i.atHours}) ${when} → ${i.planned}${i.actAtHours !== i.atHours ? ` at h ${i.actAtHours}` : ""}`;
}
