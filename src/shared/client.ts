import type { z } from "zod";
import {
  CatalogSchema,
  ClockSchema,
  DealerInfoSchema,
  DealersSchema,
  ErrorBodySchema,
  MeSchema,
  SayResultSchema,
  ThreadListSchema,
  ThreadSchema,
  ValueSchema,
  VenuesSchema,
  type Catalog,
  type Clock,
  type DealerInfo,
  type Me,
  type Thread,
} from "./schemas.js";

/** Rejected request. `code` is the server's code (`wait_for_tick`, `insufficient_cash`...); `status` 0 = no response. */
export class BazaarError extends Error {
  readonly code: string;
  readonly status: number;
  readonly extra: Record<string, unknown>;
  constructor(code: string, message: string, status: number, extra: Record<string, unknown> = {}) {
    super(message ? `${code}: ${message}` : code);
    this.name = "BazaarError";
    this.code = code;
    this.status = status;
    this.extra = extra;
  }
}

/** Token bucket: `ratePerSec` requests per second with burst `burst`. Clock and sleep injectable. */
export class TokenBucket {
  private tokens: number;
  private last: number;
  constructor(
    private readonly ratePerSec: number,
    private readonly burst: number,
    private readonly now: () => number,
    private readonly sleep: (ms: number) => Promise<void>,
  ) {
    this.tokens = burst;
    this.last = now();
  }

  async take(): Promise<void> {
    for (;;) {
      const t = this.now();
      this.tokens = Math.min(this.burst, this.tokens + ((t - this.last) / 1000) * this.ratePerSec);
      this.last = t;
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      await this.sleep(Math.ceil(((1 - this.tokens) / this.ratePerSec) * 1000));
    }
  }
}

export interface BazaarClientOptions {
  url: string;
  key: string;
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  /** Requests per second (below the server's limit of 5). */
  ratePerSec?: number;
  burst?: number;
  retries?: number;
  /** On `wait_for_tick`, sleep until the next tick and retry (otherwise the error is thrown). */
  waitOnTick?: boolean;
  timeoutMs?: number;
}

export type Topic =
  | { buy: { pack: string } }
  | { buy: { card: string } }
  | { buy: { rarity: string; set: string } }
  | { sell: { assets: number[] } };

/** Paths and codes of validation failures (never values: the response is not dumped to the log). */
export function zodIssues(error: z.ZodError): string {
  const parts = error.issues.slice(0, 5).map((i) => `${i.path.length ? i.path.join(".") : "(root)"}: ${i.code}${"expected" in i ? ` expected ${String(i.expected)}` : ""}`);
  return parts.join("; ") + (error.issues.length > 5 ? `; +${error.issues.length - 5} more` : "");
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Set of a card ref ("SAL-09" → "SAL"). */
const setOf = (ref: string): string => ref.split("-")[0] ?? ref;

/** Bazaar HTTP client (team). The key only travels in the header; it never appears in errors or logs. */
export class BazaarClient {
  private readonly fetchFn: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly bucket: TokenBucket;
  private readonly retries: number;
  private readonly waitOnTick: boolean;
  private readonly timeoutMs: number;
  readonly url: string;
  readonly #key: string;

  constructor(options: BazaarClientOptions) {
    this.url = options.url.replace(/\/+$/, "");
    this.#key = options.key;
    this.fetchFn = options.fetch ?? fetch;
    this.sleep = options.sleep ?? realSleep;
    this.bucket = new TokenBucket(options.ratePerSec ?? 4, options.burst ?? 2, options.now ?? Date.now, this.sleep);
    this.retries = options.retries ?? 3;
    this.waitOnTick = options.waitOnTick ?? false;
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  async request<S extends z.ZodType>(method: string, path: string, schema: S, body?: unknown): Promise<z.infer<S>> {
    const raw = await this.raw(method, path, body);
    const parsed = schema.safeParse(raw);
    if (!parsed.success) throw new BazaarError("bad_response", `${method} ${path}: ${zodIssues(parsed.error)}`, 200);
    return parsed.data;
  }

  async raw(method: string, path: string, body?: unknown): Promise<unknown> {
    let attempt = 0;
    for (;;) {
      await this.bucket.take();
      let err: BazaarError;
      try {
        return await this.once(method, path, body);
      } catch (e) {
        if (!(e instanceof BazaarError)) throw e;
        err = e;
      }
      attempt += 1;
      if (attempt > this.retries) throw err;
      if (err.code === "rate_limited" || err.code === "too_many_failures") {
        await this.sleep(250 * attempt);
      } else if (err.code === "network" && method === "GET") {
        await this.sleep(500 * attempt);
      } else if (err.code === "wait_for_tick" && this.waitOnTick) {
        await this.sleep(await this.waitMs(err));
      } else {
        throw err;
      }
    }
  }

  /** Milliseconds until the next tick: `next_tick_in` from the error, otherwise from the clock (+200 ms margin). */
  private async waitMs(err: BazaarError): Promise<number> {
    let seconds = typeof err.extra.next_tick_in === "number" ? err.extra.next_tick_in : undefined;
    if (seconds === undefined) {
      try {
        seconds = (await this.clock()).next_tick_in;
      } catch {
        seconds = 1;
      }
    }
    return Math.min(65_000, Math.max(50, (seconds ?? 1) * 1000)) + 200;
  }

  private async once(method: string, path: string, body?: unknown): Promise<unknown> {
    const headers: Record<string, string> = { "X-Team-Key": this.#key, Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    let res: Response;
    try {
      res = await this.fetchFn(this.url + path, {
        method,
        headers,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (e) {
      throw new BazaarError("network", `${method} ${path}: ${e instanceof Error ? e.name : "error"}`, 0);
    }
    const text = await res.text();
    let json: unknown = {};
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        throw new BazaarError(res.ok ? "bad_response" : `http_${res.status}`, `${method} ${path}: not JSON`, res.status);
      }
    }
    if (res.ok) return json;
    const parsed = ErrorBodySchema.safeParse(json);
    const bodyObj = parsed.success ? parsed.data : {};
    const { error, message, ...extra } = bodyObj as Record<string, unknown> & { error?: string; message?: string };
    const code = error ?? (res.status === 422 ? "invalid" : res.status === 401 ? "bad_key" : `http_${res.status}`);
    throw new BazaarError(code, message ?? "", res.status, extra);
  }

  clock(): Promise<Clock> {
    return this.request("GET", "/api/clock", ClockSchema);
  }
  catalog(): Promise<Catalog> {
    return this.request("GET", "/api/catalog", CatalogSchema);
  }
  dealers() {
    return this.request("GET", "/api/dealers", DealersSchema);
  }
  dealer(id: string): Promise<DealerInfo> {
    return this.request("GET", `/api/dealers/${encodeURIComponent(id)}`, DealerInfoSchema);
  }
  venues() {
    return this.request("GET", "/api/venues", VenuesSchema);
  }
  /** Opens our own market (level ≥ 2, 250 P deposit + 20 P). Only from `bazaar:venue` without --dry-run and with --confirm. */
  openVenue(body: { name: string; fee_bps: number; fee_per_card: number; rules: Record<string, unknown>; description: string }): Promise<unknown> {
    return this.raw("POST", "/api/venues", body);
  }
  /** Closes our market (bond back after a cooldown). Only from `bazaar:venue --replace` without --dry-run and with --confirm. */
  closeVenue(venue: string): Promise<unknown> {
    return this.raw("POST", `/api/venues/${encodeURIComponent(venue)}/close`);
  }
  levels(): Promise<unknown> {
    return this.raw("GET", "/api/levels");
  }
  me(): Promise<Me> {
    return this.request("GET", "/api/me", MeSchema);
  }
  /**
   * Private value of a card, cached in the client: it does not change within the day unless the hand changes
   * (`noteHand` forgets cards whose count changed) or an hour passes (`VALUE_TTL_MS`). So a tick only requests
   * the missing ones, and everyone sharing the client (agents, coordinator, viewer) benefits.
   */
  async value(card: string): Promise<number> {
    const hit = this.valueCache.get(card);
    if (hit && Date.now() - hit.at < BazaarClient.VALUE_TTL_MS) return hit.v;
    const v = (await this.request("GET", `/api/me/value?card=${encodeURIComponent(card)}`, ValueSchema)).your_value;
    this.valueCache.set(card, { v, at: Date.now() });
    return v;
  }
  static readonly VALUE_TTL_MS = 3_600_000;
  private readonly valueCache = new Map<string, { v: number; at: number }>();
  private lastHand: Record<string, number> | undefined;
  /** Seeds already-known values (`your_value` from `/api/me`, or a disk cache with its timestamp). */
  seedValues(values: Readonly<Record<string, number>>, at: number = Date.now()): void {
    for (const [card, v] of Object.entries(values)) {
      const cur = this.valueCache.get(card);
      if (!cur || cur.at <= at) this.valueCache.set(card, { v, at });
    }
  }
  /** Cached values that are still fresh (to store or display them). */
  cachedValues(): Record<string, number> {
    const now = Date.now();
    return Object.fromEntries([...this.valueCache].filter(([, x]) => now - x.at < BazaarClient.VALUE_TTL_MS).map(([k, x]) => [k, x.v]));
  }
  /**
   * Current hand (copies per card): forgets the values of every set where some count changed since last time. A value
   * depends on the rest of its set (page bonus): SAL-09 was 91 with the page at 8/10 and 177.1 at 9/10.
   */
  noteHand(byRef: Readonly<Record<string, number>>): void {
    if (this.lastHand) {
      const changed = new Set<string>();
      for (const ref of new Set([...Object.keys(byRef), ...Object.keys(this.lastHand)])) if ((byRef[ref] ?? 0) !== (this.lastHand[ref] ?? 0)) changed.add(setOf(ref));
      for (const ref of [...this.valueCache.keys()]) if (changed.has(setOf(ref))) this.valueCache.delete(ref);
    }
    this.lastHand = { ...byRef };
  }
  /** Hand last seen by `noteHand` (saved with the disk cache). */
  hand(): Readonly<Record<string, number>> | undefined {
    return this.lastHand;
  }
  myThreads(status?: string) {
    return this.request("GET", `/api/me/threads${status ? `?status=${encodeURIComponent(status)}` : ""}`, ThreadListSchema);
  }
  thread(id: number): Promise<Thread> {
    return this.request("GET", `/api/threads/${id}`, ThreadSchema);
  }
  openThread(withId: string, topic: Topic): Promise<Thread> {
    return this.request("POST", "/api/threads", ThreadSchema, { with: withId, topic });
  }
  say(threadId: number, text: string, price?: number) {
    return this.request("POST", `/api/threads/${threadId}/messages`, SayResultSchema, price === undefined ? { text } : { text, price: Math.round(price) });
  }
  closeThread(threadId: number): Promise<unknown> {
    return this.raw("POST", `/api/threads/${threadId}/close`);
  }
  accept(offerId: number): Promise<unknown> {
    return this.raw("POST", `/api/offers/${offerId}/accept`, {});
  }
  /** Public offers of a venue (El Rastro by default). Validated in `trades.ts` (`parseOffers`). */
  board(venue = "rastro"): Promise<unknown> {
    return this.raw("GET", `/api/venues/${encodeURIComponent(venue)}/offers`);
  }
  /** Our open/queued offers and those addressed to us (`parseMyOffers`). */
  myOffers(): Promise<unknown> {
    return this.raw("GET", "/api/me/offers");
  }
  feed(limit = 100): Promise<unknown> {
    return this.raw("GET", `/api/feed?limit=${Math.max(1, Math.round(limit))}`);
  }
  postOffer(body: { venue: string; give: Record<string, unknown>; want: Record<string, unknown>; to?: string; expires_in_ticks?: number }): Promise<unknown> {
    return this.raw("POST", "/api/offers", body);
  }
  cancelOffer(offerId: number): Promise<unknown> {
    return this.raw("DELETE", `/api/offers/${offerId}`);
  }
  /** Accepts an offer; `assets` chooses which of our copies we hand over when it asks for a card type. */
  acceptOffer(offerId: number, assets?: number[]): Promise<unknown> {
    return this.raw("POST", `/api/offers/${offerId}/accept`, assets?.length ? { assets } : {});
  }
}
