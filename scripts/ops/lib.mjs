// Piezas comunes de `pnpm bazaar:doctor`, `pnpm bazaar:up` y `pnpm bazaar:down`. Solo lectura; nunca imprime claves.
import { existsSync } from "node:fs";
import { connect } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DEFAULT_VIEWER_PORT = 5199;
export const STATUS_FILE = join(ROOT, "results", "logs", "up-status.json");
export const DEFAULT_URL = "https://bazaar.causaprima.ai";

/** Fecha local AAAA-MM-DD, como las carpetas de `results/bazaar-live/` del grabador. */
export const localDate = (d = new Date()) => d.toLocaleDateString("sv-SE");

/** Carga `.env` en `process.env` (lo ya exportado manda) y devuelve URL y clave. */
export function loadEnv() {
  const file = join(ROOT, ".env");
  if (existsSync(file)) process.loadEnvFile(file);
  const key = process.env.BAZAAR_KEY?.trim() || undefined;
  const url = (process.env.BAZAAR_URL?.trim() || DEFAULT_URL).replace(/\/+$/, "");
  return { file, exists: existsSync(file), url, key };
}

/** GET a la API del Bazaar con la clave del equipo; lanza con el código HTTP si falla. */
export async function apiGet(env, path, timeoutMs = 10_000) {
  const r = await fetch(`${env.url}${path}`, { headers: { "X-Team-Key": env.key ?? "" }, signal: AbortSignal.timeout(timeoutMs) });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
}

/** ¿Hay algo escuchando en 127.0.0.1:port? */
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

/** "free" (nada escucha), "viewer" (responde /api/bazaar/score con JSON) u "other". */
export async function probeViewer(port) {
  if (!(await portInUse(port))) return "free";
  try {
    const r = await fetch(`http://127.0.0.1:${port}/api/bazaar/score`, { signal: AbortSignal.timeout(3000) });
    return r.ok && (r.headers.get("content-type") ?? "").includes("json") ? "viewer" : "other";
  } catch {
    return "other";
  }
}

/** Una línea del reloj: tick, hora de juego, puertas, pausa. */
export const clockLine = (c) =>
  `tick ${c.tick} · hora de juego ${c.t_hours ?? "?"} · puertas ${c.doors ?? "?"}${c.paused ? " · en pausa" : ""}${c.round_name ? ` · ${c.round_name}` : ""}${c.doors !== "open" && c.next_opens ? ` · abre ${c.next_opens}` : ""}`;

/** ¿El proceso pid sigue vivo? */
export function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
}
