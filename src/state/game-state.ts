import { updatePosterior, type Posterior } from "../dealers/history/persona-fit.js";
import { z } from "zod";
import { BazaarError, type BazaarClient } from "../shared/client.js";
import type { Clock, Me } from "../shared/schemas.js";
import { extractScoreFields, type ScoreFields } from "../shared/score.js";
import { duelsApi, type Duel, type Schedule } from "../duels/schemas.js";
import { parseMyOffers, parseOffers, readSide } from "../trades/trades.js";
import { spareTargets } from "../dealers/planning/planner.js";
import { buildConversations, type Conversation, type ConversationMemo } from "./conversation.js";
import { indexCatalog } from "../flags/flags.js";
import { buildPacks, formatPacks, type PacksState } from "../packs/packs.js";
import { buildPriceSheet, buildVenues, formatPriceSheet, formatVenues, valuesWanted, type PriceEntry, type VenueInfo } from "./prices.js";
import { buildTime, formatTime, type TimeState } from "./time.js";
import { candidateContext, collectRaw, formatHints, hintsByPersona, newLines, type HintLine, type Raw } from "../hints/corpus.js";
import { buildPersonas, parseFeed, personaTypeOf, worldFromFeed, formatEggsAndFlags, type FlagRecord, type OursWorld, type Persona, type PersonaMemo, type WorldEggs } from "./world.js";

/**
 * Un único `GameState` por tick, construido solo con GET y tolerante: cada lectura que falla se apunta en
 * `missing` y el resto del estado sigue. Lo leen el coordinador (`pnpm bazaar:play`) y, más adelante, el visor.
 * Nuestro valor privado de cada carta (`your_value`) va en `ours.values` para uso local; nunca sale en un mensaje.
 */

/** Límites en vigor (`/api/clock` → `limits`). Un campo ausente queda `undefined`: el coordinador decide qué hacer. */
export interface TickLimits {
  acceptsPerTick?: number;
  /** `messages_per_side_per_tick`: mensajes nuestros por conversación y tick. */
  messagesPerConversation?: number;
  maxOpenThreads?: number;
  /** `offers_per_team_per_tick`: altas nuevas por tick (una cancelada también cuenta). */
  offersPerTick?: number;
  maxOpenOffers?: number;
  raw: Record<string, unknown>;
}

export interface AlbumPage {
  set: string;
  name?: string;
  have: number;
  of: number;
  complete: boolean;
}

export interface GameState {
  tick: number;
  builtAt: string;
  clock: {
    tick: number;
    tHours?: number;
    tickSeconds?: number;
    paused: boolean;
    doors?: string;
    roundName?: string;
    nextTickIn?: number;
    closes?: string;
    nextOpens?: string;
  };
  limits: TickLimits;
  /** Hora de juego, fase del día, ronda y peso, ticks que quedan hoy, deriva y cambio de calendario. */
  time: TimeState;
  ours: {
    team?: string;
    name?: string;
    cash?: number;
    level?: number;
    unlocked: string[];
    frozen?: boolean;
    album: { pages: AlbumPage[]; filled?: number; slots?: number };
    holdings: { cards: number; packs: number; byRef: Record<string, number>; spares: number };
    /** Valores privados ya conocidos (`your_value` de lo que tenemos), por carta. Solo uso local. */
    values: Record<string, number>;
    score?: ScoreFields;
    venue?: { id?: string; name?: string; mechanism?: string; status?: string };
    openThreads: { id: number; with?: string; status: string }[];
    /** Dealers en cooloff (hilo cerrado con `closed_reason` cooloff y `until_tick` futuro). */
    cooloffs: { dealer: string; untilTick: number }[];
    /** Campos de strikes que traiga `/api/me`, si alguno (hoy no aparece ninguno). */
    strikes?: Record<string, unknown>;
  } & OursWorld;
  /** Hoja de precios por carta (sets publicados): escasez, dealers, mejores ask/bid, último trato, valor y huecos. */
  markets: { prices: PriceEntry[]; venues: VenueInfo[] };
  /** Sobres cerrados nuestros y tipos de sobre (valor esperado con el suministro, dealers, El Rastro). */
  packs: PacksState;
  /** Corpus de pistas completo (lo ya guardado + lo nuevo de este tick) y lo nuevo para añadir a `hints.jsonl`. */
  hints: { all: HintLine[]; fresh: HintLine[] };
  /** Personas (dealers y las que aparezcan por `/api/levels` o el feed), con estado y progreso de desbloqueo. */
  personas: Persona[];
  world: { eggs: WorldEggs };
  env: {
    schedule: { nowHours?: number; next: { atHours: number; action: string; note?: string }[] };
    dealers: { id: string; name?: string; status?: string; level?: number }[];
    duels: Duel[];
    rastro: { offers: number; asks: number; bids: number; ours: number };
    myOpenOffers: number;
    leaderboard?: { tick?: number; ourRank?: number; ourScore?: number; top: { team: string; name?: string; score?: number; rank?: number }[] };
  };
  /** Una por hilo con dealer, duelo vivo y oferta nuestra en El Rastro (ver `conversation.ts`). */
  conversations: Conversation[];
  /** Lecturas que fallaron (endpoint: código); el estado es parcial pero usable. */
  missing: string[];
}

const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const str = (x: unknown): string | undefined => (typeof x === "string" ? x : undefined);

export function readLimits(clock: Pick<Clock, "limits"> | undefined): TickLimits {
  const raw = clock?.limits ?? {};
  const out: TickLimits = { raw };
  const set = <K extends keyof Omit<TickLimits, "raw">>(k: K, v: unknown) => {
    const n = num(v);
    if (n !== undefined) out[k] = n;
  };
  set("acceptsPerTick", raw.accepts_per_team_per_tick);
  set("messagesPerConversation", raw.messages_per_side_per_tick);
  set("maxOpenThreads", raw.max_open_threads_per_team);
  set("offersPerTick", raw.offers_per_team_per_tick);
  set("maxOpenOffers", raw.max_open_offers_per_team);
  return out;
}

const AlbumSchema = z.looseObject({
  pages: z.array(z.looseObject({ set: z.string(), name: z.string().nullish(), have: z.number().catch(0), of: z.number().catch(10), complete: z.boolean().catch(false) })).catch([]),
  filled: z.number().nullish(),
  slots: z.number().nullish(),
});

const LeaderboardSchema = z.looseObject({
  tick: z.number().nullish(),
  teams: z.array(z.looseObject({ team: z.string(), name: z.string().nullish(), score: z.number().nullish(), rank: z.number().nullish() })).catch([]),
});

/** Partes de `/api/me` que el estado usa (todo opcional; un campo raro se ignora). */
function oursFrom(me: Me) {
  const raw = me as Me & Record<string, unknown>;
  const album = AlbumSchema.safeParse(me.album);
  const byRef: Record<string, number> = {};
  const values: Record<string, number> = {};
  let cards = 0;
  for (const a of me.assets) {
    if (a.kind && a.kind !== "card") continue;
    cards += 1;
    byRef[a.ref] = (byRef[a.ref] ?? 0) + 1;
    if (typeof a.your_value === "number" && values[a.ref] === undefined) values[a.ref] = a.your_value;
  }
  const venue = raw.venue && typeof raw.venue === "object" ? (raw.venue as Record<string, unknown>) : undefined;
  const rules = venue?.rules && typeof venue.rules === "object" ? (venue.rules as Record<string, unknown>) : undefined;
  const strikes = Object.fromEntries(Object.entries(raw).filter(([k]) => /strike|cooloff|warning/i.test(k)));
  const score = extractScoreFields(me);
  const team = me.id ?? undefined;
  const name = me.name ?? undefined;
  const venueOut = venue ? { ...(str(venue.venue) ? { id: str(venue.venue)! } : {}), ...(str(venue.name) ? { name: str(venue.name)! } : {}), ...(str(rules?.mechanism) ? { mechanism: str(rules!.mechanism)! } : {}), ...(str(venue.status) ? { status: str(venue.status)! } : {}) } : undefined;
  return {
    ...(team ? { team } : {}),
    ...(name ? { name } : {}),
    cash: me.cash,
    ...(me.level !== undefined ? { level: me.level } : {}),
    unlocked: me.unlocked ?? me.unlocked_dealers ?? [],
    ...(typeof raw.frozen === "boolean" ? { frozen: raw.frozen } : {}),
    album: album.success
      ? {
          pages: album.data.pages.map((p) => ({ set: p.set, ...(p.name ? { name: p.name } : {}), have: p.have, of: p.of, complete: p.complete })),
          ...(album.data.filled != null ? { filled: album.data.filled } : {}),
          ...(album.data.slots != null ? { slots: album.data.slots } : {}),
        }
      : { pages: [] },
    holdings: { cards, packs: me.assets.length - cards, byRef, spares: spareTargets(me).length },
    values,
    ...(score ? { score } : {}),
    ...(venueOut ? { venue: venueOut } : {}),
    ...(Object.keys(strikes).length ? { strikes } : {}),
  };
}

export interface BuildOptions {
  /** Leer `/api/leaderboard` (el coordinador lo pide cada pocos ticks; el servidor lo refresca cada 5). */
  leaderboard?: boolean;
  /** Cartas que siempre cuentan como «página» (SAL-09). */
  pageTargets?: readonly string[];
  /** Parte persistida de cada conversación (`conversations.json`). */
  memos?: ReadonlyMap<string, ConversationMemo>;
  /** Pistas y probes por persona (`personas.json`). */
  personaMemos?: ReadonlyMap<string, PersonaMemo>;
  /** Flags ya enviados (`flags.json`). */
  flags?: readonly FlagRecord[];
  /** Tiempo del tick anterior: huella del calendario y peso de la ronda si el leaderboard no se leyó. */
  prevTime?: TimeState;
  /** Corpus de pistas ya guardado (`hints.jsonl`). */
  hintCorpus?: readonly HintLine[];
  /** Semilla del corpus desde `results/` (solo la primera vez, sin `hints.jsonl`). */
  hintSeed?: readonly Raw[];
  /** Caché de valores privados en disco (`values.json`) y su hora; siembra la del cliente si aún es fresca. */
  valueCache?: ReadonlyMap<string, number>;
  valueCacheAt?: number;
  /** Máximo de `/api/me/value` por tick (por defecto 4). */
  valueFetchesPerTick?: number;
  /**
   * Posterior del ajuste por persona (`persona-posterior.json`). Se actualiza EN SITIO con las conversaciones del tick
   * (observaciones y estimaciones) para que quien lo cargó lo guarde.
   */
  posterior?: Posterior;
  /** Puestos del leaderboard del tick anterior (si este tick no se lee). */
  prevRanks?: ReadonlyMap<string, { rank?: number; score?: number }>;
}

/** Construye el estado del tick con GET en paralelo; nunca lanza por una lectura que falle (salvo `/api/clock`). */
export async function buildGameState(client: BazaarClient, opts: BuildOptions = {}): Promise<GameState> {
  const duels = duelsApi(client);
  const clock = await client.clock();
  const missing: string[] = [];
  const settle = async <T>(name: string, p: Promise<T>): Promise<T | undefined> => {
    try {
      return await p;
    } catch (e) {
      missing.push(`${name}: ${e instanceof BazaarError ? e.code : e instanceof Error ? e.name : "error"}`);
      return undefined;
    }
  };
  const [me, schedule, dealers, live, threads, board, myOffers, leaderboard, feed, levels, catalog, venues] = await Promise.all([
    settle("me", client.me()),
    settle("schedule", duels.schedule()),
    settle("dealers", client.dealers()),
    settle("duels", duels.duels()),
    settle("threads", client.myThreads()),
    settle("rastro", client.board("rastro")),
    settle("my offers", client.myOffers()),
    opts.leaderboard ? settle("leaderboard", client.raw("GET", "/api/leaderboard")) : Promise.resolve(undefined),
    settle("feed", client.feed(200)),
    settle("levels", client.levels()),
    settle("catalog", client.catalog()),
    settle("venues", client.venues()),
  ]);
  // Otros venues abiertos (sin El Rastro): su libro para la hoja de precios.
  const others = (venues?.venues ?? []).filter((v) => v.venue && v.venue !== "rastro" && (v as { status?: unknown }).status !== "closed");
  const otherBoards = await Promise.all(others.map(async (v) => ({ venue: v.venue!, offers: parseOffers(await settle(`board ${v.venue}`, client.board(v.venue!))) })));
  const events = parseFeed(feed);
  const rawDealers = (dealers?.dealers ?? []) as unknown[];
  const c = clock as Clock & Record<string, unknown>;
  const ours = me ? oursFrom(me) : { unlocked: [], album: { pages: [] }, holdings: { cards: 0, packs: 0, byRef: {}, spares: 0 }, values: {} };
  const allThreads = threads?.threads ?? [];
  const cooloffs = allThreads.flatMap((t) => {
    const r = t as typeof t & { closed_reason?: unknown; until_tick?: unknown };
    const until = num(r.until_tick);
    return r.closed_reason === "cooloff" && until !== undefined && until > clock.tick && t.with ? [{ dealer: t.with, untilTick: until }] : [];
  });
  const offers = board !== undefined ? parseOffers(board) : [];
  const mine = myOffers !== undefined && me ? parseMyOffers(myOffers, me.id ?? "").mine : [];
  const lb = leaderboard !== undefined ? LeaderboardSchema.safeParse(leaderboard) : undefined;
  const liveDuels = (live?.duels ?? []).filter((d) => !d.status || d.status === "live");
  const conversations = buildConversations({
    tick: clock.tick,
    ...(me ? { me } : {}),
    threads: allThreads,
    dealers: dealers?.dealers ?? [],
    duels: liveDuels,
    rastro: mine,
    pages: ours.album.pages,
    pageTargets: opts.pageTargets ?? [],
    memos: opts.memos ?? new Map(),
    ...(catalog ? { catalog: indexCatalog(catalog) } : {}),
    flagsFromFirstMessage: new Set(rawDealers.filter((d) => personaTypeOf(d) === "trickster").map((d) => (d as { id: string }).id)),
  });
  const known = new Set([...rawDealers.map((d) => (d as { id: string }).id), ...((levels as { levels?: { id?: string }[] } | undefined)?.levels ?? []).flatMap((l) => (l.id ? [l.id] : []))]);
  const ctx = candidateContext([...known].map((id) => {
    const d = rawDealers.find((x) => (x as { id: string }).id === id) as { name?: string } | undefined;
    return { id, ...(d?.name ? { name: d.name } : {}) };
  }), catalog);
  const corpus = opts.hintCorpus ?? [];
  const fresh = newLines([...(opts.hintSeed ?? []), ...collectRaw([allThreads, feed])], new Set(corpus.map((h) => h.key)), ctx);
  const hintsAll = [...corpus, ...fresh];
  const personas = buildPersonas({
    dealers: rawDealers,
    levels,
    events,
    ...(me?.id ? { team: me.id } : {}),
    unlocked: ours.unlocked,
    conversations,
    hints: hintsByPersona(hintsAll),
    memos: opts.personaMemos ?? new Map(),
  });
  // Ajuste de la curva por persona: predicción en cada conversación con dealer y estimaciones en cada persona.
  const fit = updatePosterior(opts.posterior ?? { observations: {}, estimates: {} }, conversations, clock.tick);
  if (opts.posterior) Object.assign(opts.posterior, fit.posterior);
  for (const conv of conversations) {
    const pr = fit.predictions.get(conv.id);
    if (pr) conv.prediction = pr;
  }
  for (const p of personas) {
    const est = fit.posterior.estimates[p.id];
    if (est) p.estimates = est;
  }
  const world = worldFromFeed(events, me?.id ?? undefined, personas.map((p) => p.id), Object.keys(ours.holdings.byRef), catalog, opts.flags ?? []);
  const ourRow = lb?.success ? lb.data.teams.find((t) => t.team === me?.id) : undefined;
  // Caché de valores en el cliente: la mano nueva olvida lo que cambió; `/api/me` siembra lo que tenemos.
  client.noteHand(ours.holdings.byRef);
  if (opts.valueCache) client.seedValues(Object.fromEntries(opts.valueCache), opts.valueCacheAt ?? 0);
  client.seedValues(ours.values);
  const valueCache = new Map(Object.entries(client.cachedValues()));
  const ranks = lb?.success ? new Map(lb.data.teams.map((t) => [t.team, { ...(t.rank != null ? { rank: t.rank } : {}), ...(t.score != null ? { score: t.score } : {}) }])) : opts.prevRanks ?? new Map();
  const venueInfo = buildVenues((venues?.venues ?? []) as unknown[], [{ venue: "rastro", offers }, ...otherBoards], me?.id ?? undefined, ranks);
  const priceInputs = {
    untradeable: new Set(venueInfo.filter((v) => !v.canTrade).map((v) => v.id)),
    ...(catalog ? { catalog } : {}),
    dealers: rawDealers,
    boards: [{ venue: "rastro", offers }, ...otherBoards],
    ...(me?.id ? { team: me.id } : {}),
    events,
    holdings: ours.holdings.byRef,
    pages: ours.album.pages,
    pageTargets: opts.pageTargets ?? [],
  };
  // Pocos GET de valor por tick: las cartas sin valor con ask o bid a la vista, las de página primero.
  for (const ref of valuesWanted(buildPriceSheet({ ...priceInputs, values: Object.fromEntries(valueCache) }), opts.valueFetchesPerTick ?? 4)) {
    const v = await settle(`value ${ref}`, client.value(ref));
    if (v !== undefined) valueCache.set(ref, v);
  }
  const prices = buildPriceSheet({ ...priceInputs, values: Object.fromEntries(valueCache) });
  const time = buildTime(clock, schedule, leaderboard, opts.prevTime?.scheduleHash);
  const prevWeight = opts.prevTime?.round?.weight;
  if (time.round && time.round.weight === undefined && prevWeight !== undefined && opts.prevTime?.round?.n === time.round.n) time.round.weight = prevWeight;
  return {
    tick: clock.tick,
    builtAt: new Date().toISOString(),
    clock: {
      tick: clock.tick,
      ...(num(c.t_hours) !== undefined ? { tHours: num(c.t_hours)! } : {}),
      ...(clock.tick_seconds !== undefined ? { tickSeconds: clock.tick_seconds } : {}),
      paused: !!clock.paused,
      ...(str(c.doors) ? { doors: str(c.doors)! } : {}),
      ...(clock.round_name ? { roundName: clock.round_name } : {}),
      ...(clock.next_tick_in !== undefined ? { nextTickIn: clock.next_tick_in } : {}),
      ...(str(c.closes) ? { closes: str(c.closes)! } : {}),
      ...(str(c.next_opens) ? { nextOpens: str(c.next_opens)! } : {}),
    },
    limits: readLimits(clock),
    time,
    ours: {
      ...ours,
      openThreads: allThreads.filter((t) => (t.status ?? "open") === "open").map((t) => ({ id: t.id, ...(t.with ? { with: t.with } : {}), status: t.status ?? "open" })),
      cooloffs,
      ...world.ours,
    },
    markets: { prices, venues: venueInfo },
    packs: buildPacks({ ...(me ? { me } : {}), ...(catalog ? { catalog } : {}), dealers: rawDealers, rastro: offers, ...(me?.id ? { team: me.id } : {}), events, values: Object.fromEntries(valueCache) }),
    hints: { all: hintsAll, fresh },
    personas,
    world: { eggs: world.eggs },
    env: {
      schedule: scheduleSummary(schedule),
      dealers: (dealers?.dealers ?? []).map((d) => ({ id: d.id, ...(d.name ? { name: d.name } : {}), ...(d.status ? { status: d.status } : {}), ...(typeof d.level === "number" ? { level: d.level } : {}) })),
      duels: liveDuels,
      rastro: {
        offers: offers.length,
        asks: offers.filter((o) => readSide(o.give).assets.length > 0 && readSide(o.want).cash > 0).length,
        bids: offers.filter((o) => readSide(o.give).cash > 0).length,
        ours: offers.filter((o) => o.maker === me?.id).length,
      },
      myOpenOffers: mine.filter((o) => (o.status ?? "open") === "open").length,
      ...(lb?.success
        ? {
            leaderboard: {
              ...(lb.data.tick != null ? { tick: lb.data.tick } : {}),
              ...(ourRow?.rank != null ? { ourRank: ourRow.rank } : {}),
              ...(ourRow?.score != null ? { ourScore: ourRow.score } : {}),
              top: lb.data.teams.slice(0, 3).map((t) => ({ team: t.team, ...(t.name ? { name: t.name } : {}), ...(t.score != null ? { score: t.score } : {}), ...(t.rank != null ? { rank: t.rank } : {}) })),
            },
          }
        : {}),
    },
    conversations,
    missing,
  };
}

function scheduleSummary(s: Schedule | undefined): GameState["env"]["schedule"] {
  if (!s) return { next: [] };
  const now = s.now_hours ?? 0;
  return {
    ...(s.now_hours !== undefined ? { nowHours: s.now_hours } : {}),
    next: s.upcoming
      .filter((u) => u.at_hours >= now)
      .sort((a, b) => a.at_hours - b.at_hours)
      .slice(0, 4)
      .map((u) => ({ atHours: u.at_hours, action: u.action, ...(u.note ? { note: u.note } : {}) })),
  };
}

/** Resumen compacto del estado para la consola (sin valores privados ni límites de duelo). */
export function formatGameState(g: GameState): string[] {
  const c = g.clock;
  const o = g.ours;
  const s = o.score;
  const pages = o.album.pages.map((p) => `${p.set} ${p.have}/${p.of}${p.complete ? "✓" : ""}`).join(" ");
  const lines = [
    `time: ${formatTime(g.time)}`,
    `clock: tick ${c.tick}${c.tHours !== undefined ? ` · ${c.tHours.toFixed(2)} h` : ""} · ${c.tickSeconds ?? "?"} s/tick${c.paused ? " · PAUSED" : ""}${c.doors ? ` · doors ${c.doors}` : ""}${c.roundName ? ` · ${c.roundName}` : ""}${c.doors && c.doors !== "open" && c.nextOpens ? ` · opens ${c.nextOpens}` : ""}`,
    `us: ${o.name ?? o.team ?? "?"} · cash ${o.cash ?? "?"} P · level ${o.level ?? "?"} · unlocked ${o.unlocked.join(", ") || "-"}${o.frozen ? " · FROZEN" : ""}${o.venue ? ` · venue ${o.venue.id ?? "?"} (${o.venue.mechanism ?? "?"}, ${o.venue.status ?? "?"})` : ""}`,
    `album: ${pages || "-"}${o.album.filled !== undefined ? ` · ${o.album.filled}/${o.album.slots ?? "?"} slots` : ""} · ${o.holdings.cards} cards, ${o.holdings.packs} packs, ${o.holdings.spares} spares · ${Object.keys(o.values).length} private values known`,
    s
      ? `score: ${s.score ?? "?"} (negotiating ${s.negotiating ?? "?"}, market ${s.market ?? "?"}) · ladder ${s.ladder_points ?? "?"} · neg ${s.neg_points ?? "?"} · duels ${s.duel_points ?? "?"} · mm ${s.mm_points ?? "?"} · deals ${s.deals ?? "?"} · rank ${s.rank ?? "?"}`
      : "score: not available",
    `threads: ${o.openThreads.length} open${o.openThreads.length ? ` (${o.openThreads.map((t) => `#${t.id} ${t.with ?? "?"}`).join(", ")})` : ""}${o.cooloffs.length ? ` · cooloff ${o.cooloffs.map((x) => `${x.dealer} until ${x.untilTick}`).join(", ")}` : ""}${o.strikes ? ` · strikes ${JSON.stringify(o.strikes)}` : ""}`,
    `dealers: ${g.env.dealers.map((d) => `${d.id}${d.status ? ` (${d.status})` : ""}`).join(", ") || "-"} · duels live ${g.env.duels.length} · El Rastro ${g.env.rastro.offers} offers (${g.env.rastro.asks} asks, ${g.env.rastro.bids} bids, ${g.env.rastro.ours} ours) · our open offers ${g.env.myOpenOffers}`,
    `schedule: ${g.env.schedule.next.map((u) => `${u.atHours.toFixed(2)} h ${u.action}`).join(" · ") || "-"}`,
  ];
  const lb = g.env.leaderboard;
  if (lb) lines.push(`leaderboard${lb.tick !== undefined ? ` (tick ${lb.tick})` : ""}: us rank ${lb.ourRank ?? "?"} score ${lb.ourScore ?? "?"} · top ${lb.top.map((t) => `${t.rank ?? "?"}. ${t.name ?? t.team} ${t.score ?? "?"}`).join(", ")}`);
  lines.push(...formatEggsAndFlags(g.world.eggs, g.ours));
  lines.push(...formatHints(g.hints.all));
  lines.push("venues:", ...formatVenues(g.markets.venues));
  lines.push(...formatPriceSheet(g.markets.prices));
  lines.push(...formatPacks(g.packs));
  if (g.missing.length) lines.push(`missing: ${g.missing.join("; ")}`);
  return lines;
}
