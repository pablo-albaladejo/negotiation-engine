import { BazaarError, type Topic } from "../client.js";
import type { Side } from "../negotiator.js";
import type { DealerRef } from "../view.js";
import { SimApi } from "./api.js";
import { DealerSim } from "./dealer.js";
import type { DealerProfile, SimParams } from "./model.js";
import type { Policy } from "./policies.js";

/**
 * Arnés offline: semillas × hipótesis de suelo × artículos × políticas contra el `DealerSim`.
 * Cada episodio es un hilo nuevo con un simulador nuevo (sin memoria entre episodios).
 */

export interface Scenario {
  name: string;
  topic: Topic;
  side: Side;
  /** Reserva nuestra (ASSUMPTION): compra = list_price (pagaríamos hasta su lista); venta = your_value de una repetida. */
  reservation: number;
}

export const ABUELA_SCENARIOS: readonly Scenario[] = [
  { name: "buy-pack", topic: { buy: { pack: "sobre_barrio" } }, side: "buy", reservation: 26 },
  { name: "buy-common", topic: { buy: { rarity: "common", set: "LAV" } }, side: "buy", reservation: 10 },
  { name: "buy-uncommon", topic: { buy: { rarity: "uncommon", set: "LAV" } }, side: "buy", reservation: 25 },
  { name: "sell-common", topic: { sell: { assets: [1] } }, side: "sell", reservation: 3 },
  { name: "sell-uncommon", topic: { sell: { assets: [2] } }, side: "sell", reservation: 8 },
];

/** Activos de los escenarios de venta: 1 = común, 2 = infrecuente. */
export const scenarioAssetRarity = (id: number) => (id === 1 ? "common" : id === 2 ? "uncommon" : undefined);

export interface EpisodeResult {
  policy: string;
  scenario: string;
  floorFrac: number;
  seed: number;
  status: string;
  closedReason?: string;
  price?: number;
  opening: number;
  limit: number;
  /** Parte del tramo apertura→límite capturada; 0 sin trato o a su precio de apertura. */
  share: number;
  counts: boolean;
  atOpening: boolean;
  /** Nuestros mensajes con precio. */
  rounds: number;
  ticks: number;
  finalOffered: boolean;
  finalTaken: boolean;
  acceptedBy?: "team" | "dealer";
  errors: string[];
}

export interface EpisodeOptions {
  profile: DealerProfile;
  scenario: Scenario;
  policy: Policy;
  seed: number;
  floorFrac: number;
  simParams?: Partial<SimParams>;
  maxTicks?: number;
}

export async function runEpisode(o: EpisodeOptions): Promise<EpisodeResult> {
  const sim = new DealerSim(o.profile, { seed: o.seed, params: { ...o.simParams, floorFrac: o.floorFrac }, assetRarity: scenarioAssetRarity });
  const api = new SimApi(sim);
  const dealer: DealerRef = { id: o.profile.id, aliases: o.profile.name ? [o.profile.name] : [] };
  const { side, reservation } = o.scenario;
  const errors: string[] = [];
  const opened = await api.openThread(o.profile.id, o.scenario.topic);
  const id = opened.id;
  const sent: number[] = [];
  let lastSentTick: number | undefined;
  let lastAcceptTick = -1;
  const maxTicks = o.maxTicks ?? 40;
  let ticks = 0;
  for (let tick = 0; tick < maxTicks; tick++) {
    const thread = await api.thread(id);
    if (thread.status !== "open") break;
    ticks = tick + 1;
    const step = o.policy.act(thread, { side, reservation, tick, sent, ...(lastSentTick !== undefined ? { lastSentTick } : {}), lastAcceptTick, dealer });
    try {
      const a = step.action;
      if (a.kind === "accept") {
        lastAcceptTick = tick;
        await api.accept(a.offerId);
      } else if (a.kind === "counter") {
        lastSentTick = tick;
        sent.push(a.price);
        await api.say(id, step.text ?? `${a.price} P?`, a.price);
      } else if (a.kind === "close") {
        if (lastSentTick !== tick && step.text) await api.say(id, step.text);
        await api.closeThread(id);
      }
    } catch (e) {
      errors.push(e instanceof BazaarError ? e.code : "exception");
    }
    sim.advance();
  }
  const final = await api.thread(id);
  if (final.status === "open") await api.closeThread(id);
  const deal = sim.deals.find((d) => d.thread === id);
  const secret = sim.secret(id);
  return {
    policy: o.policy.name,
    scenario: o.scenario.name,
    floorFrac: o.floorFrac,
    seed: o.seed,
    status: final.status === "open" ? "timeout" : final.status,
    ...(final.closed_reason ? { closedReason: final.closed_reason } : {}),
    ...(deal ? { price: deal.price, acceptedBy: deal.acceptedBy } : {}),
    opening: secret.opening,
    limit: secret.limit,
    share: deal?.share ?? 0,
    counts: deal?.counts ?? false,
    atOpening: deal?.atOpening ?? false,
    rounds: sent.length,
    ticks,
    finalOffered: final.standing_offers.some((s) => s.maker === o.profile.id && s.final === true),
    finalTaken: deal?.final ?? false,
    errors,
  };
}

export interface GroupStats {
  n: number;
  deals: number;
  dealRate: number;
  /** Media de la parte capturada sobre los tratos que cuentan. */
  shareOfDeals: number;
  /** Media sobre todos los episodios (0 sin trato): calidad × probabilidad. */
  shareAll: number;
  medianRounds: number;
  medianTicks: number;
  atOpeningPct: number;
  finalOfferedPct: number;
  /** De los hilos con oferta final, en cuántos la aceptamos. */
  finalTakenPct: number;
  walkPct: number;
  closedByUsPct: number;
  cooloffPct: number;
  errors: number;
}

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};
const pct = (k: number, n: number) => (n ? k / n : 0);

export function stats(rs: readonly EpisodeResult[]): GroupStats {
  const deals = rs.filter((r) => r.status === "deal");
  const counted = deals.filter((r) => r.counts);
  const finals = rs.filter((r) => r.finalOffered);
  return {
    n: rs.length,
    deals: deals.length,
    dealRate: pct(deals.length, rs.length),
    shareOfDeals: counted.length ? counted.reduce((s, r) => s + r.share, 0) / counted.length : 0,
    shareAll: pct(
      rs.reduce((s, r) => s + r.share, 0),
      rs.length,
    ),
    medianRounds: median(rs.map((r) => r.rounds)),
    medianTicks: median(rs.map((r) => r.ticks)),
    atOpeningPct: pct(deals.filter((r) => r.atOpening).length, deals.length),
    finalOfferedPct: pct(finals.length, rs.length),
    finalTakenPct: pct(finals.filter((r) => r.finalTaken).length, finals.length),
    walkPct: pct(rs.filter((r) => r.status === "walked").length, rs.length),
    closedByUsPct: pct(rs.filter((r) => r.closedReason === "closed_by_team").length, rs.length),
    cooloffPct: pct(rs.filter((r) => r.status === "cooloff").length, rs.length),
    errors: rs.reduce((s, r) => s + r.errors.length, 0),
  };
}

export interface GridOptions {
  profile: DealerProfile;
  policies: readonly Policy[];
  scenarios?: readonly Scenario[];
  floors: readonly number[];
  seeds: number;
  simParams?: Partial<SimParams>;
  maxTicks?: number;
}

export async function runGrid(o: GridOptions): Promise<EpisodeResult[]> {
  const out: EpisodeResult[] = [];
  for (const policy of o.policies)
    for (const scenario of o.scenarios ?? ABUELA_SCENARIOS)
      for (const floorFrac of o.floors)
        for (let seed = 0; seed < o.seeds; seed++)
          out.push(
            await runEpisode({ profile: o.profile, scenario, policy, seed, floorFrac, ...(o.simParams ? { simParams: o.simParams } : {}), ...(o.maxTicks ? { maxTicks: o.maxTicks } : {}) }),
          );
  return out;
}

export interface SummaryRow extends GroupStats {
  policy: string;
  group: string;
}

/** Filas por política × clave (`scenario`, `floorFrac` o `all`). */
export function summarize(rs: readonly EpisodeResult[], by: "scenario" | "floorFrac" | "all"): SummaryRow[] {
  const groups = new Map<string, EpisodeResult[]>();
  for (const r of rs) {
    const key = `${r.policy}\u0000${by === "all" ? "all" : String(r[by])}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return [...groups.entries()].map(([k, v]) => {
    const [policy, group] = k.split("\u0000") as [string, string];
    return { policy, group, ...stats(v) };
  });
}

const p0 = (x: number) => `${Math.round(x * 100)}%`;
const f2 = (x: number) => x.toFixed(2);

export function formatTable(rows: readonly SummaryRow[], groupLabel: string): string {
  const head = ["policy", groupLabel, "n", "deal%", "share/deal", "share/all", "med rnd", "med tick", "@open%", "final%", "final taken%", "walk%", "closed%", "cooloff%", "err"];
  const body = rows.map((r) => [
    r.policy,
    r.group,
    String(r.n),
    p0(r.dealRate),
    f2(r.shareOfDeals),
    f2(r.shareAll),
    String(r.medianRounds),
    String(r.medianTicks),
    p0(r.atOpeningPct),
    p0(r.finalOfferedPct),
    p0(r.finalTakenPct),
    p0(r.walkPct),
    p0(r.closedByUsPct),
    p0(r.cooloffPct),
    String(r.errors),
  ]);
  const widths = head.map((h, i) => Math.max(h.length, ...body.map((b) => b[i]!.length)));
  const line = (cells: readonly string[]) => cells.map((c, i) => (i < 2 ? c.padEnd(widths[i]!) : c.padStart(widths[i]!))).join("  ");
  return [line(head), line(widths.map((w) => "-".repeat(w))), ...body.map(line)].join("\n");
}
