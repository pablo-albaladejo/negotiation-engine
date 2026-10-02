import { useEffect, useState } from "react";
import { fetchApi } from "./api.js";
import { bazaarModel, type BazaarLiveInfo, type BazaarModel, type ScoreSnapshot } from "./model/index.js";

const POLL_MS = 10_000;

/** `/api/bazaar/score` (snapshots logueados) + `/api/bazaar/live` (reloj en vivo, si hay clave),
 * sondeados cada ~10 s; el sondeo se detiene mientras la pestaña está oculta. Nunca calcula: solo
 * arma el modelo puro a partir de lo que ya sirvió el servidor. */
export function useBazaarData(): { model: BazaarModel; live: BazaarLiveInfo | null } {
  const [snapshots, setSnapshots] = useState<ScoreSnapshot[]>([]);
  const [live, setLive] = useState<BazaarLiveInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (document.hidden) return;
      try {
        const score = await fetchApi<ScoreSnapshot[]>("bazaar/score");
        if (!cancelled) setSnapshots(score.data ?? []);
      } catch {
        // deja el último valor conocido
      }
      try {
        const res = await fetchApi<BazaarLiveInfo | null>("bazaar/live");
        if (!cancelled) setLive(res.data ?? null);
      } catch {
        if (!cancelled) setLive(null);
      }
    };
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    const onVisibility = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return { model: bazaarModel(snapshots), live };
}
