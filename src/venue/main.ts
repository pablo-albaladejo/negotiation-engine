import { chmodSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { BazaarClient } from "../shared/client.js";
import { loadBazaarEnv } from "../shared/env.js";
import { formatVenuePlan, planVenue, type Mechanism } from "./venue.js";

/**
 * `pnpm bazaar:venue --dry-run`: prints which venue it would open (GET only). Actually opening requires dropping
 * `--dry-run` AND passing `--confirm`, and meeting level ≥ 2 and cash ≥ 270. The broker key is saved in
 * `.env.broker` (git-ignored, mode 600) and never printed.
 */
export type VenueApi = Pick<BazaarClient, "me" | "venues" | "clock" | "openVenue">;

export async function runVenueCli(argv: string[], log: (line: string) => void = console.log, api?: VenueApi): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      "dry-run": { type: "boolean", default: false },
      confirm: { type: "boolean", default: false },
      name: { type: "string" },
      mechanism: { type: "string", default: "auto" },
    },
  });
  const mechanism = values.mechanism as Mechanism;
  if (mechanism !== "auto" && mechanism !== "board") throw new Error("--mechanism must be auto or board");
  let client = api;
  if (!client) {
    const env = loadBazaarEnv();
    if (!env.key) {
      log("Missing BAZAAR_KEY (set it in .env or in the environment).");
      return 2;
    }
    client = new BazaarClient({ url: env.url, key: env.key });
  }
  const [me, venues, clock] = await Promise.all([client.me(), client.venues(), client.clock()]);
  const plan = planVenue(me, venues.venues, clock, { ...(values.name ? { name: values.name } : {}), mechanism });
  const dryRun = values["dry-run"] || !values.confirm;
  for (const line of formatVenuePlan(plan, dryRun)) log(line);
  if (values["dry-run"]) {
    log("DRY-RUN: nothing sent.");
    return 0;
  }
  if (!values.confirm) {
    log("REFUSED: opening a venue spends 270 P; run without --dry-run AND with --confirm (only with the user's approval).");
    return 2;
  }
  if (!plan.ok) {
    log("REFUSED: requirements not met.");
    return 2;
  }
  const res = (await client.openVenue(plan.body)) as Record<string, unknown>;
  const { broker_key: brokerKey, ...rest } = res;
  if (typeof brokerKey === "string") {
    const file = resolve(process.cwd(), ".env.broker");
    writeFileSync(file, `BAZAAR_BROKER_KEY=${brokerKey}\n`, { mode: 0o600 });
    chmodSync(file, 0o600);
    log(`broker key received and saved to ${file} (not printed)`);
  }
  log(`opened: ${JSON.stringify(rest)}`);
  return 0;
}

if (process.argv[1] && /venue\/main\.[cm]?[jt]s$/.test(process.argv[1])) {
  runVenueCli(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e: unknown) => {
      console.error(e instanceof Error ? e.message : String(e));
      process.exit(1);
    },
  );
}
