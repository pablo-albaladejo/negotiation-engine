import { createRng, type Rng } from "../../engine/rng.js";
import { BazaarError, type Topic } from "../client.js";
import type { Message, StandingOffer, Thread } from "../schemas.js";
import { deriveParams, limitFor, menuItems, type DealerProfile, type MenuItem, type SimParams } from "./model.js";
import { classifyTone } from "./mood.js";

/**
 * Dealer del Bazaar simulado a partir de sus rasgos: determinista por semilla y con la misma forma
 * observable que la API de hilos (precio vigente, `final`, estado open/deal/walked/cooloff/closed con
 * `closed_reason`, texto). El tono solo mueve paciencia y reciprocidad; una inyección nunca cambia
 * una cifra. Parámetros y su origen (REAL/ASSUMPTION): `model.ts` y `AGENTS.md`.
 */

export interface DealerSimOptions {
  seed: number;
  params?: Partial<SimParams>;
  /** Rareza de una carta para `{buy: {card}}` (sin dato, el topic se rechaza). */
  cardRarity?: (card: string) => string | undefined;
  /** Rareza de un activo nuestro para `{sell: {assets}}`. */
  assetRarity?: (assetId: number) => string | undefined;
  startTick?: number;
}

export interface SimDeal {
  team: string;
  thread: number;
  item: string;
  side: MenuItem["side"];
  price: number;
  opening: number;
  limit: number;
  tick: number;
  hour: number;
  /** Se cerró aceptando su oferta final. */
  final: boolean;
  /** Quién aceptó: nosotros su oferta (`team`) o ella la nuestra (`dealer`). */
  acceptedBy: "team" | "dealer";
  /** Trato a su precio de apertura (o peor): REAL, no cuenta en la escalera. */
  atOpening: boolean;
  counts: boolean;
  /** Parte del tramo apertura→límite capturada (0 si no cuenta). */
  share: number;
}

export type ThreadStatus = "open" | "deal" | "walked" | "closed" | "cooloff";

interface Tally {
  polite: number;
  rude: number;
  injection: number;
}

interface ThreadState {
  id: number;
  team: string;
  item: MenuItem;
  topic: Topic;
  status: ThreadStatus;
  closedReason?: string;
  untilTick?: number;
  opening: number;
  limit: number;
  herPrice: number;
  herOfferId: number;
  ourBest?: number;
  rounds: number;
  basePatience: number;
  final: boolean;
  tally: Tally;
  lastMsgTick?: number;
  /** Precios (límite, paciencia, redondeo de pasos). Flujos separados: el tono y el texto nunca alteran los precios. */
  rng: Rng;
  toneRng: Rng;
  textRng: Rng;
  messages: Message[];
  offers: StandingOffer[];
}

interface TeamState {
  carry: Tally;
  cooloffUntil: number;
  lastAcceptTick: number;
}

const FILLER_WARM = [
  "Ay, these little cards bring back memories.",
  "My grandson collects them too, you know.",
  "Take your time, cariño, the Rastro is not going anywhere.",
  "You remind me of my nephew, always so polite.",
  "Have you eaten? You look thin.",
];
const FILLER_COLD = ["Hmm.", "I have other customers waiting.", "Manners cost nothing, young one."];
const HEAD: Record<string, readonly string[]> = {
  open: ["For you, {p} P.", "This one is {p} P, dear."],
  "open-sell": ["I could give you {p} P for it.", "Let me see... {p} P, dear."],
  counter: ["Well, since you asked nicely, {p} P.", "Let us say {p} P then.", "All right, {p} P."],
  same: ["I am still at {p} P, dear.", "{p} P, as I said."],
  final: ["My last word: {p} P. Take it or leave it, cariño.", "Final offer, {p} P, and not a prima less."],
  deal: ["Done, {p} P. Enjoy it!", "{p} P it is. Que lo disfrutes."],
};

const sround = (x: number, rng: Rng) => {
  const f = Math.floor(x);
  return f + (rng.float() < x - f ? 1 : 0);
};

export class DealerSim {
  readonly profile: DealerProfile;
  readonly params: SimParams;
  readonly deals: SimDeal[] = [];
  tick: number;
  private readonly rng: Rng;
  private readonly menu: MenuItem[];
  private readonly threads = new Map<number, ThreadState>();
  private readonly teams = new Map<string, TeamState>();
  private nextThreadId = 1;
  private nextMessageId = 1;
  private nextOfferId = 1000;

  constructor(
    profile: DealerProfile,
    private readonly o: DealerSimOptions,
  ) {
    this.profile = profile;
    this.params = deriveParams(profile, o.params);
    this.menu = menuItems(profile, this.params);
    this.rng = createRng(o.seed);
    this.tick = o.startTick ?? 0;
  }

  advance(n = 1): void {
    this.tick += n;
  }

  hour(tick = this.tick): number {
    return Math.floor(tick / this.params.ticksPerHour);
  }

  /** Artículo del menú para un topic, o undefined si no lo vende/compra. */
  resolve(topic: Topic): MenuItem | undefined {
    const find = (side: MenuItem["side"], key: string) => this.menu.find((m) => m.side === side && m.key === key);
    if ("sell" in topic) {
      const id = topic.sell.assets[0];
      const rarity = id === undefined || topic.sell.assets.length !== 1 ? undefined : this.o.assetRarity?.(id);
      return rarity ? find("sell", `rarity:${rarity}`) : undefined;
    }
    const b = topic.buy;
    if ("pack" in b) return find("buy", `pack:${b.pack}`);
    if ("rarity" in b) return find("buy", `rarity:${b.rarity}`);
    const rarity = this.o.cardRarity?.(b.card);
    return rarity ? find("buy", `rarity:${rarity}`) : undefined;
  }

  open(team: string, topic: Topic): Thread {
    const ts = this.team(team);
    if (this.tick < ts.cooloffUntil) throw new BazaarError("cooloff", "she is not talking to you", 403, { until_tick: ts.cooloffUntil });
    if ([...this.threads.values()].some((t) => t.team === team && t.status === "open")) throw new BazaarError("thread_open", "one conversation at a time", 409);
    const item = this.resolve(topic);
    if (!item) throw new BazaarError("invalid", "not on the menu", 422);
    const quota = this.quotaReason(team, item);
    if (quota) throw new BazaarError(quota, "come back next hour", 429);

    const id = this.nextThreadId++;
    const rng = this.rng.derive(`thread:${id}`);
    const p = this.params;
    const f = p.floorFrac * (1 + p.floorJitter * (2 * rng.float() - 1));
    const limit = limitFor(item, f, p);
    const jitter = Math.round(p.patienceJitter * (2 * rng.float() - 1));
    const carry = ts.carry;
    const t: ThreadState = {
      id,
      team,
      item,
      topic,
      status: "open",
      opening: item.opening,
      limit,
      herPrice: item.opening,
      herOfferId: 0,
      rounds: 0,
      basePatience: Math.max(1, Math.round(p.patienceBase + this.profile.traits.patience * p.patienceScale) + jitter),
      final: false,
      tally: { ...carry },
      rng,
      toneRng: rng.derive("tone"),
      textRng: rng.derive("text"),
      messages: [],
      offers: [],
    };
    this.threads.set(id, t);
    this.herSay(t, item.side === "buy" ? "open" : "open-sell", true);
    return this.view(id);
  }

  /** Nuestro mensaje (con o sin precio). Devuelve su respuesta y su oferta vigente. */
  message(team: string, threadId: number, text: string, price?: number): { message: Message; standing_offer: StandingOffer | null } {
    const t = this.own(team, threadId);
    if (t.status !== "open") throw new BazaarError("closed", `thread is ${t.status}`, 409);
    if (t.lastMsgTick === this.tick) throw new BazaarError("wait_for_tick", "one message per conversation per tick", 429, { next_tick_in: 1 });
    if (price !== undefined && (!Number.isFinite(price) || price < 1 || price > 10_000_000)) throw new BazaarError("invalid", "price out of range", 422);
    t.lastMsgTick = this.tick;
    const q = price === undefined ? undefined : Math.round(price);
    t.messages.push({ id: this.nextMessageId++, sender: team, text, ...(q !== undefined ? { price: q } : {}), tick: this.tick });

    const tone = classifyTone(text);
    if (tone.polite) t.tally.polite += 1;
    if (tone.rude) t.tally.rude += 1;
    if (tone.injection) t.tally.injection += 1;
    const p = this.params;
    if (tone.injection && t.toneRng.float() < p.injectionCooloffProb) {
      const until = this.tick + p.cooloffTicks;
      this.team(team).cooloffUntil = until;
      return this.end(t, "cooloff", "cooloff", "That is enough tricks for today. Come back later.", until);
    }
    if (t.final) return this.end(t, "walked", "walked", "Then we leave it here. Adiós, cariño.");

    const s = t.item.side === "buy" ? 1 : -1;
    let kind = "same";
    let repeated = false;
    if (q !== undefined) {
      this.ourOffer(t, q);
      const range = Math.abs(t.opening - t.limit);
      const step = t.ourBest === undefined ? undefined : s * (q - t.ourBest);
      repeated = step !== undefined && step <= 0;
      if (t.ourBest === undefined || (step ?? 0) > 0) t.ourBest = q;
      const move = t.item.fixed ? 0 : step === undefined ? sround(range * p.firstMoveFrac, t.rng) : step > 0 ? sround(Math.min(step * this.reciprocity(t), range * p.maxStepFrac), t.rng) : 0;
      if (move > 0) {
        const next = s > 0 ? Math.max(t.limit, t.herPrice - move) : Math.min(t.limit, t.herPrice + move);
        if (next !== t.herPrice) kind = "counter";
        t.herPrice = next;
      }
      const gap = Math.floor(range * p.acceptGapFrac);
      if (s * (q - t.herPrice) >= -gap && s * (q - t.limit) >= 0) return this.settle(t, q, "dealer");
    }
    // MEASURED (feed, El Chato): repetir el mismo precio sin mejorarlo la impacienta más que un mensaje normal.
    t.rounds += 1 + (repeated ? p.repeatPenaltyRounds : 0);
    if (t.rounds >= this.patience(t)) {
      t.final = true;
      t.herPrice -= s * Math.round(s * (t.herPrice - t.limit) * p.finalFrac);
      kind = "final";
    }
    const reply = this.herSay(t, kind, kind !== "same");
    return { message: reply, standing_offer: this.herOffer(t) ?? null };
  }

  accept(team: string, offerId: number): void {
    const t = [...this.threads.values()].find((x) => x.offers.some((o) => o.id === offerId));
    if (!t || t.team !== team) throw new BazaarError("not_found", "no such offer", 404);
    const offer = t.offers.find((o) => o.id === offerId)!;
    if (t.status !== "open" || offer.maker !== this.profile.id || offer.status !== "open") throw new BazaarError("invalid", "offer is not open", 422);
    const ts = this.team(team);
    if (ts.lastAcceptTick === this.tick) throw new BazaarError("wait_for_tick", "one acceptance per tick", 429, { next_tick_in: 1 });
    ts.lastAcceptTick = this.tick;
    this.settle(t, t.herPrice, "team");
  }

  close(team: string, threadId: number): void {
    const t = this.own(team, threadId);
    if (t.status === "open") this.end(t, "closed", "closed_by_team");
  }

  view(threadId: number): Thread {
    const t = this.threads.get(threadId);
    if (!t) throw new BazaarError("not_found", "no such thread", 404);
    return structuredClone({
      id: t.id,
      status: t.status,
      closed_reason: t.closedReason ?? null,
      until_tick: t.untilTick ?? null,
      with: this.profile.id,
      topic: t.topic,
      messages: t.messages,
      standing_offers: t.offers,
    });
  }

  threadsOf(team: string): { id: number; status: ThreadStatus; with: string }[] {
    return [...this.threads.values()].filter((t) => t.team === team).map((t) => ({ id: t.id, status: t.status, with: this.profile.id }));
  }

  /** Estado privado de un hilo, solo para tests y métricas del arnés (nunca lo ve el negociador). */
  secret(threadId: number): { opening: number; limit: number; patience: number; rounds: number; reciprocity: number } {
    const t = this.threads.get(threadId);
    if (!t) throw new BazaarError("not_found", "no such thread", 404);
    return { opening: t.opening, limit: t.limit, patience: this.patience(t), rounds: t.rounds, reciprocity: this.reciprocity(t) };
  }

  private team(team: string): TeamState {
    let ts = this.teams.get(team);
    if (!ts) {
      ts = { carry: { polite: 0, rude: 0, injection: 0 }, cooloffUntil: -1, lastAcceptTick: -1 };
      this.teams.set(team, ts);
    }
    return ts;
  }

  private own(team: string, threadId: number): ThreadState {
    const t = this.threads.get(threadId);
    if (!t) throw new BazaarError("not_found", "no such thread", 404);
    if (t.team !== team) throw new BazaarError("forbidden", "not your thread", 403);
    return t;
  }

  private patience(t: ThreadState): number {
    const p = this.params;
    return t.basePatience + Math.min(p.politeRoundsCap, t.tally.polite * p.politeRounds) - (t.tally.rude + t.tally.injection) * p.rudeRounds;
  }

  /** La inyección no entra aquí: nunca cambia una cifra. */
  private reciprocity(t: ThreadState): number {
    const p = this.params;
    const r = p.reciprocity + Math.min(p.politeReciprocityCap, t.tally.polite * p.politeReciprocity) - t.tally.rude * p.rudeReciprocity;
    return Math.min(1, Math.max(0.05, r));
  }

  private quotaReason(team: string, item: MenuItem): string | undefined {
    const hour = this.hour();
    const mine = this.deals.filter((d) => d.team === team && d.hour === hour);
    if (mine.length >= this.params.dealsPerHour) return "persona_quota";
    if (item.perTeamPerHour !== undefined && mine.filter((d) => d.item === item.key).length >= item.perTeamPerHour) return "persona_quota";
    return undefined;
  }

  private settle(t: ThreadState, price: number, acceptedBy: SimDeal["acceptedBy"]) {
    const quota = this.quotaReason(t.team, t.item);
    if (quota) {
      this.end(t, "closed", quota);
      throw new BazaarError(quota, "come back next hour", 429);
    }
    const s = t.item.side === "buy" ? 1 : -1;
    const atOpening = s * (price - t.opening) >= 0;
    const range = Math.abs(t.opening - t.limit);
    const share = atOpening || range === 0 ? 0 : Math.min(1, Math.max(0, (s * (t.opening - price)) / range));
    const accepted = acceptedBy === "team" ? this.herOffer(t) : t.offers.find((o) => o.maker === t.team && o.status === "open");
    if (accepted) accepted.status = "accepted";
    for (const o of t.offers) if (o.status === "open") o.status = "withdrawn";
    this.deals.push({
      team: t.team,
      thread: t.id,
      item: t.item.key,
      side: t.item.side,
      price,
      opening: t.opening,
      limit: t.limit,
      tick: this.tick,
      hour: this.hour(),
      final: acceptedBy === "team" && t.final,
      acceptedBy,
      atOpening,
      // REAL (hilo 56): a precio fijo, el trato a su puja contó (deals 1, ladder_points 0,022).
      counts: !atOpening || t.item.fixed === true,
      share,
    });
    t.status = "deal";
    this.carryOver(t);
    const message = this.push(t, this.text(t, "deal", price), price);
    return { message, standing_offer: accepted ?? null };
  }

  private end(t: ThreadState, status: ThreadStatus, reason: string, words?: string, untilTick?: number) {
    for (const o of t.offers) if (o.status === "open") o.status = "withdrawn";
    t.status = status;
    t.closedReason = reason;
    if (untilTick !== undefined) t.untilTick = untilTick;
    this.carryOver(t);
    const message = this.push(t, words ?? "Adiós, cariño.");
    return { message, standing_offer: null };
  }

  private carryOver(t: ThreadState) {
    const m = this.params.memoryCarry;
    this.team(t.team).carry = { polite: t.tally.polite * m, rude: t.tally.rude * m, injection: t.tally.injection * m };
  }

  private herOffer(t: ThreadState): StandingOffer | undefined {
    return t.offers.find((o) => o.id === t.herOfferId && o.status === "open");
  }

  private ourOffer(t: ThreadState, q: number) {
    for (const o of t.offers) if (o.maker === t.team && o.status === "open") o.status = "withdrawn";
    const goods = this.goods(t);
    t.offers.push({ id: this.nextOfferId++, maker: t.team, status: "open", ...(t.item.side === "buy" ? { give: { cash: q }, want: goods } : { give: goods, want: { cash: q } }), final: false });
  }

  private goods(t: ThreadState) {
    if ("sell" in t.topic) return { assets: [...t.topic.sell.assets] };
    return t.item.key.startsWith("pack:") ? { assets: [{ pack: t.item.key.slice(5) }] } : { cards: [{ rarity: t.item.key.slice(7) }] };
  }

  private herSay(t: ThreadState, kind: string, newOffer: boolean): Message {
    if (newOffer || !this.herOffer(t)) {
      const old = this.herOffer(t);
      if (old) old.status = "withdrawn";
      const goods = this.goods(t);
      const offer: StandingOffer = {
        id: this.nextOfferId++,
        maker: this.profile.id,
        status: "open",
        ...(t.item.side === "buy" ? { give: goods, want: { cash: t.herPrice } } : { give: { cash: t.herPrice }, want: goods }),
        final: t.final,
      };
      t.offers.push(offer);
      t.herOfferId = offer.id;
    }
    return this.push(t, this.text(t, kind, t.herPrice), t.herPrice);
  }

  private push(t: ThreadState, text: string, price?: number): Message {
    const m: Message = { id: this.nextMessageId++, sender: this.profile.id, text, ...(price !== undefined ? { price } : {}), tick: this.tick };
    t.messages.push(m);
    return m;
  }

  /** Charlatanería: solo cambia cuántas frases de relleno lleva el texto; la única cifra es el precio. */
  private text(t: ThreadState, kind: string, price: number): string {
    const heads = HEAD[kind] ?? HEAD.same!;
    const head = heads[Math.floor(t.textRng.float() * heads.length)]!.replace("{p}", String(price));
    const warm = t.tally.polite >= t.tally.rude + t.tally.injection;
    const fillers = warm ? FILLER_WARM : FILLER_COLD;
    const extra = Array.from({ length: this.params.sentences - 1 }, (_, i) => fillers[(t.rounds + i) % fillers.length]!);
    return [head, ...extra].join(" ");
  }
}
