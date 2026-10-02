import { existsSync } from "node:fs";
import { resolve } from "node:path";

export const DEFAULT_BAZAAR_URL = "https://bazaar.causaprima.ai";

export interface BazaarEnv {
  url: string;
  /** Clave del equipo (cabecera X-Team-Key). Nunca se imprime ni se escribe en trazas. */
  key: string | undefined;
}

/**
 * Lee `BAZAAR_URL` y `BAZAAR_KEY` del entorno; si existe `.env` en la raíz, lo carga antes
 * (`process.loadEnvFile`, sin dependencias). Las variables ya exportadas tienen prioridad.
 */
export function loadBazaarEnv(options: { envFile?: string; env?: NodeJS.ProcessEnv } = {}): BazaarEnv {
  const env = options.env ?? process.env;
  const file = options.envFile ?? resolve(process.cwd(), ".env");
  if (!options.env && existsSync(file)) process.loadEnvFile(file);
  const key = env.BAZAAR_KEY?.trim();
  return { url: (env.BAZAAR_URL?.trim() || DEFAULT_BAZAAR_URL).replace(/\/+$/, ""), key: key ? key : undefined };
}
