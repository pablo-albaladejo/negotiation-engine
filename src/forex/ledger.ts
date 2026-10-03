import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { FeedEvent } from "../state/world.js";

/**
 * Every public single-card deal with a dealer today (any team), from the feed each tick and, on the first tick, from
 * the recorder's `stream-public.jsonl`. Structure only (who, which card, price), never text. Kept in
 * `dealer-trades.json` in the day folder so a restart keeps the history.
 */
export interface DealerTrade {
  id: number;
  tick: number;
  dealer: string;
  /** From the dealer's side: `sells` = a team bought from her; `buys` = a team sold to her. */
  side: "sells" | "buys";
  ref: string;
  rarity?: string;
  price: number;
  team?: string;
}

const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const obj = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});

/** A settlement payload → a dealer trade, or undefined if it is not one card for cash with a persona. */
export function dealerTradeOf(payload: Record<string, unknown>, tick: number): DealerTrade | undefined {
  const dealer = typeof payload.persona === "string" ? payload.persona : undefined;
  const id = num(payload.settlement);
  const price = num(payload.price);
  if (!dealer || id === undefined || price === undefined) return undefined;
  const items = (Array.isArray(payload.items) ? payload.items : []).map(obj);
  const cards = items.filter((i) => i.kind === "card");
  if (cards.length !== 1) return undefined;
  const c = cards[0]!;
  const ref = typeof c.ref === "string" ? c.ref : undefined;
  if (!ref) return undefined;
  const side = c.to === dealer ? "buys" : "sells";
  const team = side === "buys" ? c.frm : c.to;
  return { id, tick: num(payload.tick) ?? tick, dealer, side, ref, ...(typeof c.rarity === "string" ? { rarity: c.rarity } : {}), price, ...(typeof team === "string" ? { team } : {}) };
}

const ledgers = new Map<string, Map<number, DealerTrade>>();

function seed(dir: string): Map<number, DealerTrade> {
  const out = new Map<number, DealerTrade>();
  try {
    const saved = join(dir, "dealer-trades.json");
    if (existsSync(saved)) for (const t of JSON.parse(readFileSync(saved, "utf8")).trades as DealerTrade[]) out.set(t.id, t);
    const stream = join(dir, "stream-public.jsonl");
    if (existsSync(stream)) {
      for (const line of readFileSync(stream, "utf8").split("\n")) {
        if (!line.includes('"settlement"') || !line.includes('"persona"')) continue;
        try {
          const d = obj(obj(JSON.parse(line)).data);
          const t = dealerTradeOf(obj(d.payload), num(d.tick) ?? 0);
          if (t) out.set(t.id, t);
        } catch {
          // A torn line at the end of the recorder's file.
        }
      }
    }
  } catch {
    // No history yet: the feed fills it from now on.
  }
  return out;
}

/** Adds this tick's feed settlements to the day's ledger and saves it (best effort); returns every trade, oldest first. */
export function updateDealerLedger(dir: string, events: readonly FeedEvent[], tick: number): DealerTrade[] {
  let ledger = ledgers.get(dir);
  if (!ledger) ledgers.set(dir, (ledger = seed(dir)));
  let fresh = 0;
  for (const e of events) {
    if (e.type !== "settlement") continue;
    const t = dealerTradeOf(e.payload, e.tick ?? tick);
    if (t && !ledger.has(t.id)) {
      ledger.set(t.id, t);
      fresh++;
    }
  }
  const trades = [...ledger.values()].sort((a, b) => a.tick - b.tick || a.id - b.id);
  if (fresh || !existsSync(join(dir, "dealer-trades.json"))) {
    try {
      mkdirSync(dir, { recursive: true });
      const path = join(dir, "dealer-trades.json");
      writeFileSync(`${path}.tmp`, JSON.stringify({ tick, trades }));
      renameSync(`${path}.tmp`, path);
    } catch {
      // The file is a cache; the in-memory ledger still serves this run.
    }
  }
  return trades;
}
