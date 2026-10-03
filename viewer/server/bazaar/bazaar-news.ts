import { readdir, readFile } from "node:fs/promises";
import type { ApiResponse } from "../api.js";
import { isSafeId, resolveInside } from "../paths.js";

/**
 * `GET /api/bazaar/news`: the summary that `pnpm bazaar:news` writes in `<dir>/<date>/news-summary.json`.
 * File only, never a call to the Bazaar. Today's local date (the recorder's convention) or, if it has no
 * summary yet, the most recent date that has one. Display only: `{ available: false }` when there is none.
 */
export async function bazaarNews(dir: string, now: Date = new Date()): Promise<ApiResponse> {
  const ok = (data: unknown): ApiResponse => ({ status: 200, body: { data, errors: [] } });
  let dates: string[];
  try {
    dates = (await readdir(dir)).filter((d) => isSafeId(d) && /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse();
  } catch {
    return ok({ available: false });
  }
  const today = now.toLocaleDateString("sv-SE");
  for (const date of [today, ...dates.filter((d) => d !== today)]) {
    const file = await resolveInside(dir, date, "news-summary.json");
    if (!file) continue;
    try {
      const parsed = JSON.parse(await readFile(file, "utf8")) as unknown;
      if (parsed && typeof parsed === "object") return ok({ available: true, date, ...(parsed as Record<string, unknown>) });
    } catch {
      // half-written or broken: try an older date
    }
  }
  return ok({ available: false });
}
