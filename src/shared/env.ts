import { existsSync } from "node:fs";
import { resolve } from "node:path";

export const DEFAULT_BAZAAR_URL = "https://bazaar.causaprima.ai";

export interface BazaarEnv {
  url: string;
  /** Team key (X-Team-Key header). Never printed or written to traces. */
  key: string | undefined;
}

/**
 * Reads `BAZAAR_URL` and `BAZAAR_KEY` from the environment; if a root `.env` exists, it is loaded first
 * (`process.loadEnvFile`, no dependencies). Already-exported variables take priority.
 */
export function loadBazaarEnv(options: { envFile?: string; env?: NodeJS.ProcessEnv } = {}): BazaarEnv {
  const env = options.env ?? process.env;
  const file = options.envFile ?? resolve(process.cwd(), ".env");
  if (!options.env && existsSync(file)) process.loadEnvFile(file);
  const key = env.BAZAAR_KEY?.trim();
  return { url: (env.BAZAAR_URL?.trim() || DEFAULT_BAZAAR_URL).replace(/\/+$/, ""), key: key ? key : undefined };
}
