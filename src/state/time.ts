import { createHash } from "node:crypto";
import type { Schedule } from "../duels/schemas.js";

/**
 * Tiempo del tick: hora de juego, hora de pared, fase del día, ronda y peso, ticks que quedan hoy y deriva frente
 * al plan. El plan sale de `clock.days` (aperturas y cierres de pared) y de los `day_opens` del calendario: una
 * hora de pared con puertas abiertas es una hora de juego. Si el reloj se paró, la deriva es negativa.
 */

export interface TimeState {
  tick: number;
  gameHour?: number;
  wall: string;
  dayPhase: "open" | "closed";
  day?: string;
  round?: { n?: number; name?: string; weight?: number };
  tickSeconds?: number;
  ticksLeftToday?: number;
  closes?: string;
  nextOpens?: string;
  nextName?: string;
  /** Hora de juego que tocaría ahora según el plan y diferencia (juego − plan), en horas. */
  drift?: { planHour: number; offsetHours: number };
  /** Huella del calendario pendiente; si cambia entre ticks, hay que releerlo. */
  scheduleHash: string;
  scheduleChanged: boolean;
}

const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const str = (x: unknown): string | undefined => (typeof x === "string" && x ? x : undefined);
const obj = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});

export function scheduleHash(s: Schedule | undefined): string {
  const items = (s?.upcoming ?? []).map((u) => [u.at_hours, u.action, u.params ?? {}]);
  return createHash("sha1").update(JSON.stringify(items)).digest("hex").slice(0, 12);
}

/** Hora de juego en que abre cada día: el primero en 0 y el resto por su `day_opens` del calendario. */
function dayStartHours(days: Record<string, unknown>[], s: Schedule | undefined): Map<string, number> {
  const out = new Map<string, number>();
  for (const u of s?.upcoming ?? []) if (u.action === "day_opens" && str(u.params?.day)) out.set(str(u.params!.day)!, u.at_hours);
  // El día de hoy (o el primero) sin `day_opens` pendiente: se reconstruye hacia atrás con la duración de pared.
  for (let k = days.length - 1; k >= 0; k--) {
    const d = str(days[k]!.day);
    if (!d || out.has(d)) continue;
    const next = days[k + 1];
    const nextStart = next ? out.get(str(next.day) ?? "") : undefined;
    const len = (Date.parse(str(days[k]!.closes) ?? "") - Date.parse(str(days[k]!.opens) ?? "")) / 3_600_000;
    if (nextStart !== undefined && Number.isFinite(len)) out.set(d, nextStart - len);
    else if (k === 0) out.set(d, 0);
  }
  return out;
}

export function buildTime(clockRaw: unknown, schedule: Schedule | undefined, leaderboardRaw: unknown, prevHash: string | undefined, now: Date = new Date()): TimeState {
  const c = obj(clockRaw);
  const tick = num(c.tick) ?? 0;
  const gameHour = num(c.t_hours);
  const tickSeconds = num(c.tick_seconds);
  const dayPhase: TimeState["dayPhase"] = str(c.doors) === "open" ? "open" : "closed";
  const days = Array.isArray(c.days) ? (c.days as unknown[]).map(obj) : [];
  const today = str(c.today);
  const starts = dayStartHours(days, schedule);
  const idx = days.findIndex((d) => d.day === today);
  let drift: TimeState["drift"];
  let dayEnd: number | undefined;
  if (idx >= 0) {
    const d = days[idx]!;
    const start = starts.get(today!);
    const opens = Date.parse(str(d.opens) ?? "");
    const closes = Date.parse(str(d.closes) ?? "");
    if (start !== undefined && Number.isFinite(opens) && Number.isFinite(closes)) {
      dayEnd = start + (closes - opens) / 3_600_000;
      const planHour = Math.min(dayEnd, Math.max(start, start + (now.getTime() - opens) / 3_600_000));
      if (gameHour !== undefined) drift = { planHour: Math.round(planHour * 100) / 100, offsetHours: Math.round((gameHour - planHour) * 100) / 100 };
    }
  }
  // Peso de la ronda: `leaderboard.rounds` (la ronda activa) o el último `round` del calendario ya pasado.
  const lbRounds = Array.isArray(obj(leaderboardRaw).rounds) ? (obj(leaderboardRaw).rounds as unknown[]).map(obj) : [];
  const roundN = num(c.round);
  const lbRound = lbRounds.find((r) => num(r.round) === roundN) ?? lbRounds.find((r) => r.status === "active");
  const weight = num(lbRound?.weight);
  const hash = scheduleHash(schedule);
  return {
    tick,
    ...(gameHour !== undefined ? { gameHour } : {}),
    wall: now.toISOString(),
    dayPhase,
    ...(today ? { day: today } : {}),
    round: { ...(roundN !== undefined ? { n: roundN } : {}), ...(str(c.round_name) ? { name: str(c.round_name)! } : {}), ...(weight !== undefined ? { weight } : {}) },
    ...(tickSeconds !== undefined ? { tickSeconds } : {}),
    ...(dayEnd !== undefined && gameHour !== undefined && tickSeconds ? { ticksLeftToday: Math.max(0, Math.round(((dayEnd - gameHour) * 3600) / tickSeconds)) } : {}),
    ...(str(c.closes) ? { closes: str(c.closes)! } : {}),
    ...(str(c.next_opens) ? { nextOpens: str(c.next_opens)! } : {}),
    ...(str(c.next_name) ? { nextName: str(c.next_name)! } : {}),
    ...(drift ? { drift } : {}),
    scheduleHash: hash,
    scheduleChanged: prevHash !== undefined && prevHash !== hash,
  };
}

const short = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "Europe/Madrid" })} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" })}`;
};

/** «h 2.65 · R1 ×0.5 · closed until Sat 09:00 · tick 159 · 60 s/tick · …». */
export function formatTime(t: TimeState): string {
  const r = t.round;
  const parts = [
    `h ${t.gameHour?.toFixed(2) ?? "?"}`,
    `R${r?.n ?? "?"} ×${r?.weight ?? "?"}`,
    t.dayPhase === "open" ? `open until ${t.closes ? short(t.closes) : "?"}` : `closed until ${t.nextOpens ? short(t.nextOpens) : "?"}`,
    `tick ${t.tick}`,
    `${t.tickSeconds ?? "?"} s/tick`,
    ...(t.ticksLeftToday !== undefined ? [`${t.ticksLeftToday} ticks left today`] : []),
    ...(t.drift ? [`drift ${t.drift.offsetHours >= 0 ? "+" : ""}${t.drift.offsetHours} h vs plan (h ${t.drift.planHour})`] : []),
    ...(t.scheduleChanged ? ["SCHEDULE CHANGED: re-read"] : []),
  ];
  return parts.join(" · ");
}
