// Shared pieces of `pnpm bazaar:doctor`, `pnpm bazaar:up` and `pnpm bazaar:down`. Read-only; never prints keys.
import { existsSync } from "node:fs";
import { connect } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DEFAULT_VIEWER_PORT = 5199;
export const STATUS_FILE = join(ROOT, "results", "logs", "up-status.json");
export const DEFAULT_URL = "https://bazaar.causaprima.ai";

/** Local date YYYY-MM-DD, like the recorder's `results/bazaar-live/` folders. */
export const localDate = (d = new Date()) => d.toLocaleDateString("sv-SE");

/** Loads `.env` into `process.env` (what is already exported wins) and returns URL and key. */
export function loadEnv() {
  const file = join(ROOT, ".env");
  if (existsSync(file)) process.loadEnvFile(file);
  const key = process.env.BAZAAR_KEY?.trim() || undefined;
  const url = (process.env.BAZAAR_URL?.trim() || DEFAULT_URL).replace(/\/+$/, "");
  return { file, exists: existsSync(file), url, key };
}

/** GET to the Bazaar API with the team key; throws with the HTTP code on failure. */
export async function apiGet(env, path, timeoutMs = 10_000) {
  const r = await fetch(`${env.url}${path}`, { headers: { "X-Team-Key": env.key ?? "" }, signal: AbortSignal.timeout(timeoutMs) });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
}

/** Is anything listening on 127.0.0.1:port? */
export function portInUse(port, timeoutMs = 1500) {
  return new Promise((done) => {
    const s = connect({ host: "127.0.0.1", port });
    const end = (v) => {
      s.destroy();
      done(v);
    };
    s.setTimeout(timeoutMs, () => end(true));
    s.once("connect", () => end(true));
    s.once("error", () => end(false));
  });
}

/** "free" (nothing listening), "viewer" (answers /api/bazaar/score with JSON) or "other". */
export async function probeViewer(port) {
  if (!(await portInUse(port))) return "free";
  try {
    const r = await fetch(`http://127.0.0.1:${port}/api/bazaar/score`, { signal: AbortSignal.timeout(3000) });
    return r.ok && (r.headers.get("content-type") ?? "").includes("json") ? "viewer" : "other";
  } catch {
    return "other";
  }
}

/** One clock line: tick, game time, doors, pause. */
export const clockLine = (c) =>
  `tick ${c.tick} · game time ${c.t_hours ?? "?"} · doors ${c.doors ?? "?"}${c.paused ? " · paused" : ""}${c.round_name ? ` · ${c.round_name}` : ""}${c.doors !== "open" && c.next_opens ? ` · opens ${c.next_opens}` : ""}`;

/** Is process pid still alive? */
export function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
}
