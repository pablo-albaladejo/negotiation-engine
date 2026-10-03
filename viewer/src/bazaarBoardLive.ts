import { useEffect, useState } from "react";
import { fetchApi } from "./api.js";
import { bazaarModel, boardModel, EMPTY_BOARD, type Board, type BazaarModel, type ScoreSnapshot } from "./model/index.js";

const MIN_MS = 3_000;
const MAX_MS = 120_000;

/** Delay until the next refresh: the one the server asks for (next game tick + margin), clamped. */
export function nextDelay(board: Board | null): number {
  const ms = board?.next_refresh_ms ?? 30_000;
  return Math.min(MAX_MS, Math.max(MIN_MS, ms));
}

/** `/api/bazaar/board` (unified view, cached on the server until the next tick) +
 * `/api/bazaar/score` (our local snapshots). Refreshes once per game tick, following
 * `next_refresh_ms` (never a tight poll); stops while the tab is hidden and reloads on return. */
export function useBazaarBoard(): { board: Board; model: BazaarModel } {
  const [board, setBoard] = useState<Board>(EMPTY_BOARD);
  const [snapshots, setSnapshots] = useState<ScoreSnapshot[]>([]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      if (timer) clearTimeout(timer);
      if (document.hidden) return;
      let next: Board | null = null;
      try {
        const res = await fetchApi<Board | null>("bazaar/board");
        next = boardModel(res.data);
        if (!cancelled) setBoard(next);
      } catch {
        // keep the last known value
      }
      try {
        const score = await fetchApi<ScoreSnapshot[]>("bazaar/score");
        if (!cancelled) setSnapshots(score.data ?? []);
      } catch {
        // keep the last known value
      }
      if (!cancelled) timer = setTimeout(() => void load(), nextDelay(next));
    };
    void load();
    const onVisibility = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return { board, model: bazaarModel(snapshots) };
}
