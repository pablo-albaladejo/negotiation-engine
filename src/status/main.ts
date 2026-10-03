import { BazaarClient } from "../shared/client.js";
import { loadBazaarEnv } from "../shared/env.js";
import { rarityOf, spareTargets } from "../dealers/planning/planner.js";
import { extractScoreFields, formatScoreBreakdown } from "../shared/score.js";

/** `pnpm bazaar:status`: read-only summary (team, clock, dealers, levels, threads). Never prints the key. */
async function main() {
  const env = loadBazaarEnv();
  if (!env.key) {
    console.error("BAZAAR_KEY is missing (put it in .env or the environment).");
    process.exit(2);
  }
  const c = new BazaarClient({ url: env.url, key: env.key });
  const [me, clock, dealers, levels, threads] = await Promise.all([c.me(), c.clock(), c.dealers(), c.levels(), c.myThreads()]);
  const cards = me.assets.filter((a) => a.kind === "card");
  const byRarity = new Map<string, number>();
  for (const a of cards) byRarity.set(rarityOf(a) ?? "?", (byRarity.get(rarityOf(a) ?? "?") ?? 0) + 1);
  console.log(`team ${me.name ?? "?"} · cash ${me.cash} P · level ${me.level ?? "?"} · unlocked ${(me.unlocked ?? me.unlocked_dealers ?? []).join(", ") || "-"}`);
  console.log(`assets: ${cards.length} cards (${[...byRarity].map(([r, n]) => `${r} ${n}`).join(", ")}), ${me.assets.length - cards.length} packs · spares ${spareTargets(me).length}`);
  const score = extractScoreFields(me);
  if (score) for (const line of formatScoreBreakdown(score)) console.log(line);
  else console.log("score: not logged");
  console.log(`clock: tick ${clock.tick} · ${clock.tick_seconds ?? "?"} s · ${clock.paused ? "PAUSED" : "running"} · next in ${clock.next_tick_in ?? "?"} s`);
  if (clock.limits) console.log(`limits: ${Object.entries(clock.limits).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(" ")}`);
  for (const d of dealers.dealers) console.log(`dealer ${d.id} · ${d.name ?? ""} · level ${d.level ?? "-"} · ${d.status ?? ""}`);
  const lv = levels && typeof levels === "object" ? (levels as Record<string, unknown>) : {};
  const list = Array.isArray(lv.levels) ? lv.levels : [];
  for (const l of list) {
    const o = (l && typeof l === "object" ? l : {}) as Record<string, unknown>;
    console.log(`level ${String(o.level ?? o.id ?? "?")} · ${String(o.name ?? "")} · ${String(o.status ?? "")}`);
  }
  for (const t of threads.threads) console.log(`thread ${t.id} · with ${t.with ?? "?"} · ${t.status ?? "?"}`);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
