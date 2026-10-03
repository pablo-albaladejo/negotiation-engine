import { z } from "zod";
import type { FeedEvent } from "../bazaar-board-core.js";

/**
 * Easter eggs for our profile: every egg we found (persona, tick, the probe phrase of ours that fired it, the prize —
 * cards, cash, packs and the badge awarded the same tick), every egg found per persona (who and when) and our probes per
 * persona (`personas.json`, sent / hit / miss), plus our badges and the gifts personas gave us (`gift.given`). From the public stream the recorder saves plus the feed: structure only,
 * never a dealer's text. Read-only.
 */

const num = z.number();
const str = z.string();
const FoundSchema = z.looseObject({ persona: str.nullish(), persona_name: str.nullish(), team: str.nullish(), name: str.nullish() });
const GivenSchema = z.looseObject({ team: str.nullish(), cash: num.nullish(), packs: z.array(z.unknown()).nullish(), cards: z.array(z.unknown()).nullish(), reason: str.nullish() });
const BadgeSchema = z.looseObject({ team: str.nullish(), badge: str.nullish() });
const ProbeSchema = z.looseObject({ phrase: str, tick: num, result: str.nullish() });
const PersonasFileSchema = z.looseObject({ personas: z.record(str, z.looseObject({ eggProbes: z.array(z.unknown()).nullish() })).nullish() });
const CatalogSchema = z.looseObject({
  sets: z.array(z.looseObject({ cards: z.array(z.looseObject({ id: str, name: str.nullish(), rarity: str.nullish(), hidden: z.boolean().nullish(), print_run: num.nullish() })).nullish() })).nullish(),
});

export interface EggCard {
  ref: string;
  name: string | null;
  rarity: string | null;
  hidden: boolean;
  print_run: number | null;
}

export interface EggPrize {
  cards: EggCard[];
  cash: number;
  packs: string[];
  /** Badges awarded to us the same tick (or the next) as the find. */
  badges: string[];
  reason: string | null;
}

export interface OurEgg {
  tick: number;
  persona: string;
  persona_name: string | null;
  /** Our probe that fired it: the latest one to that persona at most 6 ticks before (our own text). */
  probe: { phrase: string; tick: number } | null;
  prize: EggPrize;
  /** 1-based order of this find among all the persona's finds (us included). */
  order: number;
}

export interface PersonaEggs {
  persona: string;
  persona_name: string | null;
  found: { team: string; name: string | null; tick: number }[];
  probes: { sent: number; hit: number; miss: number; last: { phrase: string; tick: number; result: string } | null };
}

export interface OurGift {
  tick: number;
  from: string | null;
  /** The persona's display name, from the gift reason («gift from Abuela Carmen») or an egg event. */
  from_name: string | null;
  /** What we were doing with that persona when it arrived: our thread, our message that tick (our own text), the deal. */
  context: { thread: number | null; our_offer: string | null; our_tick: number | null; deal: { tick: number; price: number | null; refs: string[] } | null } | null;
  cards: EggCard[];
  cash: number;
  packs: string[];
  reason: string | null;
}

export interface EggsOut {
  ours: OurEgg[];
  personas: PersonaEggs[];
  /** Our badges, in award order (`badge.awarded`). */
  badges: { badge: string; tick: number }[];
  gifts: OurGift[];
  /** Gifts per persona across the field: how many, to how many teams, and ours. */
  gifts_by_persona: { persona: string; total: number; teams: number; ours: number }[];
}

const PROBE_WINDOW = 6;

const strings = (xs: readonly unknown[] | null | undefined): string[] =>
  (xs ?? []).flatMap((x) => (typeof x === "string" ? [x] : x && typeof x === "object" && typeof (x as { ref?: unknown }).ref === "string" ? [(x as { ref: string }).ref] : []));

export function eggsOf(events: readonly FeedEvent[], team: string, personasRaw: unknown, catalogRaw: unknown): EggsOut {
  const seen = new Set<number>();
  const unique = events.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true))).sort((a, b) => (a.tick ?? 0) - (b.tick ?? 0) || a.id - b.id);

  const cat = CatalogSchema.safeParse(catalogRaw);
  const cards = new Map((cat.success ? (cat.data.sets ?? []) : []).flatMap((s) => (s.cards ?? []).map((c) => [c.id, c] as const)));
  const cardOf = (ref: string): EggCard => {
    const c = cards.get(ref);
    return { ref, name: c?.name ?? null, rarity: c?.rarity ?? null, hidden: c?.hidden === true, print_run: c?.print_run ?? null };
  };

  const pf = PersonasFileSchema.safeParse(personasRaw);
  const probesOf = (persona: string) =>
    (pf.success ? (pf.data.personas?.[persona]?.eggProbes ?? []) : []).flatMap((p) => {
      const x = ProbeSchema.safeParse(p);
      return x.success ? [x.data] : [];
    });

  const personas = new Map<string, PersonaEggs>();
  const slot = (persona: string, name: string | null) => {
    let p = personas.get(persona);
    if (!p) {
      const probes = probesOf(persona);
      const last = probes[probes.length - 1];
      p = {
        persona,
        persona_name: name,
        found: [],
        probes: {
          sent: probes.length,
          hit: probes.filter((x) => x.result === "hit").length,
          miss: probes.filter((x) => x.result === "miss").length,
          last: last ? { phrase: last.phrase, tick: last.tick, result: last.result ?? "sent" } : null,
        },
      };
      personas.set(persona, p);
    }
    p.persona_name ??= name;
    return p;
  };
  if (pf.success) for (const [persona, v] of Object.entries(pf.data.personas ?? {})) if ((v.eggProbes ?? []).length) slot(persona, null);

  const ours: OurEgg[] = [];
  for (const e of unique) {
    if (e.type !== "egg.found" || e.tick == null) continue;
    const f = FoundSchema.safeParse(e.payload);
    if (!f.success || !f.data.persona || !f.data.team) continue;
    const p = slot(f.data.persona, f.data.persona_name ?? null);
    p.found.push({ team: f.data.team, name: f.data.name ?? null, tick: e.tick });
    if (f.data.team !== team) continue;
    const tick = e.tick;
    const near = (x: FeedEvent) => x.tick != null && x.tick >= tick && x.tick <= tick + 1;
    const prize: EggPrize = { cards: [], cash: 0, packs: [], badges: [], reason: null };
    for (const x of unique) {
      if (!near(x)) continue;
      if (x.type === "egg.given") {
        const g = GivenSchema.safeParse(x.payload);
        if (!g.success || g.data.team !== team || (x.actor && x.actor !== f.data.persona)) continue;
        prize.cards.push(...strings(g.data.cards).map(cardOf));
        prize.cash += g.data.cash ?? 0;
        prize.packs.push(...strings(g.data.packs));
        prize.reason ??= g.data.reason ?? null;
      } else if (x.type === "badge.awarded") {
        const b = BadgeSchema.safeParse(x.payload);
        if (b.success && b.data.team === team && b.data.badge) prize.badges.push(b.data.badge);
      }
    }
    const probe = probesOf(f.data.persona)
      .filter((x) => x.tick <= tick && tick - x.tick <= PROBE_WINDOW)
      .sort((a, b) => b.tick - a.tick)[0];
    ours.push({ tick, persona: f.data.persona, persona_name: f.data.persona_name ?? null, probe: probe ? { phrase: probe.phrase, tick: probe.tick } : null, prize, order: p.found.length });
  }
  // Our side of the conversation with a persona around a tick (our own messages and the deals: structure only).
  const contextOf = (persona: string, tick: number): OurGift["context"] => {
    let msg: { thread: number | null; offer: string | null; tick: number } | null = null;
    let deal: { tick: number; price: number | null; refs: string[] } | null = null;
    for (const x of unique) {
      if (x.tick == null) continue;
      const p = (x.payload ?? {}) as Record<string, unknown>;
      if (x.type === "thread.message" && p.sender === team && p.with === persona && x.tick <= tick && tick - x.tick <= 2) {
        type Side = { cash?: unknown; types?: unknown[]; assets?: unknown[] };
        const o = (p.offer ?? {}) as { give?: Side; want?: Side };
        const side = (x?: Side) => [...(typeof x?.cash === "number" && x.cash ? [`${x.cash} P`] : []), ...strings(x?.assets), ...strings(x?.types).map((t) => t.replace(/^(card|pack):/, ""))].join(" + ") || "—";
        msg = { thread: typeof p.thread === "number" ? p.thread : null, offer: p.offer ? `we give ${side(o.give)} for ${side(o.want)}` : null, tick: x.tick };
      } else if (x.type === "settlement" && !deal && x.tick >= tick - 2 && x.tick <= tick + 6) {
        const parties = Array.isArray(p.parties) ? p.parties : [];
        if (parties.includes(team) && parties.includes(persona)) {
          const items = Array.isArray(p.items) ? p.items : [];
          deal = { tick: x.tick, price: typeof p.price === "number" ? p.price : null, refs: strings(items) };
        }
      }
    }
    return msg || deal ? { thread: msg?.thread ?? null, our_offer: msg?.offer ?? null, our_tick: msg?.tick ?? null, deal } : null;
  };
  const giftCount = new Map<string, { total: number; teams: Set<string>; ours: number }>();
  const badges: EggsOut["badges"] = [];
  const gifts: OurGift[] = [];
  for (const e of unique) {
    if (e.tick == null) continue;
    if (e.type === "badge.awarded") {
      const b = BadgeSchema.safeParse(e.payload);
      if (b.success && b.data.team === team && b.data.badge) badges.push({ badge: b.data.badge, tick: e.tick });
    } else if (e.type === "gift.given") {
      const g = GivenSchema.safeParse(e.payload);
      if (g.success && e.actor && g.data.team) {
        const c = giftCount.get(e.actor) ?? { total: 0, teams: new Set<string>(), ours: 0 };
        c.total += 1;
        c.teams.add(g.data.team);
        if (g.data.team === team) c.ours += 1;
        giftCount.set(e.actor, c);
      }
      if (g.success && g.data.team === team)
        gifts.push({ tick: e.tick, from: e.actor ?? null, from_name: /gift from (.+)$/.exec(g.data.reason ?? "")?.[1] ?? null, context: e.actor ? contextOf(e.actor, e.tick) : null, cards: strings(g.data.cards).map(cardOf), cash: g.data.cash ?? 0, packs: strings(g.data.packs), reason: g.data.reason ?? null });
    }
  }
  const gifts_by_persona = [...giftCount].map(([persona, c]) => ({ persona, total: c.total, teams: c.teams.size, ours: c.ours })).sort((a, b) => b.total - a.total);
  return { badges, gifts, gifts_by_persona, ours, personas: [...personas.values()].sort((a, b) => b.found.length - a.found.length || a.persona.localeCompare(b.persona)) };
}
