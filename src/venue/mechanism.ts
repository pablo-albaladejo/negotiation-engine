/**
 * ¿Pasamos nuestro venue de `auto` a `board`? Puro, sin E/S. Lo decide el código con sesiones medidas del Market Test:
 * en cada bench el broker corre en sombra (`pnpm bazaar:broker --shadow`, solo GET) y apunta qué habría casado nuestro
 * planificador frente a lo que cruzó el motor auto. El excedente es por cotizaciones (proxy: los límites ocultos no se ven).
 * RULES.md: auto gana la mitad de los puntos sin proceso; un board solo casa lo que case el broker (sin broker, ~0).
 */

import type { Schedule } from "../duels/schemas.js";

export type VenueMechanism = "auto" | "board";

/** Una sesión del Market Test medida en sombra (se persiste en `results/bazaar-live/bench-sessions.json`). */
export interface BenchSession {
  /** Hora de juego del bench (`at_hours` de `/api/schedule`). */
  benchAt: number;
  hard: boolean;
  /** Excedente por cotizaciones (bid − ask) de lo que habría casado nuestro planificador. */
  shadowSurplus: number;
  /** Excedente por cotizaciones de lo que cruzó el motor auto (de `recent` del libro). */
  autoSurplus: number;
  /** shadow / auto; ausente si auto no dio excedente medible (la sesión no cuenta como medida). */
  ratio?: number;
  pairsShadow: number;
  pairsAuto: number;
  /** Cruces de auto sin cotización conocida (no suman excedente). */
  autoUnknown: number;
  ticks: number;
}

export interface Heartbeat {
  /** ISO del último paso del proceso del broker. */
  ts: string;
  tick?: number;
  mode: "shadow" | "dry-run" | "live";
  venue?: string;
  mechanism?: string;
}

/** Umbrales con nombre; todos configurables. */
export interface MechanismThresholds {
  /** Sesiones medidas mínimas (con `ratio`). */
  minSessions: number;
  /** Sesiones «hard» medidas mínimas, solo si ya ha pasado un bench hard. */
  minHardSessions: number;
  /** Media de shadow/auto mínima para pasar a board. */
  minMeanRatio: number;
  /** En ninguna sesión la sombra puede quedar por debajo de auto más de esta fracción (0,05 = 5 %). */
  maxShortfall: number;
  /** Caja que debe quedar tras pagar fianza y apertura. */
  cashFloor: number;
  /** Nunca se recomienda cambiar a menos de N ticks de un bench. */
  noSwitchWithinTicks: number;
  /** Ticks para cerrar, abrir y arrancar el broker en vivo. */
  switchLeadTicks: number;
  /** Edad máxima del latido del broker (s) para darlo por sano. */
  maxHeartbeatAgeSec: number;
  /** Duración de una sesión de bench en ticks (calendario: `params.ticks`, 16). */
  benchTicks: number;
}

export const DEFAULT_MECHANISM_THRESHOLDS: MechanismThresholds = {
  minSessions: 2,
  minHardSessions: 1,
  minMeanRatio: 1.1,
  maxShortfall: 0.05,
  cashFloor: 20,
  noSwitchWithinTicks: 20,
  switchLeadTicks: 10,
  maxHeartbeatAgeSec: 120,
  benchTicks: 16,
};

export const VENUE_SWITCH_BOND = 250;
export const VENUE_SWITCH_FEE = 20;

export type MechanismRecommendation = "stay-auto" | "switch-to-board" | "insufficient-data" | "stay-board" | "back-to-auto";

export interface MechanismDecision {
  current: VenueMechanism | "none";
  sessions: BenchSession[];
  recommendation: MechanismRecommendation;
  reason: string;
  /** 0–1: más sesiones medidas y más sesiones con la sombra ≥ auto, más confianza. */
  confidence: number;
  costs: { bond: number; fee: number; cashAvailable?: number };
  nextBenchAt?: number;
  nextBenchHard?: boolean;
  ticksToBench?: number;
  meanRatio?: number;
  /** Benches hard ya pasados según el calendario. */
  hardPassed: number;
  heartbeat?: { ageSec: number; mode: Heartbeat["mode"] };
}

export interface MechanismInputs {
  current?: string;
  sessions: readonly BenchSession[];
  cash?: number;
  nowHours?: number;
  ticksPerHour: number;
  schedule?: Pick<Schedule, "upcoming">;
  heartbeat?: Heartbeat;
  now: Date;
}

const isHardBench = (u: { note?: string | undefined; params?: Record<string, unknown> | undefined }) =>
  /hard/i.test(`${typeof u.params?.name === "string" ? u.params.name : ""} ${u.note ?? ""}`);

/** Benches del calendario (`action: bench`), ordenados por hora. */
export function benchSlots(schedule: Pick<Schedule, "upcoming"> | undefined): { atHours: number; hard: boolean; ticks?: number }[] {
  return (schedule?.upcoming ?? [])
    .filter((u) => u.action === "bench")
    .map((u) => ({ atHours: u.at_hours, hard: isHardBench(u), ...(typeof u.params?.ticks === "number" ? { ticks: u.params.ticks } : {}) }))
    .sort((a, b) => a.atHours - b.atHours);
}

/** Ticks de juego por hora: tick / t_hours si hay ambos (hoy 60), si no 60. */
export function ticksPerHourOf(tick: number | undefined, tHours: number | undefined): number {
  return tick && tHours && tHours > 0 ? tick / tHours : 60;
}

/** Bench en curso a `nowHours` (dentro de su ventana de `benchTicks`), si lo hay. */
export function activeBench(
  schedule: Pick<Schedule, "upcoming"> | undefined,
  nowHours: number,
  ticksPerHour: number,
  t: Pick<MechanismThresholds, "benchTicks"> = DEFAULT_MECHANISM_THRESHOLDS,
): { atHours: number; hard: boolean } | undefined {
  return benchSlots(schedule).find((b) => nowHours >= b.atHours && nowHours < b.atHours + (b.ticks ?? t.benchTicks) / ticksPerHour);
}

/** La regla. Pura: misma entrada, misma recomendación. */
export function decideMechanism(i: MechanismInputs, t: MechanismThresholds = DEFAULT_MECHANISM_THRESHOLDS): MechanismDecision {
  const current: MechanismDecision["current"] = i.current === "auto" || i.current === "board" ? i.current : "none";
  const now = i.nowHours;
  const slots = benchSlots(i.schedule);
  const running = now !== undefined ? activeBench(i.schedule, now, i.ticksPerHour, t) : undefined;
  const next = now !== undefined ? slots.find((b) => b.atHours > now) : undefined;
  const ticksToBench = next && now !== undefined ? Math.floor((next.atHours - now) * i.ticksPerHour) : undefined;
  const hardPassed = now !== undefined ? slots.filter((b) => b.hard && b.atHours + (b.ticks ?? t.benchTicks) / i.ticksPerHour <= now).length : 0;
  const measured = i.sessions.filter((s) => s.ratio !== undefined && Number.isFinite(s.ratio));
  const hardMeasured = measured.filter((s) => s.hard).length;
  const ratios = measured.map((s) => s.ratio!);
  const meanRatio = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : undefined;
  const worst = ratios.length ? Math.min(...ratios) : undefined;
  const hbAge = i.heartbeat ? (i.now.getTime() - Date.parse(i.heartbeat.ts)) / 1000 : undefined;
  const hbOk = hbAge !== undefined && Number.isFinite(hbAge) && hbAge <= t.maxHeartbeatAgeSec;
  const confidence = measured.length ? Number(((measured.length / (measured.length + 2)) * (ratios.filter((r) => r >= 1).length / ratios.length)).toFixed(2)) : 0;
  const base = {
    current,
    sessions: [...i.sessions],
    confidence,
    costs: { bond: VENUE_SWITCH_BOND, fee: VENUE_SWITCH_FEE, ...(i.cash !== undefined ? { cashAvailable: i.cash } : {}) },
    ...(next ? { nextBenchAt: next.atHours, nextBenchHard: next.hard } : {}),
    ...(ticksToBench !== undefined ? { ticksToBench } : {}),
    ...(meanRatio !== undefined ? { meanRatio: Number(meanRatio.toFixed(3)) } : {}),
    hardPassed,
    ...(hbAge !== undefined && i.heartbeat ? { heartbeat: { ageSec: Math.round(hbAge), mode: i.heartbeat.mode } } : {}),
  };
  const out = (recommendation: MechanismRecommendation, reason: string): MechanismDecision => ({ ...base, recommendation, reason });

  if (current === "board") {
    // Red de seguridad: en board sin broker vivo la sesión puntúa ~0; mejor volver a auto antes del bench.
    const liveOk = hbOk && i.heartbeat?.mode === "live";
    if (!liveOk && next) return out("back-to-auto", `on board without a healthy live broker (${hbAge === undefined ? "no heartbeat" : `heartbeat ${Math.round(hbAge)} s, ${i.heartbeat?.mode}`}) before the bench at ${next.atHours} h: a board session without broker scores ~0`);
    return out("stay-board", liveOk ? "on board with a healthy live broker" : "on board; no bench ahead");
  }
  if (current === "none") return out("insufficient-data", "we run no venue (the free stall is auto); opening one is the venue CLI's job");

  if (measured.length < t.minSessions) return out("insufficient-data", `${measured.length}/${t.minSessions} bench sessions measured`);
  if (hardPassed > 0 && hardMeasured < t.minHardSessions) return out("insufficient-data", `a hard bench has passed but ${hardMeasured}/${t.minHardSessions} hard sessions measured`);
  if (meanRatio! < t.minMeanRatio) return out("stay-auto", `mean shadow/auto ${meanRatio!.toFixed(2)} < ${t.minMeanRatio}`);
  if (worst! < 1 - t.maxShortfall) return out("stay-auto", `worst session shadow/auto ${worst!.toFixed(2)} < ${(1 - t.maxShortfall).toFixed(2)} (shadow did worse than auto by more than ${Math.round(t.maxShortfall * 100)} %)`);
  const need = VENUE_SWITCH_BOND + VENUE_SWITCH_FEE + t.cashFloor;
  if (i.cash === undefined || i.cash < need) return out("stay-auto", `cash ${i.cash ?? "?"} P < ${need} P (bond ${VENUE_SWITCH_BOND} + fee ${VENUE_SWITCH_FEE} + floor ${t.cashFloor})`);
  if (running) return out("stay-auto", `bench at ${running.atHours} h is running: never switch during a session`);
  const minTicks = Math.max(t.noSwitchWithinTicks, t.switchLeadTicks);
  if (ticksToBench !== undefined && ticksToBench < minTicks) return out("stay-auto", `${ticksToBench} ticks to the bench at ${next!.atHours} h < ${minTicks} (no switch within ${t.noSwitchWithinTicks} ticks of a bench, ${t.switchLeadTicks} to close + open + start the broker)`);
  if (!hbOk) return out("stay-auto", `broker process not healthy (${hbAge === undefined ? "no heartbeat" : `heartbeat ${Math.round(hbAge)} s old > ${t.maxHeartbeatAgeSec} s`})`);
  return out("switch-to-board", `${measured.length} sessions measured (${hardMeasured} hard), mean shadow/auto ${meanRatio!.toFixed(2)} ≥ ${t.minMeanRatio}, worst ${worst!.toFixed(2)}, cash ${i.cash} P ≥ ${need} P, ${ticksToBench ?? "?"} ticks to the next bench, broker heartbeat ${Math.round(hbAge!)} s`);
}

/** Una línea: «venue: auto · bench 2/2 measured · shadow/auto 1.14 → recommend board (needs approval)». */
export function formatMechanismLine(d: MechanismDecision, t: MechanismThresholds = DEFAULT_MECHANISM_THRESHOLDS): string {
  const measured = d.sessions.filter((s) => s.ratio !== undefined).length;
  const verdict: Record<MechanismRecommendation, string> = {
    "switch-to-board": "recommend board (needs approval)",
    "stay-auto": "stay auto",
    "insufficient-data": "insufficient data, stay auto",
    "stay-board": "stay board",
    "back-to-auto": "recommend back to auto (needs approval)",
  };
  return (
    `venue: ${d.current} · bench ${measured}/${t.minSessions} measured` +
    `${d.meanRatio !== undefined ? ` · shadow/auto ${d.meanRatio.toFixed(2)}` : ""}` +
    `${d.nextBenchAt !== undefined ? ` · next bench ${d.nextBenchAt} h${d.nextBenchHard ? " (hard)" : ""}${d.ticksToBench !== undefined ? ` in ${d.ticksToBench} ticks` : ""}` : ""}` +
    ` · broker ${d.heartbeat ? `${d.heartbeat.mode} ${d.heartbeat.ageSec} s ago` : "no heartbeat"}` +
    ` → ${verdict[d.recommendation]} · ${d.reason}`
  );
}
