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

/** Petición rechazada. `code` es el código del servidor (`wait_for_tick`, `insufficient_cash`...); `status` 0 = sin respuesta. */
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

/** Cubo de fichas: `ratePerSec` peticiones por segundo con ráfaga `burst`. Reloj y espera inyectables. */
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
  /** Peticiones por segundo (por debajo del límite de 5 del servidor). */
  ratePerSec?: number;
  burst?: number;
  retries?: number;
  /** Ante `wait_for_tick`, dormir hasta el siguiente tick y reintentar (si no, se lanza el error). */
  waitOnTick?: boolean;
  timeoutMs?: number;
}

export type Topic =
  | { buy: { pack: string } }
  | { buy: { card: string } }
  | { buy: { rarity: string; set: string } }
  | { sell: { assets: number[] } };

/** Rutas y códigos de los fallos de validación (nunca valores: la respuesta no se vuelca al log). */
export function zodIssues(error: z.ZodError): string {
  const parts = error.issues.slice(0, 5).map((i) => `${i.path.length ? i.path.join(".") : "(root)"}: ${i.code}${"expected" in i ? ` expected ${String(i.expected)}` : ""}`);
  return parts.join("; ") + (error.issues.length > 5 ? `; +${error.issues.length - 5} more` : "");
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Cliente HTTP del Bazaar (equipo). La clave solo viaja en la cabecera; nunca aparece en errores ni logs. */
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

  /** Milisegundos hasta el siguiente tick: `next_tick_in` del error, si no del reloj (+200 ms de margen). */
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
  /** Abre un mercado propio (nivel ≥ 2, 250 P de fianza + 20 P). Solo desde `bazaar:venue` sin --dry-run y con --confirm. */
  openVenue(body: { name: string; fee_bps: number; fee_per_card: number; rules: Record<string, unknown>; description: string }): Promise<unknown> {
    return this.raw("POST", "/api/venues", body);
  }
  levels(): Promise<unknown> {
    return this.raw("GET", "/api/levels");
  }
  me(): Promise<Me> {
    return this.request("GET", "/api/me", MeSchema);
  }
  async value(card: string): Promise<number> {
    return (await this.request("GET", `/api/me/value?card=${encodeURIComponent(card)}`, ValueSchema)).your_value;
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
  /** Ofertas públicas de un venue (El Rastro por defecto). Se validan en `trades.ts` (`parseOffers`). */
  board(venue = "rastro"): Promise<unknown> {
    return this.raw("GET", `/api/venues/${encodeURIComponent(venue)}/offers`);
  }
  /** Nuestras ofertas abiertas/en cola y las dirigidas a nosotros (`parseMyOffers`). */
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
  /** Acepta una oferta; `assets` elige qué copias nuestras entregamos cuando pide un tipo de carta. */
  acceptOffer(offerId: number, assets?: number[]): Promise<unknown> {
    return this.raw("POST", `/api/offers/${offerId}/accept`, assets?.length ? { assets } : {});
  }
}
