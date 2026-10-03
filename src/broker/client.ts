import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { BazaarError, TokenBucket } from "../shared/client.js";
import { DEFAULT_BAZAAR_URL } from "../shared/env.js";
import { ClockSchema, ErrorBodySchema, type Clock } from "../shared/schemas.js";

export interface BrokerEnv {
  url: string;
  /** Broker key (X-Broker-Key header). Never printed or written to traces. */
  key: string | undefined;
}

/**
 * Reads `BAZAAR_BROKER_KEY` (or `BROKER_KEY`) and `BAZAAR_URL`; loads `.env.broker` and `.env` from the root if
 * they exist (variables already exported take priority).
 */
export function loadBrokerEnv(options: { env?: NodeJS.ProcessEnv; cwd?: string } = {}): BrokerEnv {
  const env = options.env ?? process.env;
  if (!options.env) {
    for (const name of [".env.broker", ".env"]) {
      const file = resolve(options.cwd ?? process.cwd(), name);
      if (existsSync(file)) process.loadEnvFile(file);
    }
  }
  const key = (env.BAZAAR_BROKER_KEY ?? env.BROKER_KEY)?.trim();
  return { url: (env.BAZAAR_URL?.trim() || DEFAULT_BAZAAR_URL).replace(/\/+$/, ""), key: key ? key : undefined };
}

export interface BrokerClientOptions {
  url: string;
  key: string;
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  ratePerSec?: number;
  burst?: number;
  retries?: number;
  timeoutMs?: number;
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Broker client: book, clock, matches and announcement. Same token bucket as `BazaarClient`; writes are not retried after a network failure. */
export class BrokerClient {
  private readonly fetchFn: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly bucket: TokenBucket;
  private readonly retries: number;
  private readonly timeoutMs: number;
  readonly url: string;
  readonly #key: string;

  constructor(options: BrokerClientOptions) {
    this.url = options.url.replace(/\/+$/, "");
    this.#key = options.key;
    this.fetchFn = options.fetch ?? fetch;
    this.sleep = options.sleep ?? realSleep;
    this.bucket = new TokenBucket(options.ratePerSec ?? 4, options.burst ?? 2, options.now ?? Date.now, this.sleep);
    this.retries = options.retries ?? 3;
    this.timeoutMs = options.timeoutMs ?? 15_000;
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
      if (err.code === "rate_limited") await this.sleep(250 * attempt);
      else if (err.code === "network" && method === "GET") await this.sleep(500 * attempt);
      else throw err;
    }
  }

  private async once(method: string, path: string, body?: unknown): Promise<unknown> {
    const headers: Record<string, string> = { "X-Broker-Key": this.#key, Accept: "application/json" };
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
    const { error, message, ...extra } = (parsed.success ? parsed.data : {}) as Record<string, unknown> & { error?: string; message?: string };
    const code = error ?? (res.status === 422 ? "invalid" : res.status === 401 ? "bad_key" : `http_${res.status}`);
    throw new BazaarError(code, message ?? "", res.status, extra);
  }

  async clock(): Promise<Clock & { t_hours?: number }> {
    const parsed = ClockSchema.safeParse(await this.raw("GET", "/api/clock"));
    if (!parsed.success) throw new BazaarError("bad_response", "GET /api/clock: unexpected shape", 200);
    return parsed.data as Clock & { t_hours?: number };
  }
  /** Venue book (validated with `parseBrokerBook`). */
  book(): Promise<unknown> {
    return this.raw("GET", "/api/broker/book");
  }
  /** Calendar (`action: bench`, `at_hours`) to know when the Market Test runs. */
  schedule(): Promise<unknown> {
    return this.raw("GET", "/api/schedule");
  }
  /** Public markets (to read our venue's mechanism). */
  venues(): Promise<unknown> {
    return this.raw("GET", "/api/venues");
  }
  match(sell: string | number, buy: string | number, price: number): Promise<unknown> {
    return this.raw("POST", "/api/broker/matches", { sell, buy, price: Math.round(price) });
  }
  announce(text: string): Promise<unknown> {
    return this.raw("POST", "/api/broker/announce", { text });
  }
}
