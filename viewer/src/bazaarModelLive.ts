import { useEffect, useState } from "react";
import { fetchApi } from "./api.js";
import { gameModelOf, type GameModel } from "./model/gameModel.js";

const MIN_MS = 10_000;
const MAX_MS = 180_000;

/**
 * `/api/bazaar/model` (nuestro modelo interno, cacheado en el servidor un tick). Solo se pide mientras
 * `enabled` (vista Model abierta o una conversación abierta): el servidor solo construye el modelo cuando
 * alguien lo mira. Se refresca según `next_refresh_ms` y se detiene con la pestaña oculta.
 */
export function useBazaarModel(enabled: boolean): { model: GameModel | null; loading: boolean } {
  const [model, setModel] = useState<GameModel | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      if (timer) clearTimeout(timer);
      if (document.hidden) return;
      let next: GameModel | null = null;
      setLoading(true);
      try {
        const res = await fetchApi<unknown>("bazaar/model");
        next = gameModelOf(res.data);
        if (!cancelled && next) setModel(next);
      } catch {
        // deja el último valor conocido
      }
      if (!cancelled) {
        setLoading(false);
        timer = setTimeout(() => void load(), Math.min(MAX_MS, Math.max(MIN_MS, next?.next_refresh_ms ?? 30_000)));
      }
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
  }, [enabled]);

  return { model, loading };
}
